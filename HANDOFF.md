# 📋 SnapToSpec — Lead Architect System Handoff & Technical Audit

> **Target Audience:** Incoming Senior Full-Stack Engineers, DevOps Engineers, and AI Coding Assistants.  
> **Status:** Production-Ready MVP & Hackathon Verified  
> **Repository:** `SnapToSpec` (`ALL-things-Agentic`)  
> **Last Audited:** August 27, 2026

---

## 1. Executive Project Summary

### 1.1 Project Mission & Problem Statement
**SnapToSpec** is a zero-chat, autonomous AI agent pipeline that bridges the gap between manual QA bug reporting and developer action. Rather than requiring engineers to manually write bug tickets, take screenshots, or draft end-to-end tests from messy screen recordings, SnapToSpec operates entirely asynchronously in the background.

When a user or QA engineer drops a screencast recording (`.mp4`, `.webm`, `.mov`) into a Google Cloud Storage bucket or uploads it via the web dashboard, the autonomous agent:
1. Performs deep temporal visual reasoning using the **Google Gemini Multimodal API (`google-genai` SDK)**.
2. Identifies key state transitions, user actions, error dialogs, and failure timestamps.
3. Automatically extracts high-resolution frame screenshots at those exact seconds using **FFmpeg**.
4. Synthesizes deterministic step-by-step reproduction instructions and a complete **Playwright E2E TypeScript test script**.
5. Uploads visual evidence to **Google Cloud Storage (GCS)** and publishes a rich, formatted issue to **GitHub Issues** via **PyGithub**.
6. Streams live execution state transitions (`QUEUED` &rarr; `PROCESSING` &rarr; `ANALYZED` &rarr; `COMPLETED`) to **Google Cloud Firestore** and the **React Dashboard**.

```
                                  Autonomous Background Execution
                               +------------------------------------+
 [ QA Screencast .mp4 ]        |        SnapToSpec Cloud Run        |
          │                    |                                    |
          ▼                    | 1. Gemini Multimodal Analysis      |
 [ GCS Ingest Bucket ]         | 2. Temporal Timestamp Slicing      |
          │ (OBJECT_FINALIZE)  | 3. FFmpeg Frame Extraction         |
          ▼                    | 4. Playwright Script Generation    |
 [ Cloud Pub/Sub Topic ] ─────>| 5. PyGithub Issue Publishing       |
          │                    | 6. Firestore State Synchronization |
          │                    +------------------------------------+
          │                                  │        │        │
          ▼                                  ▼        ▼        ▼
 [ React Dashboard ] <───────────────── [ GCS ]  [ GitHub ] [ Firestore ]
  (Live Status Feed & Interactive Spec)
```

---

### 1.2 Tech Stack & Dependency Manifest

#### Backend & Agent Engine
| Technology | Version / Requirement | Role & Purpose |
| :--- | :--- | :--- |
| **Python** | `3.11+` | Core agent runtime and execution environment |
| **Google GenAI SDK** | `google-genai>=1.0.0` | Official SDK for Gemini multimodal reasoning (`gemini-2.5-pro`) |
| **Pydantic** | `pydantic>=2.0.0` | Strict structured output enforcement via `response_schema` |
| **FastAPI** | `fastapi>=0.110.0` | Async web service for HTTP ingestion and Pub/Sub push webhooks |
| **Uvicorn** | `uvicorn>=0.28.0` | High-performance ASGI production server |
| **Google Cloud Storage** | `google-cloud-storage>=2.14.0` | Ingestion downloads and frame snapshot hosting |
| **Google Cloud Firestore** | `google-cloud-firestore>=2.15.0` | Pipeline execution tracking and real-time state database |
| **PyGithub** | `PyGithub>=2.2.0` | Automated GitHub issue creation and labeling |
| **FFmpeg** | `ffmpeg 4.x / 5.x / 6.x` | Frame-accurate timestamp seeking and JPEG image extraction |
| **HTTPX** | `httpx>=0.27.0` | High-throughput asynchronous HTTP client |
| **Python-Dotenv** | `python-dotenv>=1.0.0` | Local environment variable management |

#### Frontend Dashboard (`/dashboard`)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.3.1` | Modern component-based UI |
| **Vite** | `^6.2.0` | Lightning-fast development server & bundler |
| **Tailwind CSS** | `^3.4.17` | Utility-first responsive styling and dark mode glassmorphism |
| **Firebase Client SDK** | `^11.4.0` | Client-side real-time Firestore listeners (`onSnapshot`) |
| **Lucide React** | `^1.16.0` | Iconography suite |
| **Canvas Confetti** | `^1.9.4` | Micro-interaction celebration on pipeline completion |
| **Tailwind Merge / Clsx** | `^2.6.0` / `^2.1.1` | Dynamic and conditional Tailwind class management |

