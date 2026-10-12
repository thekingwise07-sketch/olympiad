// شجّع فريقك: كل جهاز يقدر يشجع كل مسجد مرة واحدة باليوم
import { db } from "./firebase.js";
import { doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const today = () => new Date().toISOString().slice(0, 10);
const keyFor = (id) => "cheer:" + id + ":" + today();

export function alreadyCheered(id) {
  try { return localStorage.getItem(keyFor(id)) === "1"; } catch (e) { return false; }
}

export async function cheer(id) {
  if (alreadyCheered(id)) return "already";
  await updateDoc(doc(db, "mosques", id), { cheers: increment(1) });
  try { localStorage.setItem(keyFor(id), "1"); } catch (e) { /* بدون تخزين */ }
  return "ok";
}

// زر جاهز يُضاف لأي مكان
export function cheerButton(id, count, onDone) {
  const b = document.createElement("button");
  b.type = "button";
  const done = alreadyCheered(id);
  b.setAttribute("style", "min-height:38px;margin:0;padding:0 12px;border-radius:12px;font-size:13px;font-weight:800;border:1px solid var(--gold);background:" + (done ? "var(--gold)" : "transparent") + ";color:" + (done ? "#0b1715" : "var(--gold)") + ";cursor:pointer;white-space:nowrap");
  b.textContent = "🔥 " + (done ? "شجّعت" : "شجّع فريقك") + " · " + (count || 0);
  b.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (alreadyCheered(id)) return;
    b.disabled = true;
    try {
      await cheer(id);
      onDone && onDone();
      b.textContent = "🔥 شجّعت · " + ((count || 0) + 1);
      b.style.background = "var(--gold)";
      b.style.color = "#0b1715";
    } catch (err) {
      b.disabled = false;
    }
  };
  return b;
}
