import json
import base64
import requests
import pyamf
from pyamf import remoting
import os
import sys
import io
import uuid
import re
import pyamf.amf3
from datetime import datetime

# Windows terminal kodlama hatasını önlemek için
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Monkey-patch pyamf
old_readDate = pyamf.amf3.Decoder.readDate
def safe_readDate(self):
    try: return old_readDate(self)
    except: return None
pyamf.amf3.Decoder.readDate = safe_readDate

def fix_turkish(s):
    # Önce kontrol karakteri içeren byte çiftlerini düzelt (strip'ten ÖNCE yapılmalı)
    s = s.replace('\xc5\x9e', 'Ş')  # Büyük Ş
    s = s.replace('\xc5\x9f', 'ş')  # Küçük ş
    s = s.replace('\xc4\x9e', 'Ğ')  # Büyük Ğ
    s = s.replace('\xc4\x9f', 'ğ')  # Küçük ğ
    s = s.replace('\xc4\xb0', 'İ')  # Büyük İ
    s = s.replace('\xc3\x9c', 'Ü')  # Büyük Ü
    s = s.replace('\xc3\x96', 'Ö')  # Büyük Ö
    s = s.replace('\xc3\x87', 'Ç')  # Büyük Ç
    # Sonra standart latin1→UTF-8 bozulmalarını düzelt
    repls = {
        'Ã\x83Â¼': 'ü', 'Ã\x84Â±': 'ı', 'Ã\x85Â\x9f': 'ş', 'Ã\x84Â\x9f': 'ğ',
        'Ã\x83Â¶': 'ö', 'Ã\x83Â§': 'ç', 'Ã\x84Â°': 'İ', 'Ã\x83Â\x9c': 'Ü',
        'Ã\x83Â–': 'Ö', 'Ã\x83Â‡': 'Ç', 'Ã\x85Âž': 'Ş', 'Ã\x84Â\x9e': 'Ğ',
        'Ã¼': 'ü', 'Ã¶': 'ö', 'Ã§': 'ç', 'ÅŸ': 'ş', 'Ä±': 'ı', 'ÄŸ': 'ğ',
        'Ãœ': 'Ü', 'Ã–': 'Ö', 'Ã‡': 'Ç', 'Åž': 'Ş', 'Ä°': 'İ', 'Äž': 'Ğ',
        'Â': '', # Remove weird circumflex artifacts
        'Ã': 'ı', # Catch-all for certain weird encodings
        'Ä': 'İ'  # common at the end of words like CADDESİ
    }
    for old, new in repls.items():
        s = s.replace(old, new)
    s = re.sub(r'[\x00-\x1F\x7F-\x9F]', '', s)
    return s.strip()

def parse_turkish_date(date_str):
    date_str = fix_turkish(date_str).upper()
    aylar = {
        'OCAK': '01', 'ŞUBAT': '02', 'MART': '03', 'NİSAN': '04', 'MAYIS': '05', 'HAZİRAN': '06',
        'TEMMUZ': '07', 'AĞUSTOS': '08', 'EYLÜL': '09', 'EKİM': '10', 'KASIM': '11', 'ARALIK': '12'
    }
    try:
        if '.' in date_str: return datetime.strptime(date_str, '%d.%m.%Y').strftime('%Y-%m-%d')
        parts = date_str.split()
        if len(parts) >= 3:
            gun = parts[0].zfill(2)
            ay = aylar.get(parts[1], '01')
            yil = parts[2]
            return f"{yil}-{ay}-{gun}"
    except: pass
    return None

