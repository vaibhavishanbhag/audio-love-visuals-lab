# backend/main.py

from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import whisper
import requests
import uvicorn
import json

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
    print(user_input)
    prompt = f"""
You are a frontend UI assistant. The user will describe UI changes.
You must respond in valid JSON format only, with two keys:
- "htmlContent": HTML to append inside #results.
- "codeSnippet": JavaScript to modify or style elements inside #results.

User request: "{user_input}"
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",  # Ollama default endpoint
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            }
        )
        result = response.json()
        output = result.get("response", "")
        print(output,"output")

       # Attempt to parse JSON from model output
        parsed = json.loads(output.strip())
        return {
            "htmlContent": parsed.get("htmlContent", ""),
            "codeSnippet": parsed.get("codeSnippet", "")
        }

    except Exception as e:
        return {
            "htmlContent": "<p>Error processing request.</p>",
            "codeSnippet": f"console.error('Error: {str(e)}');"
        }

   
  


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
