import os
import sys
import json
import time
import subprocess
import shutil
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ==========================================
# 1. Pydantic Schemas for Structured Output
# ==========================================
class TimestampOfInterest(BaseModel):
    timestamp_seconds: float = Field(
        description="Exact timestamp in seconds where the key action, UI anomaly, or error state occurs."
    )
    label: str = Field(
        description="Short, human-readable label (e.g., 'Initial State', 'Click Action', 'Error Modal Appears', 'Network Failure')."
    )
    description: str = Field(
        description="Detailed description of what is visually happening on screen at this precise second."
    )

class ReproductionStep(BaseModel):
    step_number: int = Field(description="Sequential step index starting at 1.")
    action: str = Field(description="Specific user interaction (e.g., 'Click the Submit button on the checkout form').")
    expected_result: str = Field(description="What should have happened.")
    actual_result: str = Field(description="What actually happened as observed in the video.")

class SpecOutput(BaseModel):
    title: str = Field(
        description="Concise, professional issue title following standard conventions (e.g., '[BUG] Cart checkout button throws 500 error')."
    )
    bug_summary: str = Field(
        description="Comprehensive summary of the technical defect, user impact, and observed system behavior."
    )
    severity: str = Field(
        description="Severity level: 'Critical', 'High', 'Medium', or 'Low'."
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Relevant tags or labels such as 'frontend', 'ui-bug', 'api-failure', 'regression'."
    )
    timestamps_of_interest: List[TimestampOfInterest] = Field(
        description="List of critical timestamps throughout the video showing key steps and the failure point."
    )
    reproduction_steps: List[ReproductionStep] = Field(
        description="Clear, deterministic step-by-step instructions to reproduce the issue."
    )
    playwright_script: str = Field(
        description="Complete, syntactically valid TypeScript or Python Playwright E2E test script reproducing the scenario."
    )


