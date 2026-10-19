import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        response = {
            "service": "appium_tests",
            "status": "ready",
            "bound_promptpilot_url": os.getenv("PROMPTPILOT_URL")
        }
        self.wfile.write(json.dumps(response).encode())
