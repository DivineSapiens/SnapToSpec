# 🎬 SnapToSpec — Autonomous Video-to-Spec Agent Pipeline
> **Hackathon Track:** Taskmaster (Zero-Chat, Autonomous Background Action)  
> **Core Engine:** Gemini 3.5 Multimodal Video Reasoning + Google Cloud Serverless

SnapToSpec is an autonomous background pipeline that transforms messy screencast videos (`.mp4`) into production-grade technical issue specifications (GitHub / Jira), complete with **extracted screenshot timelines** at key moments and **ready-to-run Playwright automated test scripts**.

---

## 🎯 Mandatory Hackathon Compliance Matrix

| Constraint | Requirement | SnapToSpec Implementation | Status |
| :--- | :--- | :--- | :---: |
| **1. Category** | Taskmaster (Zero-Chat, Autonomous) | Drop a `.mp4` video into GCS bucket &rarr; Pub/Sub trigger &rarr; Cloud Run autonomously analyzes video, slices frames, posts GitHub issue, updates Firestore. **0% chat, 100% action.** | ✅ **Compliant** |
| **2. AI Model** | Gemini 3.5 | Uses Gemini 3.5 multimodal native video tokenization for temporal timestamp grounding & structured JSON spec output. | ✅ **Compliant** |
| **3. Framework** | Google Agent SDK / GenAI SDK | `google-genai` SDK with strict Pydantic typed schema validation (`response_schema`). | ✅ **Compliant** |
| **4. Cloud Infra** | GCP Cloud Run, Pub/Sub, Firestore, GCS | **Cloud Run** (Containerized worker), **GCS** (Ingest & frame hosting), **Pub/Sub** (Push events), **Firestore** (Execution state tracking). | ✅ **Compliant** |

---

## 🏗️ System Architecture

```
                                      +---------------------------------------------+
                                      |                 SnapToSpec                  |
                                      |             Cloud Run Container             |
                                      |                                             |
[ Dev / QA Video ]                    |  1. Parse Event Payload                     |
      │                               |  2. Download Video Temp File                |
      ▼                               |  3. Gemini 3.5 Multimodal Video Reasoning   |
[ GCS Ingest Bucket ]                 |  4. FFmpeg Precise Frame Slicing            |
      │ (OBJECT_FINALIZE)             |  5. Upload Frame JPEGs to GCS               |
      ▼                               |  6. Publish GitHub Markdown Issue           |
[ Cloud Pub/Sub Topic ] ─────────────>│  7. Record State in Firestore               |
                                      +---------------------------------------------+
                                             │               │              │
                                             ▼               ▼              ▼
                                      [ GCS Frames ]   [ GitHub API ]   [ Firestore ]
```

---

## 📂 Project Structure

```
.
├── process_video.py     # Phase 1: Gemini 3.5 video parser & FFmpeg frame extractor
├── integrations.py      # Phase 2: GCS uploader, PyGithub issue generator, Firestore state
├── main.py              # Phase 3: FastAPI webhook handling Cloud Pub/Sub push messages
├── Dockerfile           # Production container (Debian + FFmpeg + Python 3.11)
├── deploy.sh            # One-click automated gcloud infrastructure deployment
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── README.md
```

---

## 🚀 Quickstart & Local Testing

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Fill in GEMINI_API_KEY, GITHUB_TOKEN, and GITHUB_REPOSITORY
```

### 3. Run Local Prototype (Phase 1)
```bash
python process_video.py sample_bug_recording.mp4
```

---

## ☁️ Cloud Deployment (Phase 3)

Deploy the entire serverless infrastructure to Google Cloud in a single command:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Autonomous Triggering:
Once deployed, simply copy any bug video into your ingest bucket:
```bash
gcloud storage cp bug_demo.mp4 gs://<PROJECT_ID>-snaptospec-input/
```
The pipeline automatically picks up the file, processes it, and generates the GitHub issue with embedded screenshots and Playwright tests.
