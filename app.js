/* ═══════════════════════════════════════════
   Photo AI Coach — PWA App
   ═══════════════════════════════════════════ */

const SYS_PROMPT = `You are a photo coaching assistant. The user gives you a scouting photo, and you should return concise step-by-step guidance.

Rules:
1. Each command must be short enough for voice and overlay display.
2. Use simple everyday language and avoid photography jargon.
3. Follow the order: subject position → photographer position → phone handling → final check.
4. Provide 5-6 steps.

Return strictly valid JSON only (no markdown, no code fences):
{
  "steps": [
    {
      "id": 1,
      "icon": "emoji",
      "command": "short command",
      "who": "person/photographer",
      "arrow": "left/right/up/down/closer/further/none",
      "overlay_position": "top/center/bottom"
    }
  ],
  "ready_message": "a ready message",
  "score_before": 5,
  "score_after": 8
}`;

const DEMO_RESULT = {
  steps: [
    { id: 1, icon: "🧍", command: "Ask them to move two steps to the left", who: "person", arrow: "left", overlay_position: "center" },
    { id: 2, icon: "🧍", command: "Turn their body slightly to the left", who: "person", arrow: "left", overlay_position: "center" },
    { id: 3, icon: "👣", command: "Take three steps back", who: "photographer", arrow: "further", overlay_position: "bottom" },
    { id: 4, icon: "📱", command: "Hold the phone at chest height", who: "photographer", arrow: "down", overlay_position: "bottom" },
    { id: 5, icon: "⚙️", command: "Switch to portrait mode", who: "photographer", arrow: "none", overlay_position: "top" },
    { id: 6, icon: "👀", command: "Ask them to look to the left", who: "person", arrow: "left", overlay_position: "center" },
  ],
  ready_message: "Perfect! Press the shutter with confidence 📸",
  score_before: 5,
  score_after: 9,
};

/* ─── State ─── */
let state = {
  phase: "home",        // home | camera_scout | analyzing | shooting | captured
  result: null,
  scoutImg: null,
  finalImg: null,
  stepIdx: 0,
  voiceOn: true,
  isSpeaking: false,
  facingMode: "environment",
  showDrawer: false,
};
let stream = null;
let videoEl = null;
let canvasEl = null;

/* ─── Helpers ─── */
function $(sel) { return document.querySelector(sel); }
function vibrate(pattern) { try { navigator?.vibrate?.(pattern); } catch {} }

function speak(text, onEnd) {
  if (!state.voiceOn || !("speechSynthesis" in window)) { onEnd?.(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.92;
  u.onstart = () => { state.isSpeaking = true; };
  u.onend = () => { state.isSpeaking = false; onEnd?.(); };
  u.onerror = () => { state.isSpeaking = false; onEnd?.(); };
  speechSynthesis.speak(u);
}
function stopSpeak() { speechSynthesis?.cancel(); state.isSpeaking = false; }

/* ─── Camera ─── */
async function startCamera() {
  try {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: state.facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    });
    videoEl = $("#camera-video");
    if (videoEl) { videoEl.srcObject = stream; videoEl.play(); }
  } catch (e) {
    console.error("Camera error:", e);
    alert("Unable to access the camera. Please allow camera permission in your browser.");
  }
}
function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}
function capturePhoto() {
  if (!videoEl || !canvasEl) return null;
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  canvasEl.getContext("2d").drawImage(videoEl, 0, 0);
  return canvasEl.toDataURL("image/jpeg", 0.85);
}

