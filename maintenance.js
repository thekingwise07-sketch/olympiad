// شاشة الصيانة: الزوار والمستخدمون (غير الآدمن) يشوفون شاشة الانتظار لو الصيانة مفعّلة
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function checkMaintenance() {
  // صفحة الدخول تبقى مفتوحة عشان الآدمن يقدر يدخل ويطفي الصيانة
  const path = location.pathname;
  if (path.endsWith("/") || path.endsWith("index.html")) return;

  const siteSnap = await getDoc(doc(db, "settings", "site"));
  const site = siteSnap.exists() ? siteSnap.data() : {};
  if (!site.maintenance) return;

  const user = await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { unsub(); resolve(u); });
  });
  if (user) {
    const uSnap = await getDoc(doc(db, "users", user.uid));
    if (uSnap.exists() && uSnap.data().role === "admin") return;
  }

  document.body.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.setAttribute("style", "min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:#F8FAFC;font-family:Tajawal,system-ui,sans-serif;text-align:center;direction:rtl");
  const h = document.createElement("h1");
  h.setAttribute("style", "color:#1E3A8A;font-size:24px;font-weight:900;margin:0 0 12px");
  h.textContent = "أولمبياد المساجد";
  const p = document.createElement("p");
  p.setAttribute("style", "color:#475569;font-size:17px;line-height:1.8;margin:0");
  p.textContent = site.message || "الموقع تحت الصيانة حالياً، ارجع بعد شوي.";
  wrap.appendChild(h);
  wrap.appendChild(p);
  document.body.appendChild(wrap);
}

checkMaintenance().catch(() => { /* إذا فشل الفحص نكمل عادي */ });
