import urllib.request
import json
import base64

# Use Wikimedia API to get exact image URL
api_url = "https://commons.wikimedia.org/w/api.php?action=query&titles=File:Garuda_Emblem_of_Thailand_(Monochrome_2).svg&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'}

req = urllib.request.Request(api_url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

pages = data['query']['pages']
for k, v in pages.items():
    thumb_url = v['imageinfo'][0]['thumburl']
    orig_url = v['imageinfo'][0]['url']
    print("Thumbnail URL:", thumb_url)
    print("Original URL:", orig_url)

# Download thumb PNG
req2 = urllib.request.Request(thumb_url, headers=headers)
with urllib.request.urlopen(req2) as resp2:
    png_bytes = resp2.read()

print("Downloaded PNG bytes:", len(png_bytes))

b64 = base64.b64encode(png_bytes).decode('ascii')
with open(r"D:\.gemini\antigravity\scratch\iram-reward-system\src\services\garudaBase64.ts", "w", encoding="utf-8") as f:
    f.write(f'export const GARUDA_MONOCHROME_URL = "{thumb_url}";\n')
    f.write(f'export const GARUDA_BASE64 = "{b64}";\n')

print("Updated garudaBase64.ts successfully")
