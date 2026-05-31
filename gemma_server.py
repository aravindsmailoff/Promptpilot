import os
import sys
import subprocess

# Load environment variables from .env / .env.local files
for dotenv_file in [".env.local", ".env"]:
    if os.path.exists(dotenv_file):
        with open(dotenv_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    # Strip any surrounding quotes from value
                    val = v.strip().strip("'").strip('"')
                    os.environ[k.strip()] = val

# Auto-install dependencies
REQUIRED_PACKAGES = ["fastapi", "uvicorn", "transformers", "torch", "pydantic", "accelerate"]
for pkg in REQUIRED_PACKAGES:
    try:
        __import__(pkg)
    except ImportError:
        print(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

from fastapi import FastAPI, HTTPException  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]
from pydantic import BaseModel  # type: ignore[import]
from typing import List, Optional
import uvicorn  # type: ignore[import]
import torch  # type: ignore[import]
from transformers import AutoModelForCausalLM, AutoTokenizer  # type: ignore[import]

app = FastAPI(title="Gemma 4 Local Transformers Server")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ID = "google/gemma-4-E4B-it"

print(f"Loading tokenizer for {MODEL_ID}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

print(f"Loading model {MODEL_ID} (dtype=auto, device_map=auto)...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    low_cpu_mem_usage=True
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    try:
        # Convert messages to the model's required format
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Apply the chat template
        prompt = tokenizer.apply_chat_template(messages_dict, tokenize=False, add_generation_prompt=True)
        
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature if request.temperature > 0 else 0.01,
                do_sample=True if request.temperature > 0 else False,
            )
            
        # Decode response content (only the new generated tokens)
        input_len = inputs.input_ids.shape[1]
        generated_tokens = outputs[0][input_len:]
        response_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    }
                }
            ]
        }
    except Exception as e:
        print(f"Error generating completions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
