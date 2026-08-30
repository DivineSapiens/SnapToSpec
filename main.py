import os
import json
import base64
import uuid
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import FastAPI, BackgroundTasks, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from integrations import FirestoreStateTracker, publish_pipeline_results
from process_video import process_video_pipeline

app = FastAPI(
    title="SnapToSpec - Autonomous Video-to-Spec Agent Pipeline",
    version="1.0.0",
    description="Converts screencast videos into structured technical specifications, extracted frame screenshots, and Playwright tests."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("./frames", exist_ok=True)
app.mount("/frames", StaticFiles(directory="./frames"), name="frames")


TASK_STORE = {}

def update_memory_and_firestore(task_id: str, status: str, metadata: Optional[Dict[str, Any]] = None):
    entry = TASK_STORE.get(task_id, {"task_id": task_id})
    entry["status"] = status
    entry["updated_at"] = datetime.now(timezone.utc).isoformat()
    if metadata:
        entry.update(metadata)
    TASK_STORE[task_id] = entry
    
    tracker = FirestoreStateTracker()
    tracker.update_task_state(task_id, status, metadata)


# =======================================================
# Request Schemas
# =======================================================
class DirectProcessRequest(BaseModel):
    video_path: Optional[str] = None
    gcs_uri: Optional[str] = None
    output_bucket: Optional[str] = None

class PubSubMessage(BaseModel):
    message: Dict[str, Any]
    subscription: Optional[str] = None


# =======================================================
# Background Processing Worker
# =======================================================
def execute_pipeline_task(
    video_local_path: str,
    task_id: str,
    output_bucket: Optional[str] = None,
    cleanup_temp_dir: Optional[str] = None
):
    frames_dir = f"./frames/{task_id}"

    try:
        update_memory_and_firestore(task_id, "PROCESSING", {"video_path": video_local_path})
        print(f"[*] Starting SnapToSpec execution for Task `{task_id}`...")

        # Step 1: Multimodal analysis + frame extraction
        pipeline_res = process_video_pipeline(video_local_path, output_frames_dir=frames_dir)
        spec = pipeline_res["spec"]
        frame_paths = pipeline_res["frame_paths"]
        
        update_memory_and_firestore(task_id, "ANALYZED", {"frame_count": len(frame_paths), "spec": spec})

        # Step 2: GCS asset upload + GitHub issue publishing + Firestore completion
        pub_res = publish_pipeline_results(
            task_id=task_id,
            spec=spec,
            local_frames=frame_paths,
            gcs_bucket=output_bucket or os.getenv("GCS_OUTPUT_BUCKET")
        )
        
        update_memory_and_firestore(task_id, "COMPLETED", {
            "spec": spec,
            "github_issue_url": pub_res.get("github_result", {}).get("issue_url"),
            "frame_urls": list(pub_res.get("frame_urls", {}).values())
        })
        print(f"[+] Task `{task_id}` completed successfully!")

    except Exception as e:
        print(f"[!] Pipeline execution failed for `{task_id}`: {e}")
        update_memory_and_firestore(task_id, "FAILED", {"error": str(e)})

    finally:
        # Cleanup temporary upload folder (keep frames_dir for immediate dashboard & local serving)
        if cleanup_temp_dir and os.path.exists(cleanup_temp_dir):
            shutil.rmtree(cleanup_temp_dir, ignore_errors=True)


# =======================================================
# Endpoints
# =======================================================
@app.get("/")
def root():
    return {
        "service": "SnapToSpec Agent API",
        "status": "online",
        "endpoints": ["/health", "/process", "/upload", "/task/{task_id}", "/tasks", "/pubsub"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "snaptospec-pipeline"}

@app.get("/task/{task_id}")
def get_task_status(task_id: str):
    # Check in-memory store first
    if task_id in TASK_STORE:
        return TASK_STORE[task_id]
    
    # Check Firestore
    try:
        tracker = FirestoreStateTracker()
        doc = tracker.db.collection(tracker.collection_name).document(task_id).get()
        if doc.exists:
            data = doc.to_dict()
            TASK_STORE[task_id] = data
            return data
    except Exception as e:
        print(f"[!] Firestore lookup error: {e}")
        
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/tasks")
def list_tasks():
    return list(TASK_STORE.values())

@app.post("/process")
def process_direct(req: DirectProcessRequest, background_tasks: BackgroundTasks):
    """
    Direct API endpoint to trigger pipeline on local or mounted video.
    """
    if not req.video_path and not req.gcs_uri:
        raise HTTPException(status_code=400, detail="Either video_path or gcs_uri must be provided.")

    task_id = str(uuid.uuid4())[:8]

    # Handle GCS URI download if needed
    local_path = req.video_path
    temp_dir = None

    if req.gcs_uri:
        from google.cloud import storage
        temp_dir = tempfile.mkdtemp(prefix=f"snaptospec_{task_id}_")
        local_path = os.path.join(temp_dir, "input_video.mp4")
        
        parts = req.gcs_uri.replace("gs://", "").split("/", 1)
        bucket_name, blob_name = parts[0], parts[1]
        
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        blob.download_to_filename(local_path)

    background_tasks.add_task(
        execute_pipeline_task,
        video_local_path=local_path,
        task_id=task_id,
        output_bucket=req.output_bucket or os.getenv("GCS_OUTPUT_BUCKET"),
        cleanup_temp_dir=temp_dir
    )

    return {
        "task_id": task_id,
        "status": "QUEUED",
        "message": "Video processing initiated asynchronously."
    }

@app.post("/upload")
async def upload_and_process(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_bucket: Optional[str] = Form(None)
):
    """
    Accepts a direct multipart video upload from dashboard and triggers autonomous pipeline.
    """
    task_id = str(uuid.uuid4())[:8]
    temp_dir = tempfile.mkdtemp(prefix=f"snaptospec_{task_id}_")
    local_video_path = os.path.join(temp_dir, file.filename or f"video_{task_id}.mp4")

    with open(local_video_path, "wb") as f:
        content = await file.read()
        f.write(content)

    background_tasks.add_task(
        execute_pipeline_task,
        video_local_path=local_video_path,
        task_id=task_id,
        output_bucket=output_bucket or os.getenv("GCS_OUTPUT_BUCKET"),
        cleanup_temp_dir=temp_dir
    )

    return {
        "task_id": task_id,
        "status": "QUEUED",
        "filename": file.filename,
        "message": "Video uploaded and pipeline execution triggered asynchronously."
    }

@app.post("/pubsub")
async def handle_pubsub_push(request: Request, background_tasks: BackgroundTasks):
    """
    Pub/Sub push endpoint triggered by GCS OBJECT_FINALIZE events.
    """
    body = await request.json()
    if not body or "message" not in body:
        raise HTTPException(status_code=400, detail="Invalid Pub/Sub payload structure.")

    pubsub_msg = body["message"]
    data_b64 = pubsub_msg.get("data", "")
    
    if not data_b64:
        return {"status": "ignored", "reason": "No data in message"}

    raw_data = base64.b64decode(data_b64).decode("utf-8")
    event_payload = json.loads(raw_data)

    bucket_name = event_payload.get("bucket")
    object_name = event_payload.get("name")

    if not bucket_name or not object_name:
        return {"status": "ignored", "reason": "Missing bucket or name"}

    # Only process video files (.mp4, .webm, .mov)
    valid_exts = (".mp4", ".webm", ".mov", ".mkv")
    if not object_name.lower().endswith(valid_exts):
        return {"status": "ignored", "reason": f"File '{object_name}' is not a supported video."}

    task_id = str(uuid.uuid4())[:8]
    temp_dir = tempfile.mkdtemp(prefix=f"snaptospec_{task_id}_")
    local_video_path = os.path.join(temp_dir, os.path.basename(object_name))

    print(f"[*] Pub/Sub trigger received: gs://{bucket_name}/{object_name}")

    # Download from GCS
    from google.cloud import storage
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.download_to_filename(local_video_path)

    # Launch autonomous agent pipeline
    background_tasks.add_task(
        execute_pipeline_task,
        video_local_path=local_video_path,
        task_id=task_id,
        output_bucket=bucket_name,
        cleanup_temp_dir=temp_dir
    )

    # Return 200 immediately to acknowledge Pub/Sub message
    return {
        "status": "ACCEPTED",
        "task_id": task_id,
        "source_gcs": f"gs://{bucket_name}/{object_name}"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
