#!/usr/bin/env bash
# ==============================================================================
# SnapToSpec: Autonomous Cloud Run + Pub/Sub + GCS Deployment Script
# ==============================================================================
set -euo pipefail

# Configuration
export PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
export REGION="${REGION:-us-central1}"
export SERVICE_NAME="snaptospec-agent"
export INPUT_BUCKET="${PROJECT_ID}-snaptospec-input"
export FRAMES_BUCKET="${PROJECT_ID}-snaptospec-frames"
export TOPIC_NAME="snaptospec-video-events"
export SUBSCRIPTION_NAME="snaptospec-cloudrun-sub"
export SA_NAME="snaptospec-invoker-sa"

echo "================================================================"
echo " Deploying SnapToSpec Autonomous Agent Pipeline to Google Cloud"
echo " Project:  ${PROJECT_ID}"
echo " Region:   ${REGION}"
echo " Service:  ${SERVICE_NAME}"
echo "================================================================"

# 1. Enable Required GCP APIs
echo "[*] Enabling Required Google Cloud APIs..."
gcloud services enable \
    run.googleapis.com \
    pubsub.googleapis.com \
    storage.googleapis.com \
    firestore.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    --project="${PROJECT_ID}"

# 2. Create Storage Buckets
echo "[*] Creating GCS Buckets..."
gcloud storage buckets create "gs://${INPUT_BUCKET}" --location="${REGION}" --project="${PROJECT_ID}" || true
gcloud storage buckets create "gs://${FRAMES_BUCKET}" --location="${REGION}" --project="${PROJECT_ID}" || true

# Make frames bucket publicly readable for GitHub markdown rendering (or use signed URLs)
gcloud storage buckets add-iam-policy-binding "gs://${FRAMES_BUCKET}" \
    --member="allUsers" \
    --role="roles/storage.objectViewer" || true

# 3. Create Cloud Pub/Sub Topic
echo "[*] Setting up Cloud Pub/Sub Topic..."
gcloud pubsub topics create "${TOPIC_NAME}" --project="${PROJECT_ID}" || true

# 4. Wire GCS Object Finalize Notification to Pub/Sub
echo "[*] Registering GCS Notification Trigger..."
gcloud storage buckets notifications create "gs://${INPUT_BUCKET}" \
    --topic="${TOPIC_NAME}" \
    --events="OBJECT_FINALIZE" || true

# 5. Build and Deploy Cloud Run Service
echo "[*] Deploying Container to Cloud Run (Timeout=600s, Memory=2GiB)..."
gcloud run deploy "${SERVICE_NAME}" \
    --source . \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --platform=managed \
    --memory=2GiB \
    --cpu=2 \
    --timeout=600s \
    --concurrency=10 \
    --set-env-vars="GCS_OUTPUT_BUCKET=${FRAMES_BUCKET}" \
    --allow-unauthenticated

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --format="value(status.url)")
echo "[+] Cloud Run Service deployed at: ${SERVICE_URL}"

# 6. Setup Service Account & Pub/Sub Push Subscription
echo "[*] Configuring Pub/Sub Push Subscription to Cloud Run..."
gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="SnapToSpec Pub/Sub Push Invoker" \
    --project="${PROJECT_ID}" || true

gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
    --region="${REGION}" \
    --member="serviceAccount:${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/run.invoker" \
    --project="${PROJECT_ID}"

# Create or Update Pub/Sub Push Subscription pointing to /pubsub
gcloud pubsub subscriptions create "${SUBSCRIPTION_NAME}" \
    --topic="${TOPIC_NAME}" \
    --push-endpoint="${SERVICE_URL}/pubsub" \
    --push-auth-service-account="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --ack-deadline=300 \
    --project="${PROJECT_ID}" || true

echo "================================================================"
echo " 🎉 SnapToSpec Pipeline Successfully Deployed!"
echo " Input Bucket:        gs://${INPUT_BUCKET}"
echo " Extracted Frames:    gs://${FRAMES_BUCKET}"
echo " Cloud Run Endpoint:  ${SERVICE_URL}"
echo " Pub/Sub Trigger:     ${TOPIC_NAME} -> ${SERVICE_URL}/pubsub"
echo "================================================================"
echo "To test autonomously, upload any .mp4 screencast to:"
echo "  gcloud storage cp test_bug.mp4 gs://${INPUT_BUCKET}/"
