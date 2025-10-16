from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Frontdesk HITL Backend is running!"}