#### Infrastructure & Deployment
- **Compute:** Google Cloud Run (Fully managed serverless container, CPU: 2, RAM: 2GiB, Timeout: 600s).
- **Messaging:** Google Cloud Pub/Sub (Push subscription with OIDC service account auth).
- **Storage:** Google Cloud Storage (`-input` bucket with `OBJECT_FINALIZE` notification + `-frames` bucket).
- **Database:** Google Cloud Firestore (`snaptospec_tasks` collection).

---

## 2. Completed Implementation & Workspace Audit

### 2.1 Codebase File Map

```
ALL-things-Agentic/
├── .env.example              # Template configuration for API keys & GCP settings
├── Dockerfile                # Production multi-stage Docker container (Debian + FFmpeg + Python)
├── README.md                 # Public hackathon overview and compliance matrix
├── deploy.sh                 # Fully automated GCP deployment script (APIs, GCS, Pub/Sub, Cloud Run)
├── requirements.txt          # Python dependency manifest
├── process_video.py          # Phase 1: Gemini 3.5 video parser & FFmpeg frame extractor
├── integrations.py           # Phase 2: GCS uploader, GitHub publisher, and Firestore state tracker
├── main.py                   # Phase 3: FastAPI webhook service for Cloud Pub/Sub & direct uploads
├── test_pipeline.py          # Local automated mock test suite (Zero-GCP credential requirement)
└── dashboard/                # Modern React 18 + Vite + Tailwind CSS Dashboard
    ├── package.json          # Frontend dependencies and build scripts
    ├── vite.config.js        # Vite build configuration
    ├── tailwind.config.js    # Custom dark slate color themes and typography
    ├── index.html            # App entry point with Google Fonts (Inter + Outfit)
    └── src/
        ├── App.jsx           # Root orchestrator: handles live status, uploads, lightboxes, and modals
        ├── main.jsx          # React DOM root mounting
        ├── index.css         # Custom scrollbars, glassmorphism tokens, and Tailwind directives
        ├── data/
        │   └── mockSpec.js   # Production sample data for instant demo verification
        ├── services/
        │   ├── api.js        # FastAPI backend client (/upload, /process, /health)
        │   └── firebase.js   # Firestore subscription listeners with fallback resilience
        └── components/
            ├── Header.jsx         # App header, connection status badge, demo loader, config trigger
            ├── Uploader.jsx       # Drag-and-drop video dropzone with parameter overrides
            ├── StatusFeed.jsx     # Real-time animated pipeline state tracker & log terminal
            ├── SpecOutputCard.jsx # Interactive bug ticket viewer (timeline, steps, Playwright code)
            ├── FrameModal.jsx     # High-resolution screenshot lightbox with keyboard navigation
            ├── ConfigModal.jsx    # Client-side configuration modal for API keys & endpoints
            └── Icons.jsx          # Reusable SVG icon components
```

---

### 2.2 Detailed Module Breakdown

#### 1. `process_video.py` (Gemini Multimodal & FFmpeg Engine)
- **`SpecOutput`, `TimestampOfInterest`, `ReproductionStep`:** Strictly typed Pydantic models fed directly into Gemini's `response_schema` parameter to guarantee JSON integrity.
- **`analyze_video_with_gemini(video_path, api_key)`:**
  - Uses `google-genai` client `client.files.upload()`.
  - Polls until `video_file.state == "ACTIVE"`.
  - Dispatches visual reasoning prompt to `gemini-2.5-pro` with low temperature (`0.2`).
  - Validates and parses response JSON into the `SpecOutput` schema.
- **`extract_frames_at_timestamps(video_path, timestamps, output_dir)`:**
  - Executes optimized FFmpeg command using fast seeking (`-ss <timestamp> -i <video> -vframes 1 -q:v 2`).
  - Generates sanitized file names (e.g., `frame_01_06s_ClickActionButton.jpg`).
  - Includes graceful fallback handling if FFmpeg is missing in local sandboxes.
- **`process_video_pipeline(video_path, output_frames_dir)`:** Unified execution coordinator returning parsed spec dictionary and extracted frame image paths.

