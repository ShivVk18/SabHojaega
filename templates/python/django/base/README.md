# {{projectName}}

Generated using Sabhojaega (Django).

## Setup

Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run migrations and start development server:
```bash
python manage.py migrate
python manage.py runserver
```

## Endpoints
- `GET /`: Welcome message
- `GET /health`: Health check status (`{"status":"healthy"}`)
