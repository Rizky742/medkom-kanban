// Sync layer: aplikasi <-> Google Apps Script Web App (Sheets + Drive).
// Tanpa URL backend -> mode lokal (localStorage saja, semua fitur tetap jalan).

const LS_URL = "medkom_api_url";
const LS_SYNC = "medkom_last_sync";

export function getApiUrl() {
  try {
    const v = localStorage.getItem(LS_URL);
    if (v) return v.replace(/\/$/, "");
  } catch { /* abaikan */ }
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_URL : null;
  return env ? String(env).replace(/\/$/, "") : null;
}

export function setApiUrl(u) {
  try {
    if (u) localStorage.setItem(LS_URL, String(u).trim().replace(/\/$/, ""));
    else localStorage.removeItem(LS_URL);
  } catch { /* abaikan */ }
}

export const isOnline = () => !!getApiUrl();

export function getLastSync() {
  try {
    return Number(localStorage.getItem(LS_SYNC)) || 0;
  } catch {
    return 0;
  }
}

export function setLastSync(t) {
  try {
    localStorage.setItem(LS_SYNC, String(t));
  } catch { /* abaikan */ }
}

async function get(action) {
  const url = getApiUrl();
  if (!url) throw new Error("backend belum disambungkan");
  const r = await fetch(`${url}?action=${encodeURIComponent(action)}`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (!j || j.ok !== true) throw new Error((j && j.error) || "backend error");
  return j;
}

async function post(body) {
  const url = getApiUrl();
  if (!url) throw new Error("backend belum disambungkan");
  // Kunci tulis opsional: kalau VITE_WRITE_KEY diset (dan WRITE_KEY
  // diset di ScriptProperties backend), ikut dikirim. Tanpa key,
  // backend lama tetap menerima (backward compat).
  let key = null;
  try {
    key =
      typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env.VITE_WRITE_KEY
        : null;
  } catch {
    /* abaikan */
  }
  const payload = key ? { ...body, key: String(key) } : body;
  // text/plain agar tidak kena CORS preflight di Apps Script
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (!j || j.ok !== true) throw new Error((j && j.error) || "backend error");
  return j;
}

export const apiPing = () => get("ping").then(() => true);

export const apiCreateRequest = (payload, files = []) =>
  post({ action: "createRequest", payload, files });

export const apiUpsertTask = (task) => post({ action: "upsertTask", payload: task });

// --- normalisasi baris Sheet -> model aplikasi ---

function toYMD(v) {
  if (v === "" || v === null || v === undefined) return "";
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  return s;
}

function safeJSON(s, fb) {
  try {
    const v = JSON.parse(String(s || ""));
    return v && typeof v === "object" ? v : fb;
  } catch {
    return fb;
  }
}

function normRequests(rows) {
  const map = new Map();
  for (const r of rows || []) {
    if (!r || r[0] === "id" || !r[0]) continue;
    map.set(String(r[0]), {
      id: String(r[0]),
      code: String(r[1] || ""),
      divisi: String(r[2] || ""),
      pic: String(r[3] || ""),
      wa: String(r[4] || ""),
      proker: String(r[5] || ""),
      jenis: String(r[6] || "").split(",").map((x) => x.trim()).filter(Boolean),
      deskripsi: String(r[7] || ""),
      brief: safeJSON(r[8], {}),
      asetMasuk: String(r[9] || "").split("\n").map((x) => x.trim()).filter(Boolean),
      deadlineAcara: toYMD(r[10]),
      createdAt: toYMD(r[11]),
      publishTarget: [],
      cetak: false,
      folderId: String(r[12] || ""),
    });
  }
  return [...map.values()];
}

function driveLink(id) {
  const s = String(id || "").trim();
  if (!s) return "";
  if (s.startsWith("http")) return s;
  return `https://drive.google.com/file/d/${s}/view`;
}

function normTasks(rows) {
  const map = new Map();
  const cols = ["id", "reqId", "title", "note", "pic", "deadline", "status", "cetak", "versi", "folderId", "finalIds", "publishLink"];
  for (const r of rows || []) {
    if (!r || r[0] === "id" || !r[0]) continue;
    const id = String(r[0]);
    const cur = map.get(id) || {
      id, reqId: "", title: "", note: "", pic: "", deadline: "",
      status: "antri", cetak: false, versi: 1, folderId: "",
      finalIds: "", publishLink: "", briefLink: "", comments: [],
    };
    cols.forEach((k, i) => {
      const v = r[i];
      if (v !== "" && v !== null && v !== undefined) cur[k] = v;
    });
    map.set(id, cur);
  }
  return [...map.values()].map((t) => ({
    id: String(t.id),
    reqId: String(t.reqId || ""),
    title: String(t.title || ""),
    note: String(t.note || ""),
    pic: String(t.pic || ""),
    deadline: toYMD(t.deadline),
    status: String(t.status || "antri"),
    cetak: t.cetak === true || String(t.cetak).toUpperCase() === "TRUE",
    versi: parseInt(t.versi, 10) || 1,
    folderId: String(t.folderId || ""),
    finalLink: driveLink(String(t.finalIds || "").split(",")[0] || ""),
    publishLink: String(t.publishLink || ""),
    briefLink: "",
    comments: [],
  }));
}

export async function pullRemote() {
  const j = await get("list");
  const data = j.data || {};
  return {
    requests: normRequests(data.REQUESTS),
    tasks: normTasks(data.TASKS),
  };
}

// Gabung remote -> lokal. Remote menang untuk field backend;
// field khusus aplikasi (publishTarget, cetak request, brief kosong) dipertahankan.
export function mergeRemote(local, remote) {
  const reqMap = new Map((local.requests || []).map((r) => [r.id, r]));
  (remote.requests || []).forEach((rr) => {
    const l = reqMap.get(rr.id);
    if (!l) {
      reqMap.set(rr.id, rr);
      return;
    }
    const briefOk = rr.brief && Object.values(rr.brief).some((v) => String(v || "").trim());
    reqMap.set(rr.id, {
      ...rr,
      publishTarget: l.publishTarget && l.publishTarget.length ? l.publishTarget : rr.publishTarget,
      cetak: l.cetak !== undefined ? l.cetak : rr.cetak,
      brief: briefOk ? rr.brief : l.brief || {},
    });
  });
  const taskMap = new Map((local.tasks || []).map((t) => [t.id, t]));
  (remote.tasks || []).forEach((rt) => {
    const l = taskMap.get(rt.id);
    // komentar hanya hidup lokal (v1) -> jangan timpa dengan array kosong remote
    taskMap.set(rt.id, l && l.comments && l.comments.length ? { ...rt, comments: l.comments } : rt);
  });
  const requests = [...reqMap.values()];
  const tasks = [...taskMap.values()];
  return {
    requests,
    tasks,
    reqSeq: nextSeqNum(requests.map((r) => r.id), local.reqSeq),
    taskSeq: nextSeqNum(tasks.map((t) => t.id), local.taskSeq),
  };
}

function nextSeqNum(ids, fallback) {
  let mx = Number(fallback) || 1;
  (ids || []).forEach((id) => {
    const m = String(id).match(/(\d+)/);
    if (m) mx = Math.max(mx, parseInt(m[1], 10) + 1);
  });
  return mx;
}

// Kirim yang belum ada di remote: request baru -> createRequest,
// tugas baru/berubah -> upsertTask. Mengembalikan {created, updated}.
export async function pushLocal(local, remote) {
  const rIds = new Set((remote.requests || []).map((r) => r.id));
  const tMap = new Map((remote.tasks || []).map((t) => [t.id, t]));
  let created = 0;
  let updated = 0;
  for (const r of local.requests || []) {
    if (rIds.has(r.id)) continue;
    await post({
      action: "createRequest",
      payload: {
        id: r.id,
        code: r.code,
        divisi: r.divisi,
        pic: r.pic,
        wa: r.wa,
        proker: r.proker,
        jenis: r.jenis,
        deskripsi: r.deskripsi,
        brief: r.brief,
        asetLinks: r.asetMasuk,
        deadline: r.deadlineAcara,
      },
      files: [],
    });
    created += 1;
  }
  const tracked = (t) => [t.title, t.note, t.pic, t.deadline, t.status, t.cetak ? "1" : "0", t.versi, t.publishLink].join("|");
  for (const t of local.tasks || []) {
    const rt = tMap.get(t.id);
    if (!rt || tracked(rt) !== tracked(t)) {
      await post({
        action: "upsertTask",
        payload: {
          id: t.id, reqId: t.reqId, title: t.title, note: t.note, pic: t.pic,
          deadline: t.deadline, status: t.status, cetak: !!t.cetak, versi: t.versi || 1,
          folderId: t.folderId || "", finalIds: "", publishLink: t.publishLink || "",
        },
      });
      updated += 1;
    }
  }
  return { created, updated };
}

export function filesToBase64(files) {
  return Promise.all(
    [...files].map(
      (f) =>
        new Promise((resolve, reject) => {
          const rd = new FileReader();
          rd.onload = () => resolve({ name: f.name, mime: f.type || "application/octet-stream", base64: String(rd.result) });
          rd.onerror = () => reject(new Error("gagal baca " + f.name));
          rd.readAsDataURL(f);
        })
    )
  );
}

export function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
