/**
 * Medkom Tracker — Backend Apps Script
 * Owner akun deploy: medkomgenbiunair2026@gmail.com
 * Root Drive: Arsip Medkom (1j7gX4ArXUpQAsIEskiO76BP_J2c8w-iU) > _APP_TRACKER/
 * (akun deploy butuh akses EDITOR ke folder tersebut)
 *
 * CARA PASANG (5 menit):
 * 1. Buka script.google.com > New project > paste file ini > Save
 * 2. Ganti ROOT_FOLDER_ID di bawah (sudah terisi dari folder kamu)
 * 3. Run setup() sekali > Allow > pilih akun genbiunair26@gmail.com
 * 4. Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone > Deploy
 * 5. Copy URL /exec ke frontend: buat file .env berisi VITE_API_URL="https://script.google.com/.../exec"
 *
 * Sheet yang dipakai: Form Request (Responses) + MASTERSHEET? Tidak — script ini
 * membuat sheet kerja sendiri "MEDKOM_DB" agar file lamamu tidak rusak.
 */

const ROOT_FOLDER_ID = "1j7gX4ArXUpQAsIEskiO76BP_J2c8w-iU";
const APP_DIR_NAME = "_APP_TRACKER";
const MAX_MB = 20;

function setup() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  let appDir;
  const it = root.getFoldersByName(APP_DIR_NAME);
  appDir = it.hasNext() ? it.next() : root.createFolder(APP_DIR_NAME);
  let ss = getSS();
  ["REQUESTS", "TASKS"].forEach((name) => {
    if (!ss.getSheetByName(name)) {
      const sh = ss.insertSheet(name);
      if (name === "REQUESTS")
        sh.appendRow(["id", "code", "divisi", "pic", "wa", "proker", "jenis", "deskripsi", "brief_json", "aset", "deadline", "createdAt", "folderId"]);
      else
        sh.appendRow(["id", "reqId", "title", "note", "pic", "deadline", "status", "cetak", "versi", "folderId", "finalIds", "publishLink"]);
    }
  });
  return "OK root=" + appDir.getId() + " db=" + ss.getUrl();
}

// Spreadsheet kerja milik script ini (dibuat otomatis saat setup).
// Standalone-friendly: tidak bergantung spreadsheet yang sedang dibuka.
function getSS() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("DB_SS_ID");
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) { /* ID basi, buat baru di bawah */ }
  }
  const ss = SpreadsheetApp.create("MEDKOM_DB");
  props.setProperty("DB_SS_ID", ss.getId());
  return ss;
}

function getAppDir() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const it = root.getFoldersByName(APP_DIR_NAME);
  return it.hasNext() ? it.next() : root.createFolder(APP_DIR_NAME);
}

// POST {action:"createRequest", payload:{...}, files:[{name,mime,base64}]}
function doPost(e) {
  try {
    ensureSheets();
    const body = JSON.parse(e.postData.contents);
    if (body.action === "createRequest") return json(createRequest(body.payload, body.files || []));
    if (body.action === "uploadGarapan") return json(uploadGarapan(body.payload, body.files || []));
    if (body.action === "updateStatus") return json(updateStatus(body.payload));
    if (body.action === "upsertTask") return json(upsertTask(body.payload));
    return json({ ok: false, error: "unknown action" });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// GET ?action=list
function doGet(e) {
  const a = (e.parameter || {}).action || "ping";
  if (a === "ping") return json({ ok: true, app: "medkom-tracker" });
  if (a === "list") return json(listAll());
  return json({ ok: false });
}

// Diagnosis: tidak menyentuh layanan Google apa pun.
function ping() {
  return "OK " + new Date().toISOString();
}

// Inisialisasi malas: pastikan tab kerja ada setiap request masuk,
// sehingga Run setup() manual tidak wajib.
function ensureSheets() {
  const ss = getSS();
  const need = {
    REQUESTS: ["id", "code", "divisi", "pic", "wa", "proker", "jenis", "deskripsi", "brief_json", "aset", "deadline", "createdAt", "folderId"],
    TASKS: ["id", "reqId", "title", "note", "pic", "deadline", "status", "cetak", "versi", "folderId", "finalIds", "publishLink"],
  };
  Object.keys(need).forEach((name) => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name).appendRow(need[name]);
    }
  });
  return true;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function createRequest(p, files) {
  const appDir = getAppDir();
  const seq = nextSeq("REQ");
  // Hormati ID dari aplikasi bila ada (anti-duplikat saat sync dua arah)
  const id = p.id || ("REQ-" + seq);
  const code = p.code || Math.random().toString(36).slice(2, 6).toUpperCase();
  const folder = appDir.createFolder(id + "_" + slug(p.proker));
  const masuk = folder.createFolder("01_aset_masuk");
  folder.createFolder("02_garapan");
  folder.createFolder("03_final");
  const asetIds = saveFiles(masuk, files);
  const ss = getSS().getSheetByName("REQUESTS");
  ss.appendRow([id, code, p.divisi, p.pic, p.wa, p.proker, (p.jenis || []).join(","), p.deskripsi,
    JSON.stringify(p.brief || {}), (p.asetLinks || []).concat(asetIds.map((x) => "https://drive.google.com/file/d/" + x + "/view")).join("\n"),
    p.deadline, new Date(), folder.getId()]);
  return { ok: true, id, code, folderId: folder.getId(), trackUrl: "/#/track/" + id };
}

