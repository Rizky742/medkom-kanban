// Tim + PIN per anggota. Disimpan di localStorage per browser.
// Default awal = daftar di store.js + PIN env (fallback bawaan dev).
// Catatan: ini kunci level prototype (cek di browser), bukan auth server.

import { ADMINS as DEFAULT_ADMINS, MEMBERS as DEFAULT_MEMBERS } from "./store.js";

const TEAM_KEY = "medkom_team_v2";

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

export const DEFAULT_ADMIN_PIN = envPin("VITE_ADMIN_PIN", "654321");
export const DEFAULT_MEMBER_PIN = envPin("VITE_MEMBER_PIN", "123456");

function defaultTeam() {
  return {
    members: DEFAULT_MEMBERS.map((name) => ({
      name,
      role: DEFAULT_ADMINS.includes(name) ? "admin" : "anggota",
    })),
    pins: Object.fromEntries(
      DEFAULT_MEMBERS.map((name) => [
        name,
        DEFAULT_ADMINS.includes(name) ? DEFAULT_ADMIN_PIN : DEFAULT_MEMBER_PIN,
      ])
    ),
  };
}

function normalize(team) {
  const members = (team?.members || [])
    .filter((m) => m && String(m.name || "").trim())
    .map((m) => ({
      name: String(m.name).trim(),
      role: m.role === "admin" ? "admin" : "anggota",
    }));
  // buang duplikat (case-insensitive), pertahankan pertama
  const seen = new Set();
  const uniq = members.filter((m) => {
    const k = m.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const pins = { ...(team?.pins || {}) };
  // pastikan tiap anggota punya PIN
  uniq.forEach((m) => {
    if (!pins[m.name]) {
      pins[m.name] =
        m.role === "admin" ? DEFAULT_ADMIN_PIN : DEFAULT_MEMBER_PIN;
    }
  });
  return { members: uniq, pins };
}

export function loadTeam() {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (raw) {
      const t = normalize(JSON.parse(raw));
      if (t.members.length > 0) return t;
    }
  } catch {
    /* abaikan, pakai default */
  }
  const t = defaultTeam();
  saveTeam(t);
  return t;
}

export function saveTeam(team) {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(normalize(team)));
  } catch {
    /* mode privat: abaikan */
  }
}

export function teamMembers() {
  return loadTeam().members.map((m) => m.name);
}

export function teamAdmins() {
  return loadTeam().members.filter((m) => m.role === "admin").map((m) => m.name);
}

export function memberRole(name) {
  const m = loadTeam().members.find(
    (x) => x.name.toLowerCase() === String(name || "").toLowerCase()
  );
  return m ? m.role : null;
}

export function getPin(name) {
  const t = loadTeam();
  const key = t.members.find(
    (x) => x.name.toLowerCase() === String(name || "").toLowerCase()
  )?.name;
  return key ? t.pins[key] : null;
}

export function validPin(pin) {
  const s = String(pin || "").trim();
  return s.length >= 4 && s.length <= 32;
}

export function setPin(name, pin) {
  if (!validPin(pin)) return { ok: false, error: "PIN minimal 4 karakter." };
  const t = loadTeam();
  const key = t.members.find(
    (x) => x.name.toLowerCase() === String(name || "").toLowerCase()
  )?.name;
  if (!key) return { ok: false, error: "Nama tidak terdaftar di tim." };
  t.pins[key] = String(pin).trim();
  saveTeam(t);
  return { ok: true };
}

export function changePin(name, oldPin, newPin) {
  const need = getPin(name);
  if (need === null) return { ok: false, error: "Nama tidak terdaftar di tim." };
  if (String(oldPin || "").trim() !== need)
    return { ok: false, error: "PIN lama salah." };
  return setPin(name, newPin);
}

export function addMember(name, role, pin) {
  const clean = String(name || "").trim();
  if (!clean) return { ok: false, error: "Nama tidak boleh kosong." };
  if (clean.length > 40) return { ok: false, error: "Nama maksimal 40 karakter." };
  if (!validPin(pin)) return { ok: false, error: "PIN minimal 4 karakter." };
  const t = loadTeam();
  if (t.members.some((m) => m.name.toLowerCase() === clean.toLowerCase()))
    return { ok: false, error: "Nama sudah ada di tim." };
  t.members.push({ name: clean, role: role === "admin" ? "admin" : "anggota" });
  t.pins[clean] = String(pin).trim();
  saveTeam(t);
  return { ok: true };
}

export function removeMember(name) {
  const t = loadTeam();
  const idx = t.members.findIndex(
    (m) => m.name.toLowerCase() === String(name || "").toLowerCase()
  );
  if (idx < 0) return { ok: false, error: "Nama tidak terdaftar di tim." };
  const target = t.members[idx];
  const admins = t.members.filter((m) => m.role === "admin");
  if (target.role === "admin" && admins.length <= 1)
    return { ok: false, error: "Tidak bisa hapus admin terakhir." };
  t.members.splice(idx, 1);
  delete t.pins[target.name];
  saveTeam(t);
  return { ok: true };
}

export function setRole(name, role) {
  const t = loadTeam();
  const m = t.members.find(
    (x) => x.name.toLowerCase() === String(name || "").toLowerCase()
  );
  if (!m) return { ok: false, error: "Nama tidak terdaftar di tim." };
  const next = role === "admin" ? "admin" : "anggota";
  if (m.role === "admin" && next === "anggota") {
    const admins = t.members.filter((x) => x.role === "admin");
    if (admins.length <= 1)
      return { ok: false, error: "Minimal harus ada 1 admin." };
  }
  m.role = next;
  saveTeam(t);
  return { ok: true };
}

export { TEAM_KEY };
