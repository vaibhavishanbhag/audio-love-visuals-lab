# backend/main.py

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import whisper
import requests
import uvicorn

app = FastAPI()
model = whisper.load_model("base")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running."}

@app.post("/process-audio/")
async def process_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        temp_file.write(await file.read())
        temp_file_path = temp_file.name
        print(temp_file_path)
    result = model.transcribe(temp_file_path)
    transcription = result["text"]
    return {"message": "Audio processed", "transcription": transcription}

@app.post("/ui-agent/")
async def ui_agent(request: Request):
    body = await request.json()
    user_input = body.get("text")

    system_prompt = (
        "You are a UI assistant. Based on the user's request, respond ONLY with pure JavaScript code "
        "that can be executed in the browser to change the DOM. Do not explain anything, just output code."
    )

    payload = {
        "model": "llama3",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ],
        "stream": False
    }

    response = requests.post("http://localhost:11434/api/chat", json=payload)
    data = response.json()

    code = data.get("message", {}).get("content", "")

    # Return only the code snippet – HTML changes are still handled in frontend
    return JSONResponse(content={
        "codeSnippet": code,
        "htmlContent": ""  # frontend will compute this
    })


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
