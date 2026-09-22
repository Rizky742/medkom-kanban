import { ADMINS, MEMBERS } from "./store.js";

/* ============================================================
 * Kunci internal: tiap anggota pilih nama + masukkan PIN.
 * Admin (Rizky, Vita, Fayola, Lina) pakai ADMIN_PIN,
 * anggota lain pakai MEMBER_PIN.
 *
 * PIN dibaca dari env (VITE_ADMIN_PIN / VITE_MEMBER_PIN) agar
 * tidak wajib hardcoded di repo publik. Fallback ke bawaan
 * hanya untuk dev lokal — GANTI sebelum disebar ke tim
 * (set via Vercel Project Settings > Environment Variables).
 * Catatan jujur: ini kunci sederhana level prototype (cek di
 * browser), bukan login bank. Cukup untuk menahan pengunjung
 * iseng + membedakan hak Admin vs Anggota. Session kedaluwarsa
 * 30 hari. Login Google beneran bisa dipasang nanti (butuh setup
 * OAuth di akun genbiunair26@gmail.com).
 * ============================================================ */
function envPin(key, fallback) {
  try {
    const v =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env[key]
        : null;
    if (v && String(v).trim()) return String(v).trim();
  } catch {
    /* abaikan */
  }
  return fallback;
}

export const ADMIN_PIN = envPin("VITE_ADMIN_PIN", "654321");
export const MEMBER_PIN = envPin("VITE_MEMBER_PIN", "123456");

if (
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.DEV &&
  (ADMIN_PIN === "654321" || MEMBER_PIN === "123456")
) {
  console.warn(
    "[medkom] PIN bawaan dipakai (dev only). Set VITE_ADMIN_PIN/VITE_MEMBER_PIN sebelum production."
  );
}

const SESSION_KEY = "medkom_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function login(name, pin) {
  if (!MEMBERS.includes(name)) return { ok: false, error: "Nama tidak terdaftar di tim." };
  const need = ADMINS.includes(name) ? ADMIN_PIN : MEMBER_PIN;
  if (String(pin || "").trim() !== need)
    return { ok: false, error: "PIN salah. Tanya PIN ke admin Medkom." };
  const session = {
    name,
    role: ADMINS.includes(name) ? "admin" : "anggota",
    ts: Date.now(),
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* mode privat: sesi tidak disimpan */
  }
  return { ok: true, session };
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !MEMBERS.includes(s.name)) return null;
    if (s.ts && Date.now() - Number(s.ts) > SESSION_TTL_MS) {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        /* abaikan */
      }
      return null;
    }
    return { name: s.name, role: ADMINS.includes(s.name) ? "admin" : "anggota", ts: s.ts };
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
}