def map_aid_type(raw_type):
    # case-insensitive arama (.upper() Türkçe İ/I sorununa neden olduğu için)
    t = fix_turkish(raw_type)
    tl = t.lower()
    if 'eğitim' in tl or 'egitim' in tl: return "Eğitim Yardımı"
    if 'gıda' in tl or 'gida' in tl: return "Gıda Yardımı"
    if 'kömür' in tl or 'komur' in tl or 'tki' in tl or 'tkİ' in tl: return "Kömür Yardımı"
    if 'sağlık' in tl or 'saglik' in tl: return "Sağlık Yardımı"
    if 'aile' in tl: return "Aile Yardımı"
    if 'eşya' in tl or 'esya' in tl: return "Ev Eşyası Yardımı"
    if 'kira' in tl: return "Kira Yardımı"
    if 'nakit' in tl: return "Nakit Yardım"
    if 'yol' in tl: return "Yol Yardımı"
    if 'doğalgaz' in tl or 'dogalgaz' in tl: return "Doğalgaz Desteği"
    if 'shçek' in tl or 'shcek' in tl: return "SHÇEK"
    if '65' in tl: return "Yaşlı Aylığı"
    if 'engelli' in tl: return "Engelli Aylığı"
    return "Diğer"

def extract_strings(binary_data):
    # \x80-\xFF dahil edildi: UTF-8 multi-byte Türkçe karakterlerin devam baytları (\x80-\xBF) korunuyor
    strings = re.findall(rb'[a-zA-Z0-9_\.\-\/\:\ \(\)\*\,\?\!\x80-\xFF]{4,}', binary_data)
    res = []
    for s in strings:
        try: res.append(fix_turkish(s.decode('utf-8')))
        except: res.append(fix_turkish(s.decode('latin1', errors='ignore')))
    return res

