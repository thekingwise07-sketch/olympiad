import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ضع إعدادات مشروعك من Firebase Console > Project settings > Your apps
export const firebaseConfig = {
  apiKey: "AIzaSyAAV1bf25N-1LfzbXa36XyYB3uyTYSdPqk",
  authDomain: "olympiad-mosques.firebaseapp.com",
  projectId: "olympiad-mosques",
  storageBucket: "olympiad-mosques.firebasestorage.app",
  messagingSenderId: "270226635551",
  appId: "1:270226635551:web:884b018c5f41dead6fce2a",
};

export const DOMAIN = "olympiad.app";
export const ROLES = ["admin", "supervisor", "organizer", "mosque_supervisor"];

export const ROLE_LABELS = {
  admin: "آدمن",
  supervisor: "مسؤول",
  organizer: "منظم",
  mosque_supervisor: "مشرف مسجد",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// long polling: يحل مشكلة unavailable على الشبكات والمتصفحات اللي تحجب WebChannel
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// الجلسة تفضل محفوظة: الآدمن يسجّل مرة وحدة
await setPersistence(auth, browserLocalPersistence);

export function usernameToEmail(username) {
  const v = String(username || "").trim().toLowerCase();
  // إذا المستخدم كتب إيميل كامل، نستخدمه كما هو
  if (v.includes("@")) return v;
  return `${v}@${DOMAIN}`;
}

// كلمة سر عشوائية (تُعرض مرة وحدة للآدمن ولا تنحفظ)
export function genPassword(len = 10) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// ---------- إنشاء حساب Auth بدون ما يطلع الآدمن ----------
// نسخة Firebase ثانية بذاكرة مؤقتة، تنشئ الحساب وتسجّل خروج فوراً
let secondaryAuth = null;
async function getSecondaryAuth() {
  if (!secondaryAuth) {
    const { initializeApp: init2 } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const app2 = init2(firebaseConfig, "secondary");
    secondaryAuth = getAuth(app2);
    await setPersistence(secondaryAuth, inMemoryPersistence);
  }
  return secondaryAuth;
}

export async function createAuthAccount(username, password) {
  const sec = await getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(sec, usernameToEmail(username), password);
  const uid = cred.user.uid;
  await fbSignOut(sec);
  return uid;
}