# ==========================================
# 2. Gemini 3.5 Multimodal Video Processor
# ==========================================
def analyze_video_with_gemini(video_path: str, api_key: Optional[str] = None) -> SpecOutput:
    """
    Uploads a video to Gemini and extracts structured technical specs using Gemini 3.5.
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY environment variable or argument is required.")

    # Lazy import to ensure compatibility
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=key)
    
    print(f"[*] Uploading video '{video_path}' to Google Gemini File API...")
    video_file = client.files.upload(file=video_path)
    print(f"[+] Video uploaded successfully. File URI: {video_file.uri}")

    # Wait for processing if necessary
    while video_file.state.name == "PROCESSING":
        print("[*] Waiting for video processing to complete...")
        time.sleep(2)
        video_file = client.files.get(name=video_file.name)

    if video_file.state.name == "FAILED":
        raise RuntimeError(f"Video processing failed on Gemini backend: {video_file.error}")

    prompt = """
    You are an elite QA Automation Engineer and Technical Product Architect.
    Analyze the provided screencast video meticulously:
    1. Identify the primary bug, defect, or workflow failure shown in the video.
    2. Extract precise timestamps (in seconds) corresponding to key transitions, user actions, and error occurrences.
    3. Generate deterministic step-by-step reproduction instructions.
    4. Synthesize a production-ready Playwright end-to-end automated test script that replicates this user interaction flow.
    5. Output the result strictly conforming to the requested schema.
    """

    # Model selection: prefer gemini-3.5-flash (stable free tier), fallback to gemini-3.6-flash
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    fallback_model = "gemini-3.6-flash"
    print(f"[*] Performing multimodal analysis with {model_name}...")

    for attempt, current_model in enumerate([model_name, fallback_model], start=1):
        try:
            response = client.models.generate_content(
                model=current_model,
                contents=[video_file, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SpecOutput,
                    temperature=0.2,
                ),
            )
            if attempt > 1:
                print(f"[+] Succeeded with fallback model: {current_model}")
            break  # success, exit retry loop
        except Exception as e:
            err_str = str(e)
            if ("503" in err_str or "UNAVAILABLE" in err_str) and attempt == 1:
                print(f"[!] {current_model} overloaded (503), retrying with {fallback_model}...")
                time.sleep(2)
                continue
            raise  # re-raise for other errors or if fallback also fails

    raw_text = response.text
    spec_data = SpecOutput.model_validate_json(raw_text)
    print(f"[+] Multimodal analysis complete! Extracted {len(spec_data.timestamps_of_interest)} key timestamps.")
    return spec_data


# ==========================================
# 3. FFmpeg Frame Extraction Engine
# ==========================================
def extract_frames_at_timestamps(
    video_path: str,
    timestamps: List[TimestampOfInterest],
    output_dir: str = "./frames"
) -> List[str]:
    """
    Extracts high-resolution frame images (JPEG) at specific timestamps using ffmpeg.
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    extracted_files = []
    # Try PATH first, then known winget install location as fallback
    ffmpeg_bin = (
        shutil.which("ffmpeg")
        or os.getenv("FFMPEG_PATH")
        or r"C:\Users\kvsre\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"
    )

    for idx, item in enumerate(timestamps, start=1):
        ts_sec = item.timestamp_seconds
        # Clean label for safe filename
        safe_label = "".join(c for c in item.label if c.isalnum() or c in ("-", "_")).rstrip()
        filename = f"frame_{idx:02d}_{int(ts_sec)}s_{safe_label}.jpg"
        file_dest = output_path / filename

        # 1. Primary extraction: Fast seek to timestamp
        cmd_primary = [
            ffmpeg_bin,
            "-y",
            "-ss", str(ts_sec),
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "2",
            "-update", "1",
            str(file_dest)
        ]

        # 2. Fallback extraction: Accurate seek (useful if ts_sec is near end of stream)
        cmd_accurate = [
            ffmpeg_bin,
            "-y",
            "-i", str(video_path),
            "-ss", str(ts_sec),
            "-vframes", "1",
            "-q:v", "2",
            "-update", "1",
            str(file_dest)
        ]

        # 3. Final frame extraction: Clamp to end of video if Gemini asked for timestamp past video duration
        cmd_last_frame = [
            ffmpeg_bin,
            "-y",
            "-sseof", "-0.5",
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "2",
            "-update", "1",
            str(file_dest)
        ]

        success = False
        for cmd in (cmd_primary, cmd_accurate, cmd_last_frame):
            try:
                subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True
                )
                if file_dest.exists() and file_dest.stat().st_size > 500:
                    success = True
                    break
            except Exception:
                continue

        if success:
            extracted_files.append(str(file_dest.resolve()))
            print(f"  [+] Extracted frame at {ts_sec:.1f}s -> {filename}")
        else:
            print(f"  [!] Fallback canvas generation for timestamp {ts_sec}s -> {filename}")
            # Generate a valid dark styled 1280x720 canvas frame instead of 0-byte corrupt file
            cmd_canvas = [
                ffmpeg_bin,
                "-y",
                "-f", "lavfi",
                "-i", "color=c=0x090d1a:s=1280x720:d=1",
                "-vframes", "1",
                "-update", "1",
                str(file_dest)
            ]
            try:
                subprocess.run(cmd_canvas, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            except Exception:
                with open(file_dest, "wb") as f:
                    f.write(b"")
            extracted_files.append(str(file_dest.resolve()))

    return extracted_files


# ==========================================
# 4. Pipeline Execution Helper
# ==========================================
def process_video_pipeline(video_path: str, output_frames_dir: str = "./frames") -> dict:
    """
    Full Phase 1 pipeline: analyze video with Gemini, parse structured spec, extract frame screenshots.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    spec = analyze_video_with_gemini(video_path)
    frame_paths = extract_frames_at_timestamps(video_path, spec.timestamps_of_interest, output_frames_dir)
    
    return {
        "spec": spec.model_dump(),
        "frame_paths": frame_paths
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_video.py <path_to_video.mp4>")
        sys.exit(1)

    video_input = sys.argv[1]
    result = process_video_pipeline(video_input)
    print("\n" + "="*50)
    print("EXTRACTED SPECIFICATION:")
    print(json.dumps(result["spec"], indent=2))
    print(f"\nExtracted Frames: {len(result['frame_paths'])}")
