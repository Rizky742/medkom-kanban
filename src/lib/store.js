// Data model: REQUEST (parent) -> GARAPAN (child, assign per orang)
// Disimpan di localStorage. Siap diganti fetch ke Apps Script nanti.

export const ADMINS = ["Rizky", "Vita", "Fayola", "Lina"];
export const MEMBERS = [
  "Rizky",
  "Vita",
  "Fayola",
  "Lina",
  "Sovia",
  "Hannara",
  "Dika",
  "Mutiara",
  "Celine",
  "Syahwa",
];

export const STATUSES = [
  { id: "masuk", label: "Masuk" },
  { id: "verifikasi", label: "Cek brief" },
  { id: "antri", label: "Antri" },
  { id: "dikerjakan", label: "Dikerjakan" },
  { id: "review", label: "Review" },
  { id: "revisi", label: "Revisi" },
  { id: "approved", label: "Disetujui" },
  { id: "published", label: "Terbit" },
];

export const BOARD_COLS = ["antri", "dikerjakan", "review", "revisi", "approved", "published"];

const LS_KEY = "medkom_v3";

/* Seed real: 3 request yang belum dikerjakan (dari Form Responses).
   Tanpa tugas turunan — Admin verifikasi + pecah di Intake. */
function realSeed() {
  const requests = [
    {
      id: "REQ-015",
      code: "BLD2",
      divisi: "PENGMAS",
      pic: "Syahwa",
      wa: "085895981621",
      proker: "B.L.O.O.D (Bring Life On One Drop)",
      jenis: ["Poster"],
      deskripsi: "Poster donor darah.",
      brief: { tema: "", palet: "", ukuran: "", referensi: "", larangan: "" },
      asetMasuk: ["https://drive.google.com/open?id=1Va0w1X777rfjaA3kyCQeoGYH8fsJPAUa", "https://drive.google.com/open?id=1bTzi87Wt2MyugIehVqDGcgwJvuVJuQFJ"],
      deadlineAcara: "2026-09-11",
      createdAt: "2026-09-04",
      publishTarget: ["IG Feed"],
    },
    {
      id: "REQ-016",
      code: "CVT7",
      divisi: "HUBLU",
      pic: "Celine",
      wa: "089530831646",
      proker: "GenBI Company Visit",
      jenis: ["Poster"],
      deskripsi: "Poster proposal sponsorship company visit.",
      brief: { tema: "", palet: "", ukuran: "", referensi: "", larangan: "" },
      asetMasuk: ["https://drive.google.com/open?id=1Z98XhTx7ZxRgGz1MLMmUZJCWukSQ2VIF"],
      deadlineAcara: "2026-09-17",
      createdAt: "2026-09-10",
      publishTarget: ["Proposal"],
    },
    {
      id: "REQ-017",
      code: "WBI4",
      divisi: "PENDIDIKAN",
      pic: "Dika",
      wa: "085847565785",
      proker: "WEeBI 2026",
      jenis: ["Feed Instagram", "Poster"],
      deskripsi: "Poster untuk promosi webinar WEeBI 2026 yang akan dishare di feeds IG GenBI UNAIR.",
      brief: { tema: "", palet: "", ukuran: "", referensi: "", larangan: "" },
      asetMasuk: ["https://drive.google.com/open?id=1RlWLpQTFO-9RvG_aBUwtBHnUVd6S2zJQ"],
      deadlineAcara: "2026-09-20",
      createdAt: "2026-09-13",
      publishTarget: ["IG Feed"],
    },
  ];
  return { requests, tasks: [], reqSeq: 20, taskSeq: 20 };
}

/* Database kosong untuk pemakaian real. Request pertama = REQ-001. */
function emptyDB() {
  return { requests: [], tasks: [], reqSeq: 1, taskSeq: 1 };
}

/* Data contoh demo (proyek lama yang sudah selesai/tayang).
   Hanya dimuat kalau user klik "Muat contoh" di footer. */
