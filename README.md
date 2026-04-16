# 📸 Photo AI Coach — Deployment Guide

## Project files

```
photo-coach-pwa/
├── index.html        ← Entry page
├── app.js            ← Main application logic
├── style.css         ← Styles
├── manifest.json     ← PWA configuration (app name, icons, etc.)
├── sw.js             ← Service Worker (offline caching)
└── icons/
    ├── icon-192.png  ← App icon
    └── icon-512.png  ← App icon (high resolution)
```

---

## 🚀 Three deployment options (choose one)

### Option 1: GitHub Pages (recommended, free)

This is the easiest way to publish the app.

**Steps:**

1. Sign in to [GitHub](https://github.com)
2. Create a new repository
   - Name it anything, for example `photo-coach`
   - Set the repo to Public
3. Upload files
   - Click "uploading an existing file"
   - Drag all files and the `icons` folder from this project
   - Commit the changes
4. Enable GitHub Pages
   - Go to Settings → Pages
   - Set Source to "Deploy from a branch"
   - Choose branch `main` and folder `/ (root)`
   - Click Save
5. Wait 1-2 minutes, then visit:
   - `https://<your-username>.github.io/photo-coach/`

---

### Option 2: Vercel (also easy, free)

1. Sign up at [Vercel](https://vercel.com)
2. Click "New Project" → Import Git Repository
3. Select your repo
4. Click Deploy
5. You will get a `*.vercel.app` URL when deployment finishes

---

### Option 3: Local testing

If you have Python installed:

```bash
cd photo-coach-pwa
python -m http.server 8080
```

Then open in your browser:
```
http://localhost:8080
```

> ⚠️ Note: Local HTTP mode may limit camera support. For full PWA behavior, use HTTPS.

---

## 📱 Install on Android

After deployment, open the app URL in Chrome on your phone:

1. Open the URL
2. Chrome may prompt "Add to Home screen"
3. If not, open the menu and choose "Install app" or "Add to Home screen"
4. Confirm the install
5. Return to your home screen and launch the app

The app runs full screen like a native app.

---

## ⚙️ AI setup

This demo sends requests to Anthropic Claude through a local proxy server to avoid browser CORS restrictions.

1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Set your Anthropic API key in your environment:

PowerShell:
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-api03-W_p-..."
python proxy.py
```

3. Open another terminal and run the local frontend server if not already running:
```bash
cd photo-coach-main
py -m http.server 8080
```

4. Open `http://localhost:8080` in your browser.

The app now sends its request to `http://localhost:8081/analyze`, and the proxy forwards it to Anthropic using your API key.

> 💡 Tip: The API key stays on your local machine and is not exposed in browser code.

---

## 🔮 Next improvements

- [ ] Add a backend API proxy to protect the API key
- [ ] Improve voice guidance quality
- [ ] Add photo history and save support
- [ ] Support saving the final photo to the gallery

---

## ❓ FAQ

**Q: The camera does not open?**
A: Make sure your browser has camera permission enabled.

**Q: Voice feedback does not play?**
A: Check browser audio permissions and that the device is not muted.

**Q: API error appears?**
A: The app will use demo data automatically if the API call fails. Add a valid API key for real AI analysis.

**Q: Can it work offline?**
A: The interface can load offline, but AI analysis requires a network connection.
