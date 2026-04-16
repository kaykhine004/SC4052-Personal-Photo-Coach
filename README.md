# 📸 Personal Photo Coach

> An AI-powered photo coaching PWA built with Claude AI.  
> 💻 Developer: Chaw Kay

---

## What It Does

1. **Scout** — Take a scouting photo of your subject and surroundings
2. **Analyze** — Claude AI analyzes the scene in real time
3. **Shoot** — Follow step-by-step voice-guided instructions to get the perfect shot

---

## Project Structure

```
photo-coach-main/
├── index.html       ← App entry point
├── app.js           ← Main app logic
├── style.css        ← Styles & animations
├── manifest.json    ← PWA config
├── sw.js            ← Service Worker (offline caching)
├── proxy.py         ← Local proxy server for Anthropic API
├── .gitignore
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Requirements

- Python 3.x installed
- An Anthropic API key → get one at [console.anthropic.com](https://console.anthropic.com)

---

## How to Run Locally

You need **two PowerShell terminals** open at the same time.

---

### Terminal 1 — Start the AI Proxy Server

This forwards your photo to Claude AI using your API key.

```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
cd "path\to\photo-coach-main"
python proxy.py
```

You should see:
```
Starting proxy server on http://localhost:8081
```

> ⚠️ Replace `your-api-key-here` with your real Anthropic API key.  
> The key stays on your machine and is never exposed in the browser.

---

### Terminal 2 — Start the Frontend Server

```powershell
cd "path\to\photo-coach-main"
python -m http.server 8080
```

---

### Open the App

Go to your browser and visit:

```
http://localhost:8080
```

> 💡 If you've opened it before, press **Ctrl + Shift + R** to hard refresh and clear the cache.

---

## How to Use

1. Click **📷 Open Camera** (or choose a photo from gallery)
2. Take a scouting photo that includes your subject and background
3. Wait a few seconds — Claude AI will analyze the scene ✨
4. Follow the on-screen step-by-step instructions with voice guidance
5. When all steps are done, press the shutter to take the final photo
6. Tap **💾 Save Photo to Device** to download it

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ERR_CONNECTION_REFUSED` on analyze | Make sure proxy.py is running in Terminal 1 |
| `401 Unauthorized` error | Your API key is wrong or not set |
| Camera not opening | Allow camera permission in your browser |
| Old version still showing | Press Ctrl + Shift + R to hard refresh |
| Voice not playing | Check browser audio permissions and device volume |

---

## Deploy to GitHub Pages (Optional)

After pushing to GitHub, enable GitHub Pages:

1. Go to your repo → **Settings** → **Pages**
2. Set Source to **Deploy from a branch**
3. Choose branch **`main`** and folder **`/ (root)`**
4. Click **Save**

Your app will be live at:
```
https://<your-username>.github.io/<repo-name>
```

> ⚠️ Note: GitHub Pages serves static files only. The AI proxy (`proxy.py`) must still run locally on your machine for Claude analysis to work.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript (PWA) |
| AI | Anthropic Claude (`claude-opus-4-5`) |
| Proxy | Python `http.server` |
| Font | Google Fonts — Nunito |
| Voice | Web Speech API |
| Camera | MediaDevices API |