function uploadGarapan(p, files) {
  // p: {taskId, reqId}
  const folderId = findTaskFolder(p.reqId, p.taskId);
  const folder = folderId ? DriveApp.getFolderById(folderId).getFoldersByName("02_garapan").next()
    : getAppDir().createFolder(p.taskId);
  const ids = saveFiles(folder, files);
  const sh = getSS().getSheetByName("TASKS");
  sh.appendRow([p.taskId, p.reqId, "", "", "", "", "review", "", 1, folder.getId(), ids.join(","), ""]);
  return { ok: true, fileIds: ids };
}

function updateStatus(p) {
  const sh = getSS().getSheetByName("TASKS");
  sh.appendRow([p.taskId, p.reqId, "", "", "", "", p.status, "", "", "", "", p.publishLink || ""]);
  return { ok: true };
}

function listAll() {
  ensureSheets();
  const ss = getSS();
  const out = {};
  ["REQUESTS", "TASKS"].forEach((n) => {
    const sh = ss.getSheetByName(n);
    out[n] = sh ? sh.getDataRange().getValues().map((row) => row.map(fmtVal)) : [];
  });
  return { ok: true, data: out };
}

function upsertTask(p) {
  // Baris penuh tugas (append-only). Baris terakhir per ID yang dipakai frontend.
  let sh = getSS().getSheetByName("TASKS");
  if (!sh) {
    setup();
    sh = getSS().getSheetByName("TASKS");
  }
  sh.appendRow([p.id, p.reqId, p.title || "", p.note || "", p.pic || "", p.deadline || "",
    p.status || "antri", p.cetak ? "TRUE" : "FALSE", p.versi || 1,
    p.folderId || "", p.finalIds || "", p.publishLink || ""]);
  return { ok: true, id: p.id };
}

function fmtVal(v) {
  // Kirim tanggal sebagai yyyy-MM-dd agar tidak geser timezone di frontend
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return v;
}

function saveFiles(folder, files) {
  const ids = [];
  files.slice(0, 5).forEach((f) => {
    const bytes = Utilities.base64Decode(f.base64.split(",").pop());
    if (bytes.length > MAX_MB * 1024 * 1024) throw new Error("File " + f.name + " > " + MAX_MB + "MB");
    const blob = Utilities.newBlob(bytes, f.mime, f.name);
    ids.push(folder.createFile(blob).getId());
  });
  return ids;
}

function nextSeq(prefix) {
  const props = PropertiesService.getScriptProperties();
  const k = prefix + "_SEQ";
  // Mulai 500 agar tidak tabrakan dengan ID lokal aplikasi (REQ-001 dst)
  const n = parseInt(props.getProperty(k) || "500", 10);
  props.setProperty(k, String(n + 1));
  return String(n).padStart(3, "0");
}

function slug(s) {
  return String(s || "proker").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 30);
}

function findTaskFolder(reqId, taskId) {
  const appDir = getAppDir();
  const it = appDir.getFolders();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(reqId) === 0) return f.getId();
  }
  return null;
}