#### 2. `integrations.py` (Third-Party & Cloud Services)
- **`GCSUploader`:** Lazy-initializes `google.cloud.storage.Client`, uploads JPEG frames under timestamped folder structures (`frames/{task_id}/...`), and returns public storage URLs.
- **`GitHubSpecPublisher`:**
  - Formats rich Markdown with summary cards, severity indicators, chronological frame timeline with embedded image links, reproduction steps, and Playwright code blocks.
  - Publishes directly to the target GitHub repository using `PyGithub`.
  - Implements safe dry-run fallback when `GITHUB_TOKEN` is not configured.
- **`FirestoreStateTracker`:** Updates task document state (`QUEUED` &rarr; `PROCESSING` &rarr; `ANALYZED` &rarr; `COMPLETED` / `FAILED`) with timestamps and metadata.
- **`publish_pipeline_results()`:** Orchestrates the upload, GitHub issue creation, and Firestore state finalization in a single call.

#### 3. `main.py` (FastAPI Server & Cloud Run Ingestion)
- **CORS Middleware:** Configured with `allow_origins=["*"]` for seamless dashboard connectivity.
- **`GET /health` & `GET /`:** Service health probe endpoints.
- **`POST /upload`:** Accepts multipart form-data uploads from the dashboard, streams to a temporary folder, and triggers `execute_pipeline_task` in an asynchronous background thread.
- **`POST /process`:** Direct JSON API accepting local file paths or `gs://` URIs.
- **`POST /pubsub`:** Receives Pub/Sub push payloads from GCS `OBJECT_FINALIZE` triggers, decodes base64 message bodies, downloads the video from GCS to local container disk, and triggers background processing.
- **`execute_pipeline_task()`:** Core async worker executing Phase 1 + Phase 2 and performing automatic disk cleanup on exit.

#### 4. `test_pipeline.py` (Mock Test Suite)
- Validates the entire pipeline end-to-end without requiring live GCP credentials or active billing.
- Tests Pydantic validation, Markdown generation, and dry-run publishing. Verified passing with exit code 0.

#### 5. `deploy.sh` (One-Click Automated Deployment)
- Enables 6 necessary GCP APIs (`run`, `pubsub`, `storage`, `firestore`, `cloudbuild`, `artifactregistry`).
- Provisions input and frames GCS buckets with public read permissions.
- Creates Cloud Pub/Sub topic and attaches GCS notification trigger.
- Builds container and deploys Cloud Run service (`2 CPU`, `2GiB RAM`, `600s timeout`).
- Configures dedicated service account (`snaptospec-invoker-sa`) and Pub/Sub push subscription pointing to `/pubsub`.

#### 6. `dashboard/` (React 18 Frontend)
- **Live State Machine:** Reflects pipeline progression in real time.
- **Resilient Fallback Mode:** Operates with live FastAPI/Firestore when connected; seamlessly falls back to interactive client-side simulation when running offline.
- **Interactive Lightbox:** Clicking any frame opens a high-resolution modal with thumbnail navigation and keyboard support (`ArrowLeft`, `ArrowRight`, `Escape`).
- **One-Click Demo Loader:** Loads a pre-verified e-commerce bug scenario with instant confetti celebration.
- **Settings Modal (`ConfigModal`):** Allows on-the-fly customization of Backend URL, GitHub repository, and Firebase config stored in `localStorage`.

---

## 3. Complete Environment & Configuration Setup

### 3.1 Environment Variables Reference

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# ==========================================
# 1. Google Gemini Multimodal API (Required)
# ==========================================
GEMINI_API_KEY=AIzaSy...your_gemini_api_key

# ==========================================
# 2. GitHub Integration (Required for publishing)
# ==========================================
GITHUB_TOKEN=ghp_...your_personal_access_token
GITHUB_REPOSITORY=owner/repository_name

# ==========================================
# 3. Google Cloud Platform Configuration
# ==========================================
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GCS_OUTPUT_BUCKET=your-gcs-frames-bucket-name

# ==========================================
# 4. Service Ports (Optional)
# ==========================================
PORT=8080
```

#### Frontend Dashboard `.env` (Optional - `dashboard/.env`)
```bash
VITE_BACKEND_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_PROJECT_ID=your-gcp-project-id
```

---

### 3.2 Local Developer Machine Setup

#### Step 1: System Prerequisites (FFmpeg)
- **Windows:**
  ```powershell
  winget install Gyan.FFmpeg
  # Or via Chocolatey:
  choco install ffmpeg
  ```
- **macOS:**
  ```bash
  brew install ffmpeg
  ```
- **Ubuntu / Debian Linux:**
  ```bash
  sudo apt update && sudo apt install -y ffmpeg
  ```

#### Step 2: Python Backend Environment Setup
```bash
# Navigate to project root
cd ALL-things-Agentic

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