/* ─── Arrow SVG ─── */
function arrowSVG(dir, color = "#fff", size = 52) {
  const paths = {
    left: "M30 24H14M20 16L12 24L20 32",
    right: "M18 24H34M28 16L36 24L28 32",
    up: "M24 32V16M16 22L24 14L32 22",
    down: "M24 16V32M16 26L24 34L32 26",
    closer: "M16 16L24 24L32 16M16 24L24 32L32 24",
    further: "M16 24L24 16L32 24M16 32L24 24L32 32",
  };
  if (!paths[dir]) return "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none">
    <path d="${paths[dir]}" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
      style="filter:drop-shadow(0 0 8px ${color}88)"/>
  </svg>`;
}

/* ─── Grid SVG ─── */
const GRID_SVG = `<svg class="grid-svg" viewBox="0 0 300 300" preserveAspectRatio="none">
  <line x1="100" y1="0" x2="100" y2="300" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
  <line x1="200" y1="0" x2="200" y2="300" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
  <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
  <line x1="0" y1="200" x2="300" y2="200" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
</svg>`;

/* ─── API ─── */
async function analyzePhoto(imgData) {
  state.phase = "analyzing";
  render();

  try {
    const b64 = imgData.split(",")[1];
    const mt = imgData.split(";")[0].split(":")[1];
    console.log("Sending Anthropic request", { model: "claude-sonnet-4-20250514", media_type: mt });
    const resp = await fetch("http://localhost:8081/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 1024,
        system: SYS_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mt, data: b64 } },
              { type: "text", text: "Analyze the photo and return step-by-step advice in JSON format." }
            ]
          }
        ]
      })
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API Error ${resp.status}: ${text}`);
    }
    const data = await resp.json();
    console.log("Anthropic response", data);
    const contentText = data.content?.find(c => c.text)?.text ||
      (Array.isArray(data.content)
        ? data.content.map(c => c.text || c?.data?.text || "").join("\n")
        : "");
    if (!contentText) throw new Error("No text content returned from Anthropic");
    state.result = JSON.parse(contentText.replace(/```json|```/g, "").trim());
  } catch (e) {
    console.warn("Anthropic failed, using demo data:", e);
    state.result = DEMO_RESULT;
  }

  state.stepIdx = 0;
  state.phase = "shooting";
  render();
  setTimeout(() => startCamera(), 300);
  setTimeout(() => speakCurrentStep(), 600);
}

function speakCurrentStep() {
  const cur = state.result?.steps?.[state.stepIdx];
  if (!cur) return;
  const who = cur.who === "person" ? "Tell them: " : "";
  speak(who + cur.command);
  vibrate(80);
}

/* ─── Navigation ─── */
function nextStep() {
  stopSpeak();
  const total = state.result?.steps?.length || 0;
  if (state.stepIdx < total - 1) {
    state.stepIdx++;
    renderShootingOverlay();
    setTimeout(speakCurrentStep, 200);
  }
}
function prevStep() {
  if (state.stepIdx > 0) {
    stopSpeak();
    state.stepIdx--;
    renderShootingOverlay();
    setTimeout(speakCurrentStep, 200);
  }
}

function goHome() {
  stopCamera(); stopSpeak();
  state = { ...state, phase: "home", result: null, scoutImg: null, finalImg: null, stepIdx: 0, showDrawer: false };
  render();
}

/* ═══════════════════════════════════════════
   RENDER
   ═══════════════════════════════════════════ */
function render() {
  const app = $("#app");

  switch (state.phase) {
    case "home": renderHome(app); break;
    case "camera_scout": renderCameraScout(app); break;
    case "analyzing": renderAnalyzing(app); break;
    case "shooting": renderShooting(app); break;
    case "captured": renderCaptured(app); break;
  }
}

/* ─── Home ─── */
function renderHome(app) {
  app.innerHTML = `
    <div class="page home-page">
      <div class="blob-wrap">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="blob blob-4"></div>
      </div>
      <div class="home-content fade-in">
        <div class="emoji-wrap bounce-anim">
          <span class="home-emoji">📸</span>
          <span class="star star-1">✨</span>
          <span class="star star-2">💖</span>
          <span class="star star-3">✦</span>
          <span class="star star-4">🌸</span>
        </div>
        <h1 class="home-title">Personal Photo Coach</h1>
        <p class="home-subtitle">Powered by Claude AI 💜</p>
        <p class="home-desc">
          Snap a scouting photo and get real-time<br>AI guidance to perfect your shot.
        </p>
        <div class="flow-cards">
          <div class="flow-card">
            <span class="flow-card-emoji">📸</span>
            <span class="flow-card-label">Scout</span>
          </div>
          <div class="flow-card">
            <span class="flow-card-emoji">🤖</span>
            <span class="flow-card-label">Analyze</span>
          </div>
          <div class="flow-card">
            <span class="flow-card-emoji">🎯</span>
            <span class="flow-card-label">Shoot</span>
          </div>
        </div>
        <button class="main-btn" id="btn-start-camera">📷 Open Camera</button>
        <button class="sub-btn" id="btn-upload">🖼️ Choose from gallery</button>
        <input type="file" accept="image/*" id="file-input" style="display:none">
      </div>
    </div>`;

  $("#btn-start-camera").onclick = () => {
    state.phase = "camera_scout";
    render();
    setTimeout(startCamera, 200);
  };
  $("#btn-upload").onclick = () => $("#file-input").click();
  $("#file-input").onchange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { state.scoutImg = ev.target.result; analyzePhoto(ev.target.result); };
    r.readAsDataURL(f);
  };
}

