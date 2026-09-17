import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from PIL import Image

class MCDropoutEfficientNet(nn.Module):
    def __init__(self, dropout_p=0.3):
        super().__init__()
        weights = EfficientNet_B0_Weights.DEFAULT
        backbone = efficientnet_b0(weights=weights)
        self.features = backbone.features
        self.avgpool = backbone.avgpool
        in_features = backbone.classifier[1].in_features
        self.mc_dropout = nn.Dropout(p=dropout_p)
        self.fc = nn.Linear(in_features, 1)

    def forward(self, x):
        feat = self.features(x)
        feat = self.avgpool(feat)
        feat = torch.flatten(feat, 1)
        feat = self.mc_dropout(feat)
        return self.fc(feat).squeeze(-1)

    def enable_mc_dropout(self):
        self.eval()
        self.mc_dropout.train()

class PneumoniaInferencePipeline:
    def __init__(self, weights_path, device="cuda" if torch.cuda.is_available() else "cpu"):
        self.device = torch.device(device)
        self.model = MCDropoutEfficientNet().to(self.device)
        self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        def forward_hook(module, input, output):
            self.activations = output.detach()
        def backward_hook(module, grad_in, grad_out):
            self.gradients = grad_out[0].detach()

        self.model.features[-1].register_forward_hook(forward_hook)
        self.model.features[-1].register_full_backward_hook(backward_hook)

    def analyze(self, pil_image, n_samples=15):
        tensor = self.transform(pil_image.convert("RGB")).unsqueeze(0).to(self.device)

        # 1. Grad-CAM Single Pass
        self.model.eval()
        self.model.zero_grad()
        logits = self.model(tensor)
        prob_det = torch.sigmoid(logits).item()

        if prob_det >= 0.5:
            logits.backward()
            weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
            cam = torch.sum(weights * self.activations, dim=1).squeeze(0)
            cam = F.relu(cam).cpu().numpy()
            diff = cam.max() - cam.min()
            cam = (cam - cam.min()) / diff if diff > 1e-6 else np.zeros_like(cam)
            cam = cv2.resize(cam, (224, 224))
        else:
            cam = np.zeros((224, 224), dtype=np.float32)

        # Anatomical Quadrant Attribution
        h, w = cam.shape
        quads = {
            "Right Upper Lobe": float(cam[0:h//2, 0:w//2].sum()),
            "Left Upper Lobe": float(cam[0:h//2, w//2:w].sum()),
            "Right Lower Lobe": float(cam[h//2:h, 0:w//2].sum()),
            "Left Lower Lobe": float(cam[h//2:h, w//2:w].sum()),
        }
        dominant_quadrant = max(quads, key=quads.get) if prob_det >= 0.5 else "Clear / None"

        # 2. MC Dropout Stochastic Uncertainty Passes
        self.model.enable_mc_dropout()
        sample_probs = []
        with torch.no_grad():
            for _ in range(n_samples):
                stoch_logits = self.model(tensor)
                sample_probs.append(torch.sigmoid(stoch_logits).item())

        mean_prob = float(np.mean(sample_probs))
        variance = float(np.var(sample_probs))
        triage_status = "SAFE_FOR_TRIAGE" if variance <= 0.02 else "FLAG_MANUAL_REVIEW"

        return {
            "prediction": "PNEUMONIA" if mean_prob >= 0.5 else "NORMAL",
            "mean_probability": round(mean_prob, 4),
            "epistemic_variance": round(variance, 6),
            "triage_status": triage_status,
            "dominant_quadrant": dominant_quadrant,
            "gradcam_mask": cam
        }