function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function trackCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function demoSeed() {
  const requests = [
    {
      id: "REQ-014",
      code: "WLP8",
      divisi: "PSDM",
      pic: "Mutiara Pinastika",
      wa: "088231634282",
      proker: "Welcome Party GenBI UNAIR 2026",
      jenis: ["Poster", "Live report"],
      deskripsi: 'Tema "Three Pillars, One Growth, Greater Impact", palet pastel. Acara 22 Agustus.',
      brief: { tema: "Three Pillars, One Growth, Greater Impact", palet: "Pastel", ukuran: "Feed + Story + A5 + Banner", referensi: "Moodboard Medkom", larangan: "Hindari warna neon" },
      asetMasuk: ["https://drive.google.com/open?id=1H-XljNYzGe4moxL9uV7TdX-GPfKHjopm"],
      deadlineAcara: "2026-08-22",
      createdAt: "2026-08-16",
      publishTarget: ["IG Feed", "IG Story"],
    },
    {
      id: "REQ-015",
      code: "BLD2",
      divisi: "PENGMAS",
      pic: "Syahwa",
      wa: "085895981621",
      proker: "B.L.O.O.D (Bring Life On One Drop)",
      jenis: ["Poster"],
      deskripsi: "Poster donor darah, butuh versi feed + cetak.",
      brief: { tema: "Donor darah, merah-putih bersih", palet: "Merah + krem", ukuran: "1:1 + A3", referensi: "-", larangan: "-" },
      asetMasuk: ["https://drive.google.com/open?id=1Va0w1X777rfjaA3kyCQeoGYH8fsJPAUa"],
      deadlineAcara: "2026-09-11",
      createdAt: "2026-09-04",
      publishTarget: ["IG Feed"],
    },
    {
      id: "REQ-016",
      code: "CVT7",
      divisi: "HUBLU",
      pic: "Celine",
      wa: "089530831646",
      proker: "GenBI Company Visit",
      jenis: ["Poster"],
      deskripsi: "Poster proposal sponsorship company visit.",
      brief: { tema: "Profesional, navy + emas", palet: "Navy", ukuran: "A4", referensi: "-", larangan: "-" },
      asetMasuk: ["https://drive.google.com/open?id=1Z98XhTx7ZxRgGz1MLMmUZJCWukSQ2VIF"],
      deadlineAcara: "2026-09-17",
      createdAt: "2026-09-10",
      publishTarget: ["Proposal"],
    },
    {
      id: "REQ-017",
      code: "WBI4",
      divisi: "PENDIDIKAN",
      pic: "Dika",
      wa: "085847565785",
      proker: "WEeBI 2026",
      jenis: ["Feed Instagram", "Poster"],
      deskripsi: "Poster promosi webinar WEeBI 2026 untuk feed IG.",
      brief: { tema: "Webinar edukatif, hijau pine", palet: "Pine + krem", ukuran: "4:5 feed", referensi: "-", larangan: "-" },
      asetMasuk: ["https://drive.google.com/open?id=1RlWLpQTFO-9RvG_aBUwtBHnUVd6S2zJQ"],
      deadlineAcara: "2026-09-20",
      createdAt: "2026-09-13",
      publishTarget: ["IG Feed"],
    },
    {
      id: "REQ-018",
      code: "PRK1",
      divisi: "MEDKOM",
      pic: "Vita",
      wa: "-",
      proker: "Hari Proklamasi",
      jenis: ["Feed Instagram"],
      deskripsi: "Up feed 17 Agustus.",
      brief: { tema: "Merah putih minimal", palet: "Merah", ukuran: "1:1", referensi: "-", larangan: "-" },
      asetMasuk: [],
      deadlineAcara: "2026-08-17",
      createdAt: "2026-08-10",
      publishTarget: ["IG Feed"],
    },
    {
      id: "REQ-019",
      code: "MLD9",
      divisi: "MEDKOM",
      pic: "Hannara",
      wa: "-",
      proker: "Maulid Nabi",
      jenis: ["Feed Instagram"],
      deskripsi: "Up feed 25 Agustus.",
      brief: { tema: "Hijau emerald + gold", palet: "Emerald", ukuran: "1:1", referensi: "-", larangan: "-" },
      asetMasuk: [],
      deadlineAcara: "2026-08-25",
      createdAt: "2026-08-12",
      publishTarget: ["IG Feed"],
    },
  ];

  const tasks = [
    { id: "MDK-014-A", reqId: "REQ-014", title: "Frame IG Live Report Welpart", note: "Up IG Story", pic: "Sovia", deadline: "2026-08-21", status: "review", cetak: false, versi: 2, briefLink: "", finalLink: "", publishLink: "", comments: [{ by: "Vita", text: "Sesuaikan padding logo, lalu final.", at: "20/8" }] },
    { id: "MDK-014-B", reqId: "REQ-014", title: "Q-Card MC A5 Welpart", note: "Cetak A5", pic: "Hannara", deadline: "2026-08-20", status: "dikerjakan", cetak: true, versi: 1, briefLink: "", finalLink: "", publishLink: "", comments: [] },
    { id: "MDK-014-C", reqId: "REQ-014", title: "Poster undangan Story Welpart", note: "Up IG Story", pic: "Sovia", deadline: "2026-08-21", status: "antri", cetak: false, versi: 1, briefLink: "", finalLink: "", publishLink: "", comments: [] },
    { id: "MDK-014-D", reqId: "REQ-014", title: "Banner + Bumper Welpart", note: "Cetak banner", pic: "Rizky", deadline: "2026-08-20", status: "revisi", cetak: true, versi: 2, briefLink: "", finalLink: "", publishLink: "", comments: [{ by: "Fayola", text: "Bumper: turunkan durasi ke 10 detik.", at: "19/8" }] },
    { id: "MDK-015-A", reqId: "REQ-015", title: "Poster BLOOD feed + A3", note: "Up Feeds IG", pic: "Dika", deadline: "2026-09-11", status: "dikerjakan", cetak: true, versi: 1, briefLink: "", finalLink: "", publishLink: "", comments: [] },
    { id: "MDK-016-A", reqId: "REQ-016", title: "Poster sponsorship Company Visit", note: "Proposal", pic: "Lina", deadline: "2026-09-17", status: "verifikasi", cetak: false, versi: 1, briefLink: "", finalLink: "", publishLink: "", comments: [] },
    { id: "MDK-017-A", reqId: "REQ-017", title: "Feed WEeBI 2026", note: "Up Feeds IG", pic: "Fayola", deadline: "2026-09-20", status: "antri", cetak: false, versi: 1, briefLink: "", finalLink: "", publishLink: "", comments: [] },
    { id: "MDK-018-A", reqId: "REQ-018", title: "Feed Hari Proklamasi", note: "Up Feeds IG", pic: "Sovia", deadline: "2026-08-17", status: "approved", cetak: false, versi: 3, briefLink: "", finalLink: "", publishLink: "", comments: [] },
    { id: "MDK-019-A", reqId: "REQ-019", title: "Feed Maulid Nabi", note: "Up Feeds IG", pic: "Hannara", deadline: "2026-08-25", status: "published", cetak: false, versi: 2, briefLink: "", finalLink: "", publishLink: "https://instagram.com/", comments: [] },
  ];

  return { requests, tasks, reqSeq: 20, taskSeq: 20 };
}

