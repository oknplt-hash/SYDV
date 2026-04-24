from http.server import BaseHTTPRequestHandler
import urllib.parse
import json
import sys
import os
import psycopg2

# amf_bot dizinine erişebilmek için sys.path ekliyoruz
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from amf_bot.fetch_person import fetch_data

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        query_components = urllib.parse.parse_qs(query)
        file_no = query_components.get('file_no', [None])[0]
        
        if not file_no:
            self.send_response(400)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "file_no parametresi zorunludur"}).encode('utf-8'))
            return
            
        har_data = None
        db_url = os.environ.get('DATABASE_URL')
        if db_url:
            try:
                conn = psycopg2.connect(db_url, sslmode='require')
                cur = conn.cursor()
                cur.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'amf_har_data'")
                row = cur.fetchone()
                if row and row[0]:
                    har_data = json.loads(row[0])
                cur.close()
                conn.close()
            except Exception as e:
                print("DB Error:", e)
                # Veritabanı hatası olsa bile yerel butunlesik.har'dan devam etmeyi dener.
                
        try:
            res = fetch_data(int(file_no), har_data=har_data)
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