/* ─── Camera Scout ─── */
function renderCameraScout(app) {
  app.innerHTML = `
    <div class="page camera-page">
      <video id="camera-video" autoplay playsinline muted class="video-full"></video>
      ${GRID_SVG}
      <div class="cam-top">
        <button class="icon-btn" id="btn-close">✕</button>
        <span class="cam-title">Take a scouting photo</span>
        <button class="icon-btn" id="btn-flip">🔄</button>
      </div>
      <div class="scout-hint pop-in">
        <p>📸 Include the person and surroundings in the frame</p>
        <p>Don’t worry about composition, just capture the scene.</p>
      </div>
      <div class="shutter-area">
        <button class="shutter-btn" id="btn-shutter"><div class="shutter-inner"></div></button>
      </div>
    </div>`;

  videoEl = $("#camera-video");
  canvasEl = document.createElement("canvas");

  $("#btn-close").onclick = goHome;
  $("#btn-flip").onclick = () => {
    state.facingMode = state.facingMode === "environment" ? "user" : "environment";
    startCamera();
  };
  $("#btn-shutter").onclick = () => {
    const img = capturePhoto();
    if (img) { state.scoutImg = img; stopCamera(); analyzePhoto(img); }
  };
}

/* ─── Analyzing ─── */
function renderAnalyzing(app) {
  app.innerHTML = `
    <div class="page">
      ${state.scoutImg ? `<img src="${state.scoutImg}" class="analyze-img" alt="">` : ""}
      <div class="analyze-overlay">
        <div class="analyze-icon">🤖</div>
        <p class="analyze-label"><span>AI is working its magic… ✨</span></p>
        <p class="analyze-sub">Checking composition, lighting,<br>background &amp; subject position</p>
        <div class="analyze-dots">
          <div class="analyze-dot"></div>
          <div class="analyze-dot"></div>
          <div class="analyze-dot"></div>
        </div>
      </div>
    </div>`;
}

/* ─── Shooting ─── */
function renderShooting(app) {
  const steps = state.result?.steps || [];
  const total = steps.length;

  app.innerHTML = `
    <div class="page camera-page">
      <video id="camera-video" autoplay playsinline muted class="video-full"></video>
      ${GRID_SVG}

      <!-- Top bar -->
      <div class="shoot-top">
        <button class="icon-btn" id="btn-close2">✕</button>
        <div class="step-progress">
          ${steps.map((_, i) => `<div class="step-bar ${i < state.stepIdx ? 'done' : i === state.stepIdx ? 'current' : ''}"></div>`).join("")}
        </div>
        <button class="icon-btn" id="btn-voice" style="background:${state.voiceOn ? 'rgba(255,94,91,0.2)' : 'rgba(0,0,0,0.4)'}">
          ${state.voiceOn ? "🔊" : "🔇"}
        </button>
      </div>

      <!-- Tip overlay container -->
      <div id="tip-overlay-container"></div>

      <!-- Side touch zones -->
      <div class="side-touch" style="left:0;opacity:${state.stepIdx > 0 ? 1 : 0}" id="touch-prev"></div>
      <div class="side-touch" style="right:0;opacity:${state.stepIdx < total - 1 ? 1 : 0}" id="touch-next"></div>

      <!-- Bottom -->
      <div class="shoot-bottom">
        <button class="shoot-side-btn" id="btn-replay">🔈</button>
        ${state.stepIdx >= total - 1
          ? `<button class="big-shutter breathe-ring" id="btn-final-shutter"><div class="big-shutter-inner"></div></button>`
          : `<button class="next-step-btn" id="btn-next-step"><span>Next</span><span style="font-size:18px">›</span></button>`
        }
        <button class="shoot-side-btn" id="btn-drawer">📋</button>
      </div>

      <!-- Drawer -->
      <div id="drawer-container"></div>
    </div>`;

  videoEl = $("#camera-video");
  if (!canvasEl) canvasEl = document.createElement("canvas");

  // Render tip overlay
  renderShootingOverlay();

  // Events
  $("#btn-close2").onclick = goHome;
  $("#btn-voice").onclick = () => {
    state.voiceOn = !state.voiceOn;
    $("#btn-voice").style.background = state.voiceOn ? "rgba(255,94,91,0.2)" : "rgba(0,0,0,0.4)";
    $("#btn-voice").textContent = state.voiceOn ? "🔊" : "🔇";
  };
  $("#touch-prev").onclick = prevStep;
  $("#touch-next").onclick = nextStep;
  $("#btn-replay").onclick = speakCurrentStep;
  $("#btn-drawer").onclick = () => { state.showDrawer = !state.showDrawer; renderDrawer(); };

  if ($("#btn-next-step")) $("#btn-next-step").onclick = nextStep;
  if ($("#btn-final-shutter")) {
    $("#btn-final-shutter").onclick = () => {
      const img = capturePhoto();
      if (img) { state.finalImg = img; stopCamera(); stopSpeak(); vibrate([100, 80, 100]); state.phase = "captured"; render(); }
    };
  }
}