export function loadDB() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const data = realSeed();
  saveDB(data);
  return data;
}

/* Muat data contoh demo (opt-in via footer). Mengganti data sekarang. */
export function loadDemoDB() {
  const data = demoSeed();
  saveDB(data);
  return data;
}

export function saveDB(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}

export function resetDB() {
  localStorage.removeItem(LS_KEY);
  const data = emptyDB();
  saveDB(data);
  return data;
}

export function parentStatus(reqId, tasks) {
  const kids = tasks.filter((t) => t.reqId === reqId);
  if (!kids.length) return "masuk";
  if (kids.every((t) => t.status === "published")) return "published";
  if (kids.some((t) => t.status === "revisi")) return "revisi";
  if (kids.some((t) => t.status === "review")) return "review";
  if (kids.some((t) => t.status === "dikerjakan")) return "dikerjakan";
  if (kids.some((t) => t.status === "approved")) return "approved";
  if (kids.every((t) => t.status === "antri")) return "antri";
  return "verifikasi";
}

export function daysLeft(deadline) {
  if (!deadline) return NaN;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline + "T00:00:00");
  if (isNaN(d.getTime())) return NaN;
  return Math.ceil((d - now) / 86400000);
}

export function newIds() {
  return { uid, trackCode };
}

export { LS_KEY };