def fetch_data(hane_no):
    har_path = os.path.join(os.path.dirname(__file__), 'butunlesik.har')
    if not os.path.exists(har_path): return {"error": "HAR dosyasi bulunamadi."}

    try:
        with open(har_path, 'r', encoding='utf-8') as f: data = json.load(f)
    except: return {"error": "HAR hatasi."}

    req_url, req_headers, req_cookies, templates = None, {}, {}, {}
    for entry in data['log']['entries']:
        req = entry['request']
        if 'amf' in req.get('url', '') and 'postData' in req and 'text' in req['postData']:
            text = req['postData']['text']
            decoded = base64.b64decode(text) if req['postData'].get('encoding') == 'base64' else text.encode('latin1')
            try:
                envelope = remoting.decode(decoded)
                for t, msg in envelope.items():
                    op = msg.body[0].operation
                    if op in ['getAidSummaryOfHouseRecord', 'getIncomeTestAndSummaryInfoOfHouseRecord', 'getCentralInvestigationSummaryOfHouseRecord', 'getEntitiesWithTouchedProperties', 'getSNTSummaryOfHouseRecord']:
                        key = op + "_" + str(msg.body[0].body[0]).split('.')[-1] if op == 'getEntitiesWithTouchedProperties' else op
                        if key not in templates: templates[key] = decoded
                req_url = req['url']
                for h in req['headers']:
                    if h['name'].lower() not in ['host', 'content-length']: req_headers[h['name']] = h['value']
                for c in req['cookies']: req_cookies[c['name']] = c['value']
                req_headers['Content-Type'] = 'application/x-amf'
            except: pass

    if not req_url: return {"error": "Oturum bulunamadi."}
    
    kisi = {
        "file_no": hane_no, "full_name": "", "national_id": "", "birth_date": "",
        "phone": "", "spouse_name": "", "address": "", "household_description": "",
        "household_size": 0, "children_count": 0,
        "household_income": "", "per_capita_income": "", "social_security": "",
        "central_programs": [],
        "assistance_records": []
    }

    # 1. Hane Ziyaret Notu & Isimler
    if 'getIncomeTestAndSummaryInfoOfHouseRecord' in templates:
        try:
            env = remoting.decode(templates['getIncomeTestAndSummaryInfoOfHouseRecord'])
            env.items()[0][1].body[0].body = [hane_no]
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            txt = fix_turkish(resp.content.decode('latin1', errors='ignore'))
            
            # Oturum kontrolü
            if "Session Expired" in txt or "Authentication Failed" in txt or resp.status_code in [301, 302, 401, 403]:
                return {"error": "Oturum süresi dolmuş (Session Expired). Lütfen Bütünleşik sisteme giriş yapıp yeni bir HAR dosyası indirin."}
                
            # Ziyaret notları
            match = re.search(r'Ziyareti[^<]*</b>(.*?)<b>', txt, re.DOTALL | re.IGNORECASE)
            if match:
                desc = match.group(1).strip()
                kisi["household_description"] = desc
                # Toplam Gelir
                m_toplam = re.search(r'TOPLAM\s*:\s*([\d\.]+[,\d]*)', desc, re.IGNORECASE)
                if m_toplam: kisi["household_income"] = m_toplam.group(1).replace('.', '').replace(',', '.')
                # Kişibaşı Gelir
                m_kisi = re.search(r'K[\wİŞ]+\s*BA[\wŞI]+\s+AYLIK[^:]*:\s*([\d\.]+[,\d]*)', desc, re.IGNORECASE)
                if m_kisi: kisi["per_capita_income"] = m_kisi.group(1).replace('.', '').replace(',', '.')
            
            # Merkezi Yardım Tespiti (Bu servisten de kontrol et)
            txt_lower = txt.lower()
            if any(x in txt_lower for x in ['engelli aylığı', 'engelli ayligi', 'engelli yakını aylığı', 'engelli yakini ayligi']):
                if "Engelli Aylığı" not in kisi["central_programs"]: kisi["central_programs"].append("Engelli Aylığı")
            if any(x in txt_lower for x in ['yaşlı aylığı', 'yasli ayligi']):
                if "Yaşlı Aylığı" not in kisi["central_programs"]: kisi["central_programs"].append("Yaşlı Aylığı")
            if any(x in txt_lower for x in ['elektrik tüketim', 'elektrik tuketim']):
                if "Elektrik Tüketim Desteği" not in kisi["central_programs"]: kisi["central_programs"].append("Elektrik Tüketim Desteği")
            if any(x in txt_lower for x in ['şartlı eğitim', 'sartli egitim', 'şartlı sağlık', 'sartli saglik', 'şartlı gebelik', 'sartli gebelik']):
                if "Şartlı Eğitim Sağlık" not in kisi["central_programs"]: kisi["central_programs"].append("Şartlı Eğitim Sağlık")
            if any(x in txt_lower for x in ['doğalgaz tüketim', 'dogalgaz tuketim']):
                if "Doğalgaz Tüketim Desteği" not in kisi["central_programs"]: kisi["central_programs"].append("Doğalgaz Tüketim Desteği")
            if any(x in txt_lower for x in ['eşi vefat', 'esi vefat']):
                if "E.V.E.K" not in kisi["central_programs"]: kisi["central_programs"].append("E.V.E.K")
        except: pass

    if 'getCentralInvestigationSummaryOfHouseRecord' in templates:
        try:
            env = remoting.decode(templates['getCentralInvestigationSummaryOfHouseRecord'])
            env.items()[0][1].body[0].body = [hane_no]
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            txt = fix_turkish(resp.content.decode('latin1', errors='ignore'))
            txt_lower = txt.lower()
            if any(x in txt_lower for x in ['engelli aylığı', 'engelli ayligi', 'engelli yakını aylığı', 'engelli yakini ayligi']): 
                if "Engelli Aylığı" not in kisi["central_programs"]: kisi["central_programs"].append("Engelli Aylığı")
            if any(x in txt_lower for x in ['yaşlı aylığı', 'yasli ayligi']):
                if "Yaşlı Aylığı" not in kisi["central_programs"]: kisi["central_programs"].append("Yaşlı Aylığı")
            if any(x in txt_lower for x in ['elektrik tüketim', 'elektrik tuketim']):
                if "Elektrik Tüketim Desteği" not in kisi["central_programs"]: kisi["central_programs"].append("Elektrik Tüketim Desteği")
            if any(x in txt_lower for x in ['şartlı eğitim', 'sartli egitim', 'şartlı sağlık', 'sartli saglik', 'şartlı gebelik', 'sartli gebelik', 'şartlı nakit', 'sartli nakit']):
                if "Şartlı Eğitim Sağlık" not in kisi["central_programs"]: kisi["central_programs"].append("Şartlı Eğitim Sağlık")
            if any(x in txt_lower for x in ['doğalgaz tüketim', 'dogalgaz tuketim', 'doğalgaz', 'dogalgaz']):
                if "Doğalgaz Tüketim Desteği" not in kisi["central_programs"]: kisi["central_programs"].append("Doğalgaz Tüketim Desteği")
            if any(x in txt_lower for x in ['eşi vefat', 'esi vefat']):
                if "E.V.E.K" not in kisi["central_programs"]: kisi["central_programs"].append("E.V.E.K")

            # Sosyal Güvence tespiti
            sg_matches = re.findall(r'Sa[ğg]l[ıi]k G[üu]vencesi\((.*?)\)', txt, re.IGNORECASE)
            for sg in sg_matches:
                sg_lower = sg.lower()
                is_kendisi = 'kendisi' in sg_lower or 'bilinmiyor' in sg_lower
                
                val = ""
                if '60/c3' in sg_lower and '65 yaş' in sg_lower: val = "65 Maaşı"
                elif '60/c1' in sg_lower and 'yeşilkart' in sg_lower: val = "G0"
                elif '60/g' in sg_lower and 'isteğe bağlı' in sg_lower: val = "G1"
                elif 'yaşlılık' in sg_lower or 'ölüm çocuk' in sg_lower: val = "Emekli"
                elif 'zorunlu sigortalılar' in sg_lower: val = "SGK"
                
                if val:
                    if is_kendisi or not kisi.get("social_security"):
                        kisi["social_security"] = val
                    if is_kendisi:
                        break

            b_tags = re.findall(r'<b>(.*?)</b>', txt, re.IGNORECASE)
            member_count = 0
            child_count = 0
            for i in range(len(b_tags)):
                tag = b_tags[i].strip()
                tag_lower = tag.lower()
                if len(tag) < 15:
                    is_role = False
                    if re.search(r'KEND', tag, re.I):
                        is_role = True
                        if i >= 2: kisi["full_name"] = b_tags[i-2].strip()
                        elif i > 0: kisi["full_name"] = b_tags[i-1].strip()
                    elif re.search(r'^E.{0,10}i\)?$', tag, re.I):
                        is_role = True
                        if i >= 2: kisi["spouse_name"] = b_tags[i-2].strip()
                    elif any(x in tag_lower for x in ['oğlu', 'oglu', 'kızı', 'kizi']):
                        is_role = True
                        child_count += 1
                    elif any(x in tag_lower for x in ['annesi', 'babası', 'babasi', 'kardeşi', 'kardesi', 'gelini', 'damadı', 'damadi', 'torunu', 'kayın', 'kayin']):
                        is_role = True
                    if is_role: member_count += 1
            kisi["household_size"] = member_count
            kisi["children_count"] = child_count
        except: pass

    if 'getSNTSummaryOfHouseRecord' in templates:
        try:
            env = remoting.decode(templates['getSNTSummaryOfHouseRecord'])
            env.items()[0][1].body[0].body = [hane_no]
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            txt = fix_turkish(resp.content.decode('latin1', errors='ignore'))
            txt_lower = txt.lower()
            if any(x in txt_lower for x in ['engelli aylığı', 'engelli ayligi', 'engelli yakını aylığı', 'engelli yakini ayligi']):
                if "Engelli Aylığı" not in kisi["central_programs"]: kisi["central_programs"].append("Engelli Aylığı")
            if any(x in txt_lower for x in ['yaşlı aylığı', 'yasli ayligi']):
                if "Yaşlı Aylığı" not in kisi["central_programs"]: kisi["central_programs"].append("Yaşlı Aylığı")
            if any(x in txt_lower for x in ['elektrik tüketim', 'elektrik tuketim']):
                if "Elektrik Tüketim Desteği" not in kisi["central_programs"]: kisi["central_programs"].append("Elektrik Tüketim Desteği")
            if any(x in txt_lower for x in ['şartlı eğitim', 'sartli egitim', 'şartlı sağlık', 'sartli saglik', 'şartlı gebelik', 'sartli gebelik', 'şartlı nakit', 'sartli nakit']):
                if "Şartlı Eğitim Sağlık" not in kisi["central_programs"]: kisi["central_programs"].append("Şartlı Eğitim Sağlık")
            if any(x in txt_lower for x in ['doğalgaz tüketim', 'dogalgaz tuketim', 'doğalgaz', 'dogalgaz']):
                if "Doğalgaz Tüketim Desteği" not in kisi["central_programs"]: kisi["central_programs"].append("Doğalgaz Tüketim Desteği")
            if any(x in txt_lower for x in ['eşi vefat', 'esi vefat']):
                if "E.V.E.K" not in kisi["central_programs"]: kisi["central_programs"].append("E.V.E.K")
        except: pass

    # 2. Dogum Tarihi
    if kisi["full_name"] and 'getEntitiesWithTouchedProperties_Citizen' in templates:
        try:
            env = remoting.decode(templates['getEntitiesWithTouchedProperties_Citizen'])
            msg = env.items()[0][1]
            if len(msg.body[0].body) > 2: msg.body[0].body[2][0] = hane_no
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            resp_env = remoting.decode(resp.content)
            bulunan = kisi["full_name"].upper().replace('I','İ')
            for t, mess in resp_env.items():
                data = mess.body.body if hasattr(mess.body, 'body') else mess.body
                if isinstance(data, (list, pyamf.flex.ArrayCollection)):
                    for obj in data:
                        d = obj if isinstance(obj, dict) else getattr(obj, '__dict__', {})
                        o_name = (d.get('name', '') + ' ' + d.get('surname', '')).upper().replace('I','İ')
                        if bulunan[:8] in o_name or o_name[:8] in bulunan:
                            if d.get('birthdate'): kisi["birth_date"] = d.get('birthdate').strftime('%Y-%m-%d'); break
        except: pass

    # 3. Adres & TC & Telefon (Yapısal AMF ayrıştırma)
    if 'getEntitiesWithTouchedProperties_HouseRecord' in templates:
        try:
            env = remoting.decode(templates['getEntitiesWithTouchedProperties_HouseRecord'])
            msg = env.items()[0][1]
            if len(msg.body[0].body) > 2: msg.body[0].body[2][0] = hane_no
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            
            # TC ve Telefon için binary string tarama (sadece kısa sayısal değerler)
            strs = extract_strings(resp.content)
            for s in strs:
                s = s.strip()
                if re.match(r'^[1-9][0-9]{10}$', s): kisi["national_id"] = s
                elif re.match(r'^05[0-9]{9}$', s) and s != '05305756968': kisi["phone"] = s
            
            # Adres: Yapısal AMF decode ile owner.currentAddress'ten oku
            try:
                resp_env = remoting.decode(resp.content)
                for t, mess in resp_env.items():
                    data = mess.body.body if hasattr(mess.body, 'body') else mess.body
                    if isinstance(data, (list, pyamf.flex.ArrayCollection)):
                        for obj in data:
                            d = obj if isinstance(obj, dict) else getattr(obj, '__dict__', {})
                            # Telefon numarası (HouseRecord seviyesinde)
                            phone_hr = d.get('mobilePhoneNumber') or d.get('phoneNumber')
                            if phone_hr and re.match(r'^05[0-9]{9}$', str(phone_hr)) and str(phone_hr) != '05305756968':
                                kisi["phone"] = str(phone_hr)
                            # owner.currentAddress'ten adres bilgisi
                            owner = d.get('owner')
                            if owner:
                                owner_d = owner if isinstance(owner, dict) else getattr(owner, '__dict__', {})
                                addr_obj = owner_d.get('currentAddress')
                                if addr_obj:
                                    a = addr_obj if isinstance(addr_obj, dict) else getattr(addr_obj, '__dict__', {})
                                    mahalle = fix_turkish(str(a.get('mahalle', ''))) if a.get('mahalle') else ''
                                    csmb = fix_turkish(str(a.get('csmb', ''))) if a.get('csmb') else ''  # Bina/Site/Küme adı
                                    dis_kapi = str(a.get('disKapiNo', '')) if a.get('disKapiNo') else ''
                                    ic_kapi = str(a.get('icKapiNo', '')) if a.get('icKapiNo') else ''
                                    koy = fix_turkish(str(a.get('koy', ''))) if a.get('koy') else ''
                                    
                                    # İlçe ve İl bilgisi
                                    ilce, il = '', ''
                                    district = a.get('district')
                                    if district:
                                        dist_d = district if isinstance(district, dict) else getattr(district, '__dict__', {})
                                        ilce = fix_turkish(str(dist_d.get('districtName', ''))) if dist_d.get('districtName') else ''
                                        city = dist_d.get('city')
                                        if city:
                                            city_d = city if isinstance(city, dict) else getattr(city, '__dict__', {})
                                            il = fix_turkish(str(city_d.get('cityName', ''))) if city_d.get('cityName') else ''
                                    
                                    # Adres formatla: "MAH. BİNA No: DIS/IC İLÇE/İL"
                                    parts = []
                                    if mahalle: parts.append(mahalle)
                                    if csmb: parts.append(csmb)
                                    if koy and not mahalle: parts.append(koy)
                                    if dis_kapi:
                                        no_str = f"No: {dis_kapi}"
                                        if ic_kapi: no_str += f"/{ic_kapi}"
                                        parts.append(no_str)
                                    if ilce and il: parts.append(f"{ilce}/{il}")
                                    elif ilce: parts.append(ilce)
                                    elif il: parts.append(il)
                                    
                                    if parts:
                                        kisi["address"] = ' '.join(parts)
            except: pass
        except: pass

    # 4. Yardımlar - <b> etiketlerine göre satırlara böl
    if 'getAidSummaryOfHouseRecord' in templates:
        try:
            env = remoting.decode(templates['getAidSummaryOfHouseRecord'])
            env.items()[0][1].body[0].body = [hane_no]
            resp = requests.post(req_url, headers=req_headers, cookies=req_cookies, data=remoting.encode(env).getvalue(), verify=False)
            txt = fix_turkish(resp.content.decode('latin1', errors='ignore'))
            
            results = []
            # Veri tek satırda geliyor: <b>TÜR</b>   TARİH   DURUM   MİKTARTL<b>TÜR</b>...
            # <b> ile bölerek her yardımı ayrı satır olarak ele al
            segments = re.split(r'<b>', txt)
            for seg in segments:
                if '</b>' not in seg: continue
                # seg = "Diğer Eğitim Yardımı</b>   20 Şubat 2026   Tamamlandı   2.000,00TL"
                seg_clean = seg.replace('</b>', '  ')  # </b> yerine boşluk koy
                parts = [p.strip() for p in seg_clean.split('   ') if p.strip()]
                # parts = ["Diğer Eğitim Yardımı", "20 Şubat 2026", "Tamamlandı", "2.000,00TL"]
                if len(parts) >= 4:
                    aid_type = map_aid_type(parts[0])
                    d_iso = parse_turkish_date(parts[1])
                    if not d_iso: continue
                    # Miktar: son elemandan TL'yi temizle
                    amt = parts[3].replace('TL', '').replace(' ', '').strip()
                    results.append({"type": aid_type, "date": d_iso, "amount": amt})
            
            kisi["assistance_records"] = sorted(results, key=lambda x: x['date'], reverse=True)[:3]
        except: pass

    return kisi

if __name__ == "__main__":
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    try:
        res = fetch_data(int(sys.argv[1]))
        sys.stdout.buffer.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
    except Exception as e:
        sys.stdout.buffer.write(json.dumps({"error": str(e)}).encode('utf-8'))
