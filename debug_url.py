from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("DATABASE_URL")
print(f"Original URL: {url}")
try:
    parsed = urlparse(url)
    print(f"Hostname: {parsed.hostname}")
    print(f"Port: {parsed.port}")
    print(f"Username: {parsed.username}")
    # Don't print password explicitly to avoid leaking it in logs if possible, or just print length
    print(f"Password length: {len(parsed.password) if parsed.password else 0}")
except Exception as e:
    print(f"Error parsing: {e}")
