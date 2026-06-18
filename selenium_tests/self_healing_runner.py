#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import time
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

# Ensure we are in the selenium_tests directory pathing context
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Load environment variables
promptpilot_env = BASE_DIR.parent / "Promptpilot" / ".env"
if promptpilot_env.exists():
    load_dotenv(dotenv_path=promptpilot_env)
load_dotenv(dotenv_path=BASE_DIR / ".env")

API_KEY = os.getenv("GOOGLE_API_KEY")
MAX_ATTEMPTS = 5

def run_tests() -> tuple[int, str]:
    """Run pytest suite and return exit code and stdout/stderr output."""
    print("\n[Self-Healing Agent] Executing Selenium test suite...")
    # Run pytest in headless mode
    env = os.environ.copy()
    env["HEADLESS"] = "true"
    
    # We execute pytest with -v option
    result = subprocess.run(
        ["pytest", "tests/", "-v"],
        cwd=str(BASE_DIR),
        capture_output=True,
        text=True,
        env=env
    )
    
    return result.returncode, result.stdout + "\n" + result.stderr

def ask_gemini_to_heal(traceback: str, files_context: dict) -> dict:
    """Use Gemini 2.5 Flash via REST API to analyze failure and generate the repaired code."""
    if not API_KEY:
        print("[Self-Healing Agent - ERROR] GOOGLE_API_KEY environment variable is not set. Cannot run healing.")
        sys.exit(1)
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
    
    prompt = f"""You are a Self-Healing QA Automation Developer Agent.
We ran our Selenium test suite and it failed. Your job is to analyze the traceback and edit the test files or Page Object files to fix the failure.

[TRACEBACK / TEST OUTPUT]
{traceback}

[CODEBASE CONTEXT]
"""
    for file_path, content in files_context.items():
        prompt += f"\n--- FILE: {file_path} ---\n{content}\n"
        
    prompt += """
Analyze the failure:
1. Is it a selector mismatch? (e.g. element not found)
2. Is it a timing/synchronization issue? (e.g. need an explicit wait or extra sleep)
3. Is it a logic bug in the test assertion?

Output your proposed correction. You must output the ENTIRE repaired file so that we can write it directly to disk.
Return your response ONLY as a JSON object of this exact format:
{
  "file_path": "relative/path/to/file.py", // e.g. "pages/login_page.py" or "tests/test_flow.py"
  "explanation": "Brief explanation of what broke and how we fixed it",
  "updated_content": "The complete code of the repaired file"
}
Do not include any markdown formatting like ```json or anything else. Return ONLY the raw JSON string.
"""

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    print("[Self-Healing Agent] Analyzing test failure with Gemini...")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            # Extract text content
            content_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            return json.loads(content_text)
    except Exception as e:
        print(f"[Self-Healing Agent - ERROR] Gemini API call failed: {e}")
        return {}

def get_codebase_context() -> dict:
    """Read test files and page objects for LLM context."""
    context = {}
    paths = [
        "tests/test_flow.py",
        "pages/base_page.py",
        "pages/login_page.py",
        "pages/dashboard_page.py",
    ]
    for p in paths:
        full_path = BASE_DIR / p
        if full_path.exists():
            with open(full_path, "r", encoding="utf-8") as f:
                context[p] = f.read()
    return context

def main():
    print("=" * 60)
    print("🤖   PromptPilot Self-Healing QA Agent Initiated   🤖")
    print("=" * 60)
    
    attempt = 1
    while attempt <= MAX_ATTEMPTS:
        print(f"\n--- Attempt {attempt} of {MAX_ATTEMPTS} ---")
        
        exit_code, output = run_tests()
        
        if exit_code == 0:
            print("\n✅ [Self-Healing Agent] Success! All Selenium test cases passed.")
            print("=" * 60)
            sys.exit(0)
            
        print(f"❌ [Self-Healing Agent] Tests failed on attempt {attempt}.")
        
        # Collect codebase files context
        files_context = get_codebase_context()
        
        # Call Gemini to heal
        healing_plan = ask_gemini_to_heal(output, files_context)
        
        if not healing_plan or "file_path" not in healing_plan or "updated_content" not in healing_plan:
            print("[Self-Healing Agent] Failed to retrieve a valid healing plan from Gemini. Aborting.")
            sys.exit(1)
            
        target_file_rel = healing_plan["file_path"]
        explanation = healing_plan.get("explanation", "No explanation provided.")
        updated_content = healing_plan["updated_content"]
        
        target_file_full = BASE_DIR / target_file_rel
        
        print(f"\n[Healing Action] Target: {target_file_rel}")
        print(f"[Healing Action] Reason: {explanation}")
        
        # Backup the file before modifying it
        backup_path = target_file_full.with_suffix(f".py.bak{attempt}")
        try:
            if target_file_full.exists():
                with open(target_file_full, "r", encoding="utf-8") as src:
                    with open(backup_path, "w", encoding="utf-8") as dst:
                        dst.write(src.read())
                print(f"[Healing Action] Created backup at {backup_path.name}")
            
            # Write updated content
            with open(target_file_full, "w", encoding="utf-8") as f:
                f.write(updated_content)
            print(f"✍️  [Healing Action] Repaired file successfully written.")
        except Exception as err:
            print(f"[Self-Healing Agent - ERROR] Failed to write file update: {err}")
            sys.exit(1)
            
        attempt += 1
        time.sleep(2)
        
    print(f"\n❌ [Self-Healing Agent] Maximum attempts ({MAX_ATTEMPTS}) reached. Not all tests passed.")
    print("=" * 60)
    sys.exit(1)

if __name__ == "__main__":
    main()
