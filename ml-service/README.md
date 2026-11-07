# LoopWear ML Quality Control Service (FastAPI)

Lightweight computer vision inspection service for LoopWear (Closet Circle).

## Purpose
Automates preliminary garment quality analysis (stains, fabric tears, fading) before physical hub intake.

## Quickstart (Zero-Cost Local Python)
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

The service runs at `http://localhost:8000`.
- Health check: `http://localhost:8000/health`
- Interactive OpenAPI docs: `http://localhost:8000/docs`

