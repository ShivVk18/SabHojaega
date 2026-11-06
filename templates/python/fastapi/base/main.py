from fastapi import FastAPI

app = FastAPI(
    title="{{projectName}}",
    version="0.1.0"
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to {{projectName}}!"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

