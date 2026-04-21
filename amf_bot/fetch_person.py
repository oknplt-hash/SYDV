import json
import base64
import requests
import pyamf
from pyamf import remoting
import os
import sys
import uuid
import re
import pyamf.amf3

# Monkey-patch pyamf
old_readDate = pyamf.amf3.Decoder.readDate
def safe_readDate(self):
    try: return old_readDate(self)
    except Exception: return None
pyamf.amf3.Decoder.readDate = safe_readDate

def extract_strings(binary_data):
    strings = re.findall(b'[a-zA-Z0-9_\.\-\/\:\ \(\)\*\,\?\!]{4,}', binary_data)
    return [s.decode('latin1', errors='ignore') for s in strings]

def fetch_data(hane_no):
    har_path = os.path.join(os.path.dirname(__file__), 'butunlesik.har')
    if not os.path.exists(har_path):
        return {"error": "HAR dosyasi bulunamadi."}

    try:
        with open(har_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        return {"error": f"HAR dosyasi okuma hatasi: {str(e)}"}

    req_url = None
    req_headers = {}
    req_cookies = {}
    templates = {}

    for entry in data['log']['entries']:
        req = entry['request']
        if 'amf' in req.get('url', '') and 'postData' in req and 'text' in req['postData']:
            text = req['postData']['text']
            decoded = base64.b64decode(text) if req['postData'].get('encoding') == 'base64' else text.encode('latin1')
            try:
                envelope = remoting.decode(decoded)
                for t, msg in envelope.items():
                    op = msg.body[0].operation
                    if op in ['getAidSummaryOfHouseRecord', 'getIncomeTestAndSummaryInfoOfHouseRecord', 'getCentralInvestigationSummaryOfHouseRecord', 'getEntitiesWithTouchedProperties']:
                        if op == 'getEntitiesWithTouchedProperties':
                            key = op + "_" + str(msg.body[0].body[0]).split('.')[-1]
                        else:
                            key = op
                        if key not in templates:
                            templates[key] = decoded
                req_url = req['url']
                for c in req['cookies']: req_cookies[c['name']] = c['value']
                for h in req['headers']:
                    name = h['name'].lower()
                    if name not in ['host', 'content-length', 'origin', 'referer', 'accept-encoding']:
                        req_headers[h['name']] = h['value']
                req_headers['Content-Type'] = 'application/x-amf'
            except: pass

    if not req_url:
        return {"error": "HAR dosyasi icinde gecerli AMF istegi bulunamadi."}

    kisi_detaylari = {
        "file_no": hane_no,
        "full_name": "",
        "national_id": "",
        "birth_date": "",
        "phone": "",
        "spouse_name": "",
        "household_description": "",
        "assistance_records": []
    }

    pyamf.AMF3 = pyamf.AMF3

    # 1. Hane Ziyareti
    if 'getIncomeTestAndSummaryInfoOfHouseRecord' in templates:
        env = remoting.decode(templates['getIncomeTestAndSummaryInfoOfHouseRecord'])
        for t, msg in env.items():
            msg.body[0].body = [hane_no]
            msg.body[0].messageId = str(uuid.uuid4()).upper()
        try:
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            resp_env = remoting.decode(resp.content)
            for t, message in resp_env.items():
                asl_veri = message.body.body if hasattr(message.body, 'body') else message.body
                if isinstance(asl_veri, str):
                    match = re.search(r'Ziyareti[^<]*</b>(.*)', asl_veri, re.DOTALL | re.IGNORECASE)
                    if match: kisi_detaylari["household_description"] = match.group(1).strip()
        except: pass

    # 2. Central Summary (Name, Spouse)
    if 'getCentralInvestigationSummaryOfHouseRecord' in templates:
        env = remoting.decode(templates['getCentralInvestigationSummaryOfHouseRecord'])
        for t, msg in env.items():
            msg.body[0].body = [hane_no]
            msg.body[0].messageId = str(uuid.uuid4()).upper()
        try:
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            resp_env = remoting.decode(resp.content)
            for t, message in resp_env.items():
                asl_veri = message.body.body if hasattr(message.body, 'body') else message.body
                if isinstance(asl_veri, str):
                    matches = re.finditer(r'<b>([^<]+)</b>\s*<b>\(\s*\d+</b>\s*-\s*<b>([^<]+)\)', asl_veri, re.IGNORECASE)
                    for m in matches:
                        isim = m.group(1).strip()
                        yakinlik = m.group(2).strip().upper()
                        if "KEND" in yakinlik:
                            kisi_detaylari["full_name"] = isim
                        elif "EŞ" in yakinlik or "ES" in yakinlik or "E" in yakinlik:
                            if "KARDE" not in yakinlik and "NNE" not in yakinlik and "BABA" not in yakinlik:
                                if "EŞ" in yakinlik or "ES" in yakinlik or "Eİ" in yakinlik or "NİKAH" in yakinlik:
                                    kisi_detaylari["spouse_name"] = isim
        except: pass

    # 3. Birth Date (Citizen)
    if 'getEntitiesWithTouchedProperties_Citizen' in templates:
        env = remoting.decode(templates['getEntitiesWithTouchedProperties_Citizen'])
        for t, msg in env.items():
            if len(msg.body[0].body) > 2 and isinstance(msg.body[0].body[2], (list, pyamf.flex.ArrayCollection)):
                 msg.body[0].body[2][0] = hane_no
            msg.body[0].messageId = str(uuid.uuid4()).upper()
        try:
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            resp_env = remoting.decode(resp.content)
            import datetime
            def normalize(s): return ''.join(c for c in s if c.isalnum() or c.isspace()).strip().upper()
            bulunan_kisi = normalize(kisi_detaylari.get("full_name", ""))
            for t, msg in resp_env.items():
                data = msg.body.body if hasattr(msg.body, 'body') else msg.body
                if isinstance(data, (list, pyamf.flex.ArrayCollection)):
                    for obj in data:
                        obj_dict = obj if isinstance(obj, dict) else getattr(obj, '__dict__', {})
                        if isinstance(obj, pyamf.TypedObject): obj_dict = obj
                        obj_name = normalize(obj_dict.get('name', ''))
                        if obj_name and obj_name in bulunan_kisi and obj_dict.get('birthdate'):
                            kisi_detaylari["birth_date"] = obj_dict.get('birthdate').strftime('%Y-%m-%d')
        except: pass

    # 4. TC ve Phone
    if 'getEntitiesWithTouchedProperties_HouseRecord' in templates:
        env = remoting.decode(templates['getEntitiesWithTouchedProperties_HouseRecord'])
        for t, msg in env.items():
            if len(msg.body[0].body) > 2 and isinstance(msg.body[0].body[2], (list, pyamf.flex.ArrayCollection)):
                 msg.body[0].body[2][0] = hane_no
            msg.body[0].messageId = str(uuid.uuid4()).upper()
        try:
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            strings = extract_strings(resp.content)
            tcler = [s for s in strings if re.match(r'^[1-9][0-9]{10}$', s.strip())]
            telefonlar = [s for s in strings if re.match(r'^05[0-9]{9}$', s.strip())]
            if tcler: kisi_detaylari["national_id"] = tcler[0]
            gercek_telefonlar = [t for t in telefonlar if t != '05305756968']
            if gercek_telefonlar: kisi_detaylari["phone"] = gercek_telefonlar[-1]
        except: pass

    # 5. Aid History
    if 'getAidSummaryOfHouseRecord' in templates:
        env = remoting.decode(templates['getAidSummaryOfHouseRecord'])
        for t, msg in env.items():
            msg.body[0].body = [hane_no]
            msg.body[0].messageId = str(uuid.uuid4()).upper()
        try:
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            resp_env = remoting.decode(resp.content)
            for t, message in resp_env.items():
                asl_veri = message.body.body if hasattr(message.body, 'body') else message.body
                if isinstance(asl_veri, str) and asl_veri.strip():
                    satirlar = asl_veri.split('\n')
                    for satir in satirlar:
                        if not satir.strip(): continue
                        temiz_satir = satir.replace('<b>', '').replace('</b>', '')
                        parcalar = [p.strip() for p in temiz_satir.split('   ') if p.strip()]
                        if len(parcalar) >= 4:
                            kisi_detaylari["assistance_records"].append({
                                "type": parcalar[0],
                                "date": parcalar[1],
                                "amount": parcalar[3]
                            })
        except: pass

    return kisi_detaylari

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Lütfen Hane No belirtin."}))
        sys.exit(1)
        
    res = fetch_data(int(sys.argv[1]))
    print(json.dumps(res, ensure_ascii=False))
