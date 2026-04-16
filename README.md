# 📸 Personal Photo Coach
**Developer: Chaw Kay**

An AI-powered PWA that guides you to take better photos with real-time Claude AI analysis and voice instructions.

---

## Requirements
- Python 3
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

---

## Run the App

Open **2 separate PowerShell windows:**

**Window 1 — AI Proxy**
```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
cd "C:\path\to\photo-coach-main"
python proxy.py
```

**Window 2 — Frontend**
```powershell
cd "C:\path\to\photo-coach-main"
python -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

> First time or not seeing changes? Press **Ctrl + Shift + R**

---

## Deploy on Vercel (phone / production)

The app **cannot** use `localhost:8081` on your phone. Vercel runs **`api/analyze.js`**, which reads your key from the dashboard.

1. Push this repo to GitHub and import it in Vercel (or connect the repo you already use).
2. In Vercel → **Project → Settings → Environment Variables**, add **`ANTHROPIC_API_KEY`** (same as local). Scope: **Production** (and Preview if you want).
3. **Redeploy** the project (Deployments → ⋮ → Redeploy). New env vars only apply after a deploy.
4. Open your **`*.vercel.app`** URL on the phone. The app calls **`/api/analyze`** on the same domain (no localhost).

> **Free (Hobby) plan:** serverless functions time out after **10s** by default. If analysis sometimes fails on slow networks, upgrade Vercel or retry; `vercel.json` requests up to **60s** for Pro-class plans.

---

## How to Use
1. Tap **Open Camera** and take a scouting photo
2. Wait for Claude AI to analyze the scene
3. Follow the voice-guided steps on screen
4. Tap the shutter when done
5. Tap **Save Photo** to download

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| AI not working | Make sure `proxy.py` is running (Window 1) |
| 401 error | Check your API key is correct |
| Camera blocked | Allow camera permission in browser |
| Old version showing | Press Ctrl + Shift + R |
| Works on PC, not on phone (Vercel) | Deploy latest code with `api/analyze.js`, set env var, **Redeploy** |