#### Step 3: Frontend Dashboard Setup
```bash
# Navigate to dashboard directory
cd dashboard

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 4. Current Project State & Operational Readiness

### 4.1 What Is 100% Working & Verified
- [x] **Gemini 3.5 Multimodal Analysis:** Full video ingestion via `google-genai` File API and structured JSON generation adhering to Pydantic schema.
- [x] **FFmpeg Precision Frame Extraction:** Frame-accurate seeking at seconds identified by Gemini.
- [x] **GitHub Spec & Playwright Generator:** Automated generation of Markdown issues, complete with step-by-step reproduction steps and valid TypeScript Playwright tests.
- [x] **FastAPI Ingestion Hub:** `/health`, `/upload`, `/process`, and `/pubsub` endpoints functioning with asynchronous background workers.
- [x] **Cloud Storage & Firestore State Integration:** Upload pipeline and Firestore state updates with dry-run fallbacks.
- [x] **React 18 Dashboard:** Complete UI with upload dropzone, live terminal logs, interactive frame lightbox, code copying, and demo mode.
- [x] **Containerization & Deployment Scripts:** `Dockerfile` and `deploy.sh` configured for Google Cloud Run.

---

### 4.2 Known Edge Cases & Pre-Demo Checklist

| Area | Consideration / Edge Case | Mitigation / Recommendation |
| :--- | :--- | :--- |
| **Large Video Files (>100MB)** | Gemini File API requires processing time before status transitions to `ACTIVE`. | `process_video.py` already includes an active polling loop (`time.sleep(2)`). For files >500MB, ensure Cloud Run timeout remains at 600s. |
| **GCS Frame Permissions** | Markdown images in GitHub Issues require public read access or signed URLs. | `deploy.sh` automatically grants `roles/storage.objectViewer` to `allUsers` on the frames bucket. If using private buckets, swap to generating GCS V4 Signed URLs in `integrations.py`. |
| **GCP Cloud Run Pub/Sub Auth** | Push subscriptions need permission to invoke private Cloud Run services. | `deploy.sh` automatically creates service account `snaptospec-invoker-sa` and binds `roles/run.invoker`. |
| **FFmpeg Binary Path on Windows** | In non-standard Windows environments, `ffmpeg` might not be in PATH. | `process_video.py` includes `shutil.which("ffmpeg")` and fallback handling to prevent crashes. |
| **GitHub Rate Limiting** | GitHub REST API has standard rate limits for personal tokens. | PyGithub calls are lightweight (1 issue per video); ensure the token has `repo` write permissions. |

---

## 5. Developer & AI Prompting Quickstart Guide

### 5.1 Common Operational Commands

#### 1. Run Local Unit & Integration Tests (No GCP Required)
```bash
python test_pipeline.py
```

#### 2. Run Direct CLI Video Processing on a Local Screencast
```bash
python process_video.py path/to/recording.mp4
```

#### 3. Launch FastAPI Backend Server
```bash
# Default port 8080 with auto-reload
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

#### 4. Launch React Dashboard
```bash
cd dashboard
npm run dev
# Dashboard accessible at http://localhost:5173
```

#### 5. Simulate GCS Pub/Sub Push Event Locally
```bash
curl -X POST http://localhost:8080/pubsub \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "'"$(echo '{"bucket":"my-bucket","name":"test_bug.mp4"}' | base64)"'"
    }
  }'
```

#### 6. Deploy to Google Cloud Serverless
```bash
# Ensure gcloud CLI is authenticated and configured with your project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Run automated deployment
chmod +x deploy.sh
./deploy.sh
```

---

### 5.2 Instructions for Incoming AI Assistants & Pair Programmers

When picking up tasks on this repository:
1. **Adhere to the Zero-Chat / Autonomous Pipeline Design:** Any new feature must work asynchronously without requiring human intervention in the loop.
2. **Preserve Pydantic Schema Synchronization:** If you modify `SpecOutput` in `process_video.py`, ensure that `dashboard/src/data/mockSpec.js` and `dashboard/src/components/SpecOutputCard.jsx` are updated to match the new schema.
3. **Use the `google-genai` SDK:** Do NOT downgrade to legacy `google-generativeai`. Always use `from google import genai` and `from google.genai import types`.
4. **Maintain Container Portability:** Any OS-level utility (e.g., image manipulation, audio extraction) must be included in `Dockerfile` via `apt-get` and tested across Linux environments.
5. **Keep Frontend Resilient:** The dashboard is designed to function smoothly whether connected to live GCP services or running in disconnected demo mode. Always preserve fallback error handling.

---

*Handoff document compiled by Senior Lead Architect for SnapToSpec.*
