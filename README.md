# 📸 Personal Photo Coach
**Developer: Chaw Kay**

An AI-powered PWA that guides you to take better photos with real-time Claude AI analysis and voice instructions.

---

## Requirements
- **Desktop (local):** Python 3  
- **Everyone:** Anthropic API key → [console.anthropic.com](https://console.anthropic.com)  
- **Camera:** Webcam (for **Open Camera**) or use **Choose from gallery** with any image  

---

## Run on desktop (local)

On a **PC or Mac**, you run a small **AI proxy** and a **web server**, then open the app in the browser. The app talks to **`http://localhost:8081`** for analysis (not used on Vercel).

### 1. Open two terminal windows

Keep **both** running while you use the app.

### 2. Window A — AI proxy (port 8081)

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="your-api-key-here"
cd "C:\path\to\photo-coach-main"
python proxy.py
```

**macOS / Linux (Terminal):**
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
cd /path/to/photo-coach-main
python3 proxy.py
```

You should see: `Starting proxy server on http://localhost:8081`

> **Windows:** use `python`, not `python3` (unless you installed the `python3` launcher).  
> **Do not use the app at port 8081.** That URL is only the proxy. If you open `http://localhost:8081` in a browser you will see a short info page — the real UI is **`http://localhost:8080`** (after step 3).

### 3. Window B — website server (port 8080)

**Windows:**
```powershell
cd "C:\path\to\photo-coach-main"
python -m http.server 8080
```

**macOS / Linux:**
```bash
cd /path/to/photo-coach-main
python3 -m http.server 8080
```

### 4. Open the app in your browser

1. Use **Chrome** or **Edge** (best camera support on desktop).  
2. Go to: **http://localhost:8080**  
3. If the browser asks, **allow camera** and **microphone** (optional, for voice).  
4. Use **Open Camera** (webcam) or **Choose from gallery** to test without a webcam.

> **Stuck on an old version?** Press **Ctrl + Shift + R** (hard refresh).  
> Replace `C:\path\to\photo-coach-main` with your real project folder path.

### Run on desktop without installing Python (optional)

Open your **Vercel** link in Chrome or Edge on the computer — same as phone; no `proxy.py` needed:

**https://sc4052-personal-photo-coach-felp640l5-kaykhine004s-projects.vercel.app**

---

## Deploy on Vercel (phone / production)

The app **cannot** use `localhost:8081` on your phone. Vercel runs **`api/analyze.js`**, which reads your key from the dashboard.

1. Push this repo to GitHub and import it in Vercel (or connect the repo you already use).
2. In Vercel → **Project → Settings → Environment Variables**, add **`ANTHROPIC_API_KEY`** (same as local). Scope: **Production** (and Preview if you want).
3. **Redeploy** the project (Deployments → ⋮ → Redeploy). New env vars only apply after a deploy.
4. On your phone, open your **`*.vercel.app`** URL. The app calls **`/api/analyze`** on the same domain (no localhost).

### Phone testing (Vercel)

**https://sc4052-personal-photo-coach-felp640l5-kaykhine004s-projects.vercel.app**

Open this link in **Safari** or **Chrome** on your phone, allow camera when asked, then use the app as usual.

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
| `python3` not recognized (Windows) | Use **`python proxy.py`** instead |
| **501** or “Unsupported method” on `localhost:8081` | Normal if you used an old proxy build for **GET**. Update `proxy.py` or ignore: open **`http://localhost:8080`** for the app; 8081 is API-only |
| `KeyboardInterrupt` in the proxy terminal | You pressed **Ctrl+C** — the server stopped. Run **`python proxy.py`** again |
| AI not working | Both terminals running? Open **`8080`**, not only **`8081`** |
| 401 error | Check your API key is correct |
| Camera blocked | Allow camera permission in browser |
| Old version showing | Press Ctrl + Shift + R |
| Works on PC, not on phone (Vercel) | Deploy latest code with `api/analyze.js`, set env var, **Redeploy** |
