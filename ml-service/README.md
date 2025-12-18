# ML Service - AgileSAFe AI Platform

Production-ready FastAPI service that powers AI/ML capabilities for the AgileSAFe backend (capacity planning, workload forecasting, retrospectives, etc.).

## Tech Stack

- **FastAPI** for the HTTP layer
- **MongoDB** (via PyMongo) for training/feature storage
- **TensorFlow / PyTorch / scikit-learn / Transformers** for ML workloads
- **Uvicorn** for the ASGI server

## Getting Started

### Prerequisites

- Python 3.10+
- Running MongoDB instance (local or remote)

### Install Dependencies

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Setup

Copy the sample environment file and populate it with real values:

```bash
cp env.example .env
```

Key variables:

```
MONGODB_URI=mongodb://localhost:27017/agilesafe
MONGODB_DB=agilesafe
API_KEY=your_ml_api_key_here
NODE_API_URL=http://localhost:5000/api
MODEL_PATH=./app/ml/models
LOG_LEVEL=INFO
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
```

### Run the Service

```bash
uvicorn main:app --reload --port 8000
```

Swagger UI is available at `http://localhost:8000/docs`.

## Project Structure

```
ml-service/
├── main.py                # FastAPI entrypoint
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/        # Modular route definitions
│   ├── core/              # Config, security, database helpers
│   ├── schemas/           # Pydantic models
│   ├── services/          # Business and ML logic
│   ├── ml/
│   │   ├── models/        # Serialized models
│   │   └── training/      # Training scripts
│   └── utils/             # Logging, helpers
├── logs/                  # Service log files
├── requirements.txt
└── env.example
```

## API Surface

| Method | Endpoint          | Description                          | Auth |
|--------|-------------------|--------------------------------------|------|
| GET    | `/health`         | Readiness check                      | ❌   |
| GET    | `/api/ml/info`    | List available models and versions   | ✅   |
| POST   | `/api/ml/predict` | Run numeric inference                | ✅   |
| POST   | `/api/ml/analyze` | Run text/NLP analysis                | ✅   |

> ✅ endpoints require an `x-api-key` header that matches the configured `API_KEY`.

## Logging

Logs are written both to `stdout` and `logs/ml-service.log`. Customize log level via `LOG_LEVEL`.

## Extending the Service

1. Drop trained artifacts into `app/ml/models/`.
2. Update `app/services/ml_service.py` to load/use the new model.
3. Expose additional functionality via new routes under `app/api/routes/`.
4. Fetch training data from MongoDB using helpers in `app/core/database.py`.

## Integration Notes

- The service is hardened with API-key auth (middleware + dependency) so it can be safely exposed to the Node.js backend.
- MongoDB connectivity is established at startup and reused across requests.
- Node backend requests can be issued via the configured `NODE_API_URL` (see `app/core/config.py`).

