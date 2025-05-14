from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi_oauth2 import OAuth2AuthorizationCodeBearer

import ollama

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    client_id="23789837941-od2kghqa1c17jlqug3vflrh475gq6qmh.apps.googleusercontent.com",
    client_secret="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",
    authorization_url="https://accounts.google.com/o/oauth2/v2/auth",
    token_url="https://oauth2.googleapis.com/token",
    redirect_uri="http://localhost:5173",  # Add this line with your desired URI
)


app = FastAPI()

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
            model='llama3',  # This must be downloaded via `ollama run llama3` first
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes notes."},
                {"role": "user", "content": f"Summarize the following:\n\n{text}"}
            ]
        )
        return response['message']['content'].strip()
    except Exception as e:
        print(f"Ollama/LLaMA error: {e}")
        return f"Error: LLaMA error occurred. Details: {e}"



@app.post("/process-note")
def process_note(request: NoteRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Note text is required")

    # Verify the Google token
    try:
        idinfo = id_token.verify_oauth2_token(request.token, grequests.Request(), os.getenv("GOOGLE_CLIENT_ID"))
        user_email = idinfo.get("email")
        print(f"✅ Verified user email: {user_email}")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    # Generate summary using GPT
    summary = llama_summarize(request.text)

    note_id = str(uuid.uuid4())

    return {
        "note_id": note_id,
        "original": request.text,
        "summary": summary,
        "user_id": user_email,
    }
