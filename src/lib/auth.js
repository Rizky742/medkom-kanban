import { getPin, memberRole, teamMembers } from "./team.js";

export { DEFAULT_ADMIN_PIN as ADMIN_PIN, DEFAULT_MEMBER_PIN as MEMBER_PIN } from "./team.js";

/* ============================================================
 * Login PIN per anggota. Daftar anggota + PIN dikelola di
 * Team (localStorage medkom_team_v1, default dari env
 * VITE_ADMIN_PIN / VITE_MEMBER_PIN).
 *
 * Catatan jujur: ini kunci sederhana level prototype (cek di
 * browser), bukan login bank. Session kedaluwarsa 30 hari.
 * ============================================================ */

const SESSION_KEY = "medkom_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function login(name, pin) {
  const members = teamMembers();
  const found = members.find(
    (m) => m.toLowerCase() === String(name || "").toLowerCase()
  );
  if (!found) return { ok: false, error: "Nama tidak terdaftar di tim." };
  const need = getPin(found);
  if (String(pin || "").trim() !== need)
    return { ok: false, error: "PIN salah. Tanya PIN ke admin Medkom." };
  const session = {
    name: found,
    role: memberRole(found) === "admin" ? "admin" : "anggota",
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
    if (!s || !s.name) return null;
    // nama harus masih terdaftar (bisa dihapus admin)
    const members = teamMembers();
    const found = members.find(
      (m) => m.toLowerCase() === String(s.name).toLowerCase()
    );
    if (!found) return null;
    if (s.ts && Date.now() - Number(s.ts) > SESSION_TTL_MS) {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        /* abaikan */
      }
      return null;
    }
    // role selalu ikut data tim terbaru (bisa diubah admin)
    return {
      name: found,
      role: memberRole(found) === "admin" ? "admin" : "anggota",
      ts: s.ts,
    };
  } catch {
    return null;
  }
}

export function refreshSession() {
  const s = getSession();
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* abaikan */
  }
  return s;
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* abaikan */
  }
}