function renderShootingOverlay() {
  const container = $("#tip-overlay-container");
  if (!container) return;

  const cur = state.result?.steps?.[state.stepIdx];
  if (!cur) return;

  const total = state.result.steps.length;
  const color = cur.who === "person" ? "var(--person)" : "var(--photographer)";
  const topPos = cur.overlay_position === "top" ? "12%" : cur.overlay_position === "center" ? "35%" : "55%";

  container.innerHTML = `
    <div class="tip-overlay pop-in" style="top:${topPos}" key="${state.stepIdx}">
      ${cur.arrow !== "none" ? `<div class="float-anim" style="margin-bottom:4px">${arrowSVG(cur.arrow, cur.who === "person" ? "#4ECDC4" : "#FFD166")}</div>` : ""}
      <div class="who-badge ${cur.who}">
        ${cur.who === "person" ? "🧍 Subject" : "📱 Photographer"}
      </div>
      <div class="tip-bubble">
        <span class="icon">${cur.icon}</span>
        <span class="cmd">${cur.command}</span>
      </div>
      <p class="step-counter">Step ${state.stepIdx + 1} / ${total}</p>
    </div>`;

  // Update progress bars
  document.querySelectorAll(".step-bar").forEach((bar, i) => {
    bar.className = `step-bar ${i < state.stepIdx ? "done" : i === state.stepIdx ? "current" : ""}`;
  });

  // Update bottom button
  const bottomEl = $(".shoot-bottom");
  if (bottomEl) {
    const isLast = state.stepIdx >= total - 1;
    const centerBtn = bottomEl.querySelector("#btn-next-step, #btn-final-shutter");
    if (centerBtn) {
      if (isLast && centerBtn.id === "btn-next-step") {
        centerBtn.outerHTML = `<button class="big-shutter breathe-ring" id="btn-final-shutter"><div class="big-shutter-inner"></div></button>`;
        $("#btn-final-shutter").onclick = () => {
          const img = capturePhoto();
          if (img) { state.finalImg = img; stopCamera(); stopSpeak(); vibrate([100, 80, 100]); state.phase = "captured"; render(); }
        };
      } else if (!isLast && centerBtn.id === "btn-final-shutter") {
        centerBtn.outerHTML = `<button class="next-step-btn" id="btn-next-step"><span>Next</span><span style="font-size:18px">›</span></button>`;
        $("#btn-next-step").onclick = nextStep;
      }
    }
  }
}

