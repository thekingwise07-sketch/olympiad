// المباشر: صافرة قصيرة + إشعار يختفي + مراقبة المباريات لحظياً
import { db, tf } from "./firebase.js";
import { collection, query, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let audioCtx = null;
let unlocked = false;

// المتصفح يمنع الصوت قبل أي تفاعل، فنفتحه أول ضغطة
function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { /* بدون صوت */ }
}
["pointerdown", "keydown", "touchstart"].forEach((ev) => document.addEventListener(ev, unlockAudio, { once: true, passive: true }));

export function whistle() {
  if (localStorage.getItem("sound") === "off" || !audioCtx) return;
  const t = audioCtx.currentTime;
  [0, 0.18].forEach((offset, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(i === 0 ? 2900 : 3300, t + offset);
    gain.gain.setValueAtTime(0.0001, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, t + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.18);
  });
}

// إشعار داخل الصفحة يختفي بعد ثواني
export function toast(text) {
  let box = document.getElementById("live-toast");
  if (!box) {
    box = document.createElement("div");
    box.id = "live-toast";
    box.setAttribute("style", "position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:95;max-width:calc(100% - 32px);padding:12px 16px;border-radius:14px;background:var(--surface);border:1px solid var(--gold);box-shadow:0 12px 30px rgba(0,0,0,.25);font-weight:800;font-size:14px;text-align:center;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;font-family:Tajawal,sans-serif;color:var(--text)");
    document.body.appendChild(box);
  }
  box.textContent = text;
  requestAnimationFrame(() => { box.style.opacity = "1"; box.style.transform = "translateX(-50%) translateY(0)"; });
  clearTimeout(box._t);
  box._t = setTimeout(() => { box.style.opacity = "0"; box.style.transform = "translateX(-50%) translateY(-8px)"; }, 3200);
}

export const EVENT_LABELS = { goal: "هدف", yellow: "بطاقة صفراء", red: "بطاقة حمراء", foul: "فاول" };
export const EVENT_ICONS = { goal: "⚽", yellow: "🟨", red: "🟥", foul: "⚠️" };

// مراقبة كل المباريات لحظياً (للزوار والمنظم)
export function watchMatches(onChange) {
  const q = query(collection(db, "matches"), ...tf());
  let initialized = false;
  const seenEvents = {};
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.forEach((m) => {
      const count = (m.details?.events || []).length;
      if (initialized && count > (seenEvents[m.id] || 0)) {
        const last = m.details.events[m.details.events.length - 1];
        whistle();
        toast((EVENT_ICONS[last.type] || "🔔") + " " + (EVENT_LABELS[last.type] || "حدث") + ": " + (last.playerName || "") + " · " + (last.teamName || ""));
      }
      seenEvents[m.id] = count;
    });
    initialized = true;
    onChange(list);
  });
}
