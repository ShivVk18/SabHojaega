# {{projectName}}

Generated using Sabhojaega (Flask).

## Setup

Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the development server:
```bash
python app.py
```
or
```bash
flask run --port 5000
```

## Endpoints
- `GET /`: Welcome message
- `GET /health`: Health check status (`{"status":"healthy"}`)

