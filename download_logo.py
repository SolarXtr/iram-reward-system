import urllib.request
import base64

url = 'https://upload.wikimedia.org/wikipedia/commons/e/e3/MED_NU.png'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = resp.read()

print('Downloaded MED_NU logo, bytes:', len(data))

b64 = base64.b64encode(data).decode('ascii')
with open(r'D:\.gemini\antigravity\scratch\iram-reward-system\src\services\medNuLogo.ts', 'w', encoding='utf-8') as f:
    f.write(f'export const MED_NU_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/e/e3/MED_NU.png";\n')
    f.write(f'export const MED_NU_LOGO_BASE64 = "{b64}";\n')

print('Saved to medNuLogo.ts successfully')
