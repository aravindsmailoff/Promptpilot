import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

print("Starting driver setup check...", flush=True)

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

print("Installing ChromeDriverManager...", flush=True)
try:
    driver_path = ChromeDriverManager().install()
    print(f"Driver installed at: {driver_path}", flush=True)
    service = Service(driver_path)
    print("Initializing webdriver...", flush=True)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    print("Webdriver initialized successfully!", flush=True)
    driver.get("http://localhost:9002")
    print(f"Loaded page. Title: {driver.title}", flush=True)
    driver.quit()
except Exception as e:
    print(f"Error occurred: {e}", flush=True)