function renderDrawer() {
  const container = $("#drawer-container");
  if (!container) return;

  if (!state.showDrawer) { container.innerHTML = ""; return; }

  const steps = state.result?.steps || [];
  container.innerHTML = `
    <div class="drawer-bg" id="drawer-bg">
      <div class="drawer" onclick="event.stopPropagation()">
        <div class="drawer-handle"></div>
        <p class="drawer-title">📋 All steps</p>
        ${steps.map((s, i) => `
          <div class="drawer-item ${i === state.stepIdx ? 'active' : ''}" data-idx="${i}"
            style="border-color:${i === state.stepIdx ? (s.who === 'person' ? 'rgba(78,205,196,0.33)' : 'rgba(255,209,102,0.33)') : 'rgba(255,255,255,0.06)'}">
            <span style="font-size:11px;font-weight:700;color:${i <= state.stepIdx ? (s.who === 'person' ? 'var(--person)' : 'var(--photographer)') : 'rgba(255,255,255,0.3)'};min-width:20px">
              ${i < state.stepIdx ? "✓" : i + 1}
            </span>
            <span style="font-size:16px">${s.icon}</span>
            <span style="font-size:14px;font-weight:${i === state.stepIdx ? 700 : 400};color:${i <= state.stepIdx ? '#fff' : 'rgba(255,255,255,0.45)'}">${s.command}</span>
          </div>
        `).join("")}
        <button class="drawer-close" id="btn-drawer-close">Close</button>
      </div>
    </div>`;

  $("#drawer-bg").onclick = () => { state.showDrawer = false; renderDrawer(); };
  $("#btn-drawer-close").onclick = () => { state.showDrawer = false; renderDrawer(); };
  document.querySelectorAll(".drawer-item").forEach(el => {
    el.onclick = () => {
      state.stepIdx = parseInt(el.dataset.idx);
      state.showDrawer = false;
      renderDrawer();
      renderShootingOverlay();
      speakCurrentStep();
    };
  });
}

/* ─── Helpers: star rating ─── */
function starsFor(score) {
  const filled = Math.round((score / 10) * 5);
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

/* ─── Captured ─── */
function renderCaptured(app) {
  const r = state.result;
  app.innerHTML = `
    <div class="page captured-page fade-in" id="captured-page">
      <div class="compare-wrap">
        <div class="compare-item">
          <img src="${state.scoutImg}" class="compare-img" alt="">
          <div class="compare-badge">
            <div>
              <div>Before</div>
              <span class="star-rating" style="color:rgba(255,255,255,0.4)">${starsFor(r?.score_before || 5)}</span>
            </div>
            <span class="score">${r?.score_before || "?"}</span>
          </div>
        </div>
        <div class="compare-arrow">→</div>
        <div class="compare-item">
          <img src="${state.finalImg}" class="compare-img" alt="">
          <div class="compare-badge after">
            <div>
              <div style="color:var(--accent)">After ✨</div>
              <span class="star-rating" style="color:var(--accent)">${starsFor(r?.score_after || 8)}</span>
            </div>
            <span class="score">${r?.score_after || "?"}</span>
          </div>
        </div>
      </div>

      <div class="done-card pop-in">
        <div class="emoji">🎉</div>
        <h3>Photo complete!</h3>
        <p>${r?.ready_message || "Your photo is ready."}</p>
      </div>

      <button class="main-btn" id="btn-save" style="width:calc(100% - 40px);margin:0 auto 10px;display:block">💾 Save Photo to Device</button>
      <button class="outline-btn" id="btn-reshoot">📷 Not satisfied, retake</button>
      <button class="outline-btn" id="btn-rescout">🔄 Reanalyze scout photo</button>
      <button class="link-btn" id="btn-home">← Back to home</button>
    </div>`;

  // Confetti burst
  const page = document.getElementById("captured-page");
  const pieces = ["💖","🌸","✨","💜","🌷","💗","🦋","⭐","💕","🎀"];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    el.textContent = pieces[i % pieces.length];
    el.style.left = Math.random() * 100 + "%";
    el.style.top  = (40 + Math.random() * 40) + "%";
    el.style.animationDelay = (Math.random() * 0.5) + "s";
    el.style.fontSize = (14 + Math.random() * 16) + "px";
    page.appendChild(el);
  }

  // Speak done message
  if (r?.ready_message) speak(r.ready_message);

  $("#btn-save").onclick = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `photo-coach-${timestamp}.jpg`;
    const a = document.createElement("a");
    a.href = state.finalImg;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    vibrate(80);
    const btn = $("#btn-save");
    if (btn) { btn.textContent = "✅ Saved!"; setTimeout(() => { if ($("#btn-save")) $("#btn-save").textContent = "💾 Save Photo to Device"; }, 2000); }
  };

  $("#btn-reshoot").onclick = () => {
    state.finalImg = null; state.stepIdx = 0; state.phase = "shooting";
    render(); setTimeout(startCamera, 300);
  };
  $("#btn-rescout").onclick = () => {
    state.result = null; state.scoutImg = null; state.finalImg = null;
    state.phase = "camera_scout"; render(); setTimeout(startCamera, 300);
  };
  $("#btn-home").onclick = goHome;
}

/* ═══ Init ═══ */
document.addEventListener("DOMContentLoaded", () => {
  canvasEl = document.createElement("canvas");
  render();
});
