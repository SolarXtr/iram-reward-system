import base64

with open(r'D:\0GGCloud\4Reward\My Drive\site-pub\REWARDFORM\garuda_extracted.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('ascii')

with open(r'D:\.gemini\antigravity\scratch\iram-reward-system\src\services\garudaBase64.ts', 'w', encoding='utf-8') as out:
    out.write(f'export const GARUDA_BASE64 = "{b64}";\n')

print('Successfully written garudaBase64.ts, length:', len(b64))
