/**
 * SnapToSpec Backend API Client
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export async function submitVideoToPipeline({ file, videoPath, gcsUri, outputBucket }) {
  // If file is passed, check if backend supports /upload multipart or base64 /process
  try {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (outputBucket) formData.append('output_bucket', outputBucket);

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        return await response.json();
      }
    }

    // Direct /process endpoint fallback
    const payload = {
      video_path: videoPath || (file ? file.name : null),
      gcs_uri: gcsUri || null,
      output_bucket: outputBucket || null,
    };

    const response = await fetch(`${BACKEND_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('[SnapToSpec API] Backend connection note:', err.message);
    throw err;
  }
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET', mode: 'cors' });
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}
