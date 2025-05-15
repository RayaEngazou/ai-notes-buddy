from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from dotenv import load_dotenv
import ollama
import os
from ollama._types import ResponseError


# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://localhost:3000",
                   ],
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NoteRequest(BaseModel):
    token: str
    text: str



def llama_summarize(text: str):
    try:
        response = ollama.chat(
            model="tinyllama",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes notes."},
                {"role": "user", "content": f"Summarize the following:\n\n{text}"}
            ]
        )
        return response['message']['content'].strip()
    except ResponseError as e:
        print(f"Ollama response error: {e}")
        return "Ollama model error. Check memory or model availability."
    except Exception as e:
        print(f"Unexpected error: {e}")
        return "An unexpected error occurred."


@app.post("/process-note")
async def process_note(request: NoteRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Note text is required")

    try:
        idinfo = id_token.verify_oauth2_token(
            request.token, grequests.Request(), os.getenv("23789837941-nber5iabsr4cvr2a5bui9cjp8aq6icie.apps.googleusercontent.com")
        )
        user_email = idinfo.get("email")
        print(f"✅ Verified user email: {user_email}")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    summary = llama_summarize(request.text)
    note_id = str(uuid.uuid4())

    return {
        "note_id": note_id,
        "original": request.text,
        "summary": summary,
        "user_id": user_email,
    }
