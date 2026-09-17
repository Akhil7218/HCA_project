import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("pneumoscan.report")

class ClinicalReportGenerator:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()

    def generate(self, inference_data: dict) -> str:
        """
        Generates a structured formal clinical radiology report based on inference results.
        Uses google.genai SDK with gemini-2.5-flash (or gemini-3.6-flash / gemini-1.5-flash fallback) if configured,
        or falls back to a deterministic structured report.
        """
        prediction = inference_data.get("prediction", "UNKNOWN")
        mean_prob = inference_data.get("mean_probability", 0.0)
        prob_pct = round(mean_prob * 100, 2)
        variance = inference_data.get("epistemic_variance", 0.0)
        triage_status = inference_data.get("triage_status", "FLAG_MANUAL_REVIEW")
        dominant_quadrant = inference_data.get("dominant_quadrant", "Clear / None")

        prompt = f"""
You are an expert Thoracic Radiologist and AI Clinical Integration Consultant.
Generate a structured, formal radiology consultation report based on the following AI deep learning inference outputs for a single-view Chest X-Ray:

- **Primary AI Prediction**: {prediction}
- **Mean Model Confidence Score**: {prob_pct}% (Probability: {mean_prob})
- **Epistemic Model Variance (MC Dropout)**: {variance:.6f}
- **Triage Classification**: {triage_status}
- **Dominant Grad-CAM Heatmap Quadrant**: {dominant_quadrant}

### REPORT FORMAT REQUIREMENTS:
The report MUST contain the following 4 numbered sections formatted cleanly in Markdown:

1. **CLINICAL INDICATION & STUDY TYPE**
   - Single-view Chest Radiograph (PA/AP view). AI-assisted triage evaluation for acute lower respiratory disease / pneumonia.

2. **QUANTITATIVE AI FINDINGS**
   - Primary AI Prediction: {prediction}
   - Model Confidence Score: {prob_pct}%
   - Epistemic Uncertainty (MC Dropout Variance): {variance:.6f}
   - Focal Localization (Grad-CAM Saliency): {dominant_quadrant}

3. **RADIOLOGICAL IMPRESSION**
   - Provide a succinct, objective radiological synthesis based on the findings above. Explain the significance of the focal quadrant ({dominant_quadrant}) and structural opacification patterns typical of {prediction}.

4. **RECOMMENDED TRIAGE ACTION**
   - Detail explicit clinical next steps. 
   - IF triage status is "SAFE_FOR_TRIAGE" (variance <= 0.02): Indicate high epistemic certainty; proceed with standard clinical workflow based on impression.
   - IF triage status is "FLAG_MANUAL_REVIEW" (variance > 0.02): State clearly that model uncertainty exceeds acceptable clinical confidence threshold; flag for immediate urgent manual radiologist review before clinical decision-making.

Maintain a formal, objective, professional medical tone.
"""

        # Check API key dynamically
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if api_key and api_key != "your_gemini_api_key_here":
            # Attempt generation with preferred models in order of priority
            models_to_try = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-1.5-flash"]
            for model_name in models_to_try:
                try:
                    from google import genai
                    client = genai.Client(api_key=api_key)
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    if response and response.text:
                        logger.info(f"Successfully generated report using model: {model_name}")
                        return response.text.strip()
                except Exception as e:
                    logger.warning(f"Gemini model {model_name} attempt failed: {e}. Trying fallback...")
                    continue

        # Deterministic structured report fallback
        return self._build_fallback_report(
            prediction, prob_pct, variance, triage_status, dominant_quadrant
        )

    def _build_fallback_report(
        self, prediction: str, prob_pct: float, variance: float, triage_status: str, dominant_quadrant: str
    ) -> str:
        is_pneumonia = prediction == "PNEUMONIA"
        is_safe = triage_status == "SAFE_FOR_TRIAGE"

        impression_text = (
            f"The deep learning ensemble predicts **{prediction}** with a calculated mean probability of **{prob_pct}%**. "
            f"Focal saliency analysis via Grad-CAM indicates primary feature attribution centered in the **{dominant_quadrant}**."
            if is_pneumonia else
            f"The deep learning ensemble predicts **{prediction}** with a low calculated pneumonia probability of **{prob_pct}%**. "
            f"Saliency mapping displays diffuse, non-focal background activation across the lung fields (**{dominant_quadrant}**)."
        )

        triage_action_text = (
            f"**Action**: Proceed with standard triage protocols. Epistemic variance ({variance:.6f} <= 0.0200) confirms high model epistemic certainty. "
            f"Correlate findings with patient vital signs, oxygen saturation, and clinical history."
            if is_safe else
            f"**Action**: **FLAGGED FOR IMMEDIATE MANUAL RADIOLOGY REVIEW**. Epistemic variance ({variance:.6f} > 0.0200) indicates elevated model uncertainty. "
            f"Automated predictions should be held until verified by an attending radiologist."
        )

        return f"""### 1. CLINICAL INDICATION & STUDY TYPE
- **Study Type**: Single-view Chest Radiograph (PA/AP projection)
- **Indication**: AI-assisted rapid triage evaluation for pulmonary consolidation and acute pneumonia.

### 2. QUANTITATIVE AI FINDINGS
- **Primary AI Prediction**: `{prediction}`
- **Model Confidence Score**: `{prob_pct}%` (Mean Probability: {prob_pct/100:.4f})
- **Epistemic Uncertainty (MC Dropout Variance)**: `{variance:.6f}`
- **Focal Localization (Grad-CAM Saliency)**: `{dominant_quadrant}`

### 3. RADIOLOGICAL IMPRESSION
{impression_text}

### 4. RECOMMENDED TRIAGE ACTION
{triage_action_text}"""
