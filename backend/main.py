import base64
import io
import os
import logging
from contextlib import asynccontextmanager

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from inference_core import PneumoniaInferencePipeline
from report_generator import ClinicalReportGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pneumoscan.api")

pipeline = None
report_gen = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global pipeline, report_gen
    logger.info("Initializing PneumoScan AI backend...")
    
    # Locate model weights
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "model", "best_model.pth")
    if not os.path.exists(model_path):
        model_path = "model/best_model.pth"

    logger.info(f"Loading PyTorch inference model from: {model_path}")
    pipeline = PneumoniaInferencePipeline(weights_path=model_path)
    report_gen = ClinicalReportGenerator()
    logger.info("PneumoScan AI backend ready.")
    yield
    logger.info("Shutting down PneumoScan AI backend...")

app = FastAPI(
    title="PneumoScan AI - Uncertainty-Aware Pneumonia Triage API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "model_loaded": pipeline is not None,
        "device": str(pipeline.device) if pipeline else "unknown"
    }

@app.post("/api/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded."
        )

    # Validate file extension/type
    filename = file.filename or "uploaded_image.png"
    if not allowed_file(filename):
        # Also check content_type if filename lacks extension
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
            )

    try:
        contents = await file.read()
        pil_image = Image.open(io.BytesIO(contents))
        # Ensure image is valid RGB
        pil_image = pil_image.convert("RGB")
    except Exception as e:
        logger.error(f"Error reading image file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to process image file. Please provide a valid PNG, JPG, or JPEG radiograph."
        )

    # Run PyTorch inference pipeline
    try:
        results = pipeline.analyze(pil_image, n_samples=15)
    except Exception as e:
        logger.error(f"Inference execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing AI inference model: {str(e)}"
        )

    # Generate blended Grad-CAM overlay
    gradcam_mask = results["gradcam_mask"] # (224, 224) float32 in [0, 1]
    
    # Standardize image to 224x224 for overlay generation
    resized_orig = pil_image.resize((224, 224))
    orig_np = np.array(resized_orig, dtype=np.uint8) # (224, 224, 3)

    # Convert Grad-CAM mask to uint8 colormap
    cam_uint8 = np.uint8(255 * gradcam_mask)
    heatmap_bgr = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    # Blend original radiograph (60%) and heatmap (40%)
    blended = cv2.addWeighted(orig_np, 0.6, heatmap_rgb, 0.4, 0)

    # Encode blended image to Base64 PNG string
    blended_pil = Image.fromarray(blended)
    buffer = io.BytesIO()
    blended_pil.save(buffer, format="PNG")
    buffer.seek(0)
    base64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    gradcam_overlay_base64 = f"data:image/png;base64,{base64_str}"

    # Also generate base64 of standard 224x224 original image for uniform side-by-side rendering
    orig_buffer = io.BytesIO()
    resized_orig.save(orig_buffer, format="PNG")
    orig_buffer.seek(0)
    orig_base64_str = base64.b64encode(orig_buffer.getvalue()).decode("utf-8")
    original_image_base64 = f"data:image/png;base64,{orig_base64_str}"

    # Generate clinical radiology report via Gemini 2.5 Flash (or structured fallback)
    clinical_report = report_gen.generate(results)

    return {
        "prediction": results["prediction"],
        "mean_probability": results["mean_probability"],
        "epistemic_variance": results["epistemic_variance"],
        "triage_status": results["triage_status"],
        "dominant_quadrant": results["dominant_quadrant"],
        "gradcam_overlay_base64": gradcam_overlay_base64,
        "original_image_base64": original_image_base64,
        "clinical_report": clinical_report
    }
