import { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  NotePencil,
  PaintBrush,
  RocketLaunch,
  Ticket,
} from "@phosphor-icons/react";
import PortalShell from "../portal/PortalShell.jsx";
import { trackCode } from "../lib/store.js";
import { apiCreateRequest, filesToBase64, getApiUrl, todayLocal } from "../lib/api.js";

function PField({ label, hint, children }) {
  return (
    <div>
      <p className="portal-label">{label}</p>
      {hint && <p className="portal-hint">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SectionHead({ no, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <span className="portal-section-no">{no}</span>
      <div>
        <p className="text-[17px] font-extrabold tracking-tight">{title}</p>
        <p className="portal-hint">{desc}</p>
      </div>
    </div>
  );
}

export default function PublicRequest({ db, setDb, go }) {
  const [form, setForm] = useState({
    divisi: "",
    pic: "",
    wa: "",
    proker: "",
    jenis: "Poster",
    deskripsi: "",
    tema: "",
    palet: "",
    ukuran: "",
    referensi: "",
    deadline: "",
    cetak: false,
    aset: "",
    publish: "IG Feed",
  });
  const [done, setDone] = useState(null);
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [fileWarn, setFileWarn] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const online = !!getApiUrl();

  const publishedCount = db.tasks.filter((t) => t.status === "published" || t.status === "approved").length;
  const divisiCount = new Set(db.requests.map((r) => r.divisi)).size;

  async function submit(e) {
    e.preventDefault();
    if (!form.divisi || !form.pic || !form.proker || !form.deadline) {
      alert("Lengkapi Divisi, PIC, Nama Proker, dan Deadline dulu ya.");
      return;
    }
    const asetTrim = String(form.aset || "").trim();
    if (asetTrim && !/^https:\/\//i.test(asetTrim)) {
      alert("Link aset harus diawali https:// (tempel link Drive).");
      return;
    }
    if (files.length > 5) {
      alert("Maksimal 5 file.");
      return;
    }
    const ALLOWED_MIME = ["image/", "video/", "application/pdf"];
    for (const f of files) {
      if (f.size > 20 * 1024 * 1024) {
        alert(`File ${f.name} lebih dari 20MB.`);
        return;
      }
      if (!ALLOWED_MIME.some((p) => (f.type || "").startsWith(p))) {
        alert(`File ${f.name} tidak didukung. Hanya gambar, video, atau PDF.`);
        return;
      }
    }
    const base = {
      divisi: form.divisi,
      pic: form.pic,
      wa: form.wa,
      proker: form.proker,
      jenis: [form.jenis],
      deskripsi: form.deskripsi,
      brief: { tema: form.tema, palet: form.palet, ukuran: form.ukuran, referensi: form.referensi, larangan: "" },
      asetMasuk: asetTrim ? [asetTrim] : [],
      deadlineAcara: form.deadline,
      createdAt: todayLocal(),
      publishTarget: [form.publish],
      cetak: form.cetak,
    };
    // Kalau backend tersambung: kirim online (ID resmi dari server + file masuk Drive).
    // Kalau tidak: simpan lokal, otomatis terkirim setelah sync tersambung.
    let id = `REQ-${String(db.reqSeq).padStart(3, "0")}`;
    let code = trackCode();
    let usedSeq = true;
    let warn = false;
    if (online) {
      setSending(true);
      try {
        const b64 = await filesToBase64(files);
        const res = await apiCreateRequest(
          {
            divisi: base.divisi, pic: base.pic, wa: base.wa, proker: base.proker,
            jenis: base.jenis, deskripsi: base.deskripsi, brief: base.brief,
            asetLinks: base.asetMasuk, deadline: base.deadlineAcara,
          },
          b64
        );
        id = res.id;
        code = res.code;
        usedSeq = false;
      } catch {
        warn = files.length > 0;
      } finally {
        setSending(false);
      }
    } else if (files.length > 0) {
      warn = true;
    }
    const req = { ...base, id, code };
    setDb(usedSeq ? { ...db, requests: [req, ...db.requests], reqSeq: db.reqSeq + 1 } : { ...db, requests: [req, ...db.requests] });
    setFileWarn(warn);
    setDone(req);
    setFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done)
    return (
      <PortalShell go={go}>
        <div className="mx-auto max-w-[560px] px-4 py-12">
          <div className="portal-card overflow-hidden">
            <div className="flex items-center gap-3 bg-[#0e7c6b] p-5 text-white">
              <CheckCircle size={36} weight="fill" />
              <div>
                <p className="text-[13px] font-bold uppercase tracking-widest opacity-80">Request terkirim</p>
                <p className="portal-display text-[34px]">{done.id}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[15px] font-bold">{done.proker}</p>
              <p className="portal-hint">
                {done.divisi} · PIC {done.pic} · Deadline {done.deadlineAcara}
              </p>
              <div className="ticket-dash my-4" />
              <p className="portal-hint">Tunjukkan kode ini buat pantau progres, tanpa login:</p>
              <div className="ticket-barcode mt-2" />
              <p className="portal-display mt-2 text-center text-[26px] tracking-[0.2em]">{done.code}</p>
              {fileWarn && (
                <p className="mt-3 rounded-xl bg-[#FFF3D6] px-3 py-2 text-[13px] font-medium">
                  Catatan: file tidak ikut terkirim (koneksi offline). Tempel link Drive-nya atau hubungi admin Medkom ya.
                </p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button className="portal-btn portal-btn-coral px-5 py-2.5 text-[15px]" onClick={() => go(`/track/${done.id}`)}>
                  Pantau progres <ArrowRight size={16} weight="bold" />
                </button>
                <button className="portal-btn portal-btn-light px-5 py-2.5 text-[15px]" onClick={() => setDone(null)}>
                  Buat request lain
                </button>
              </div>
            </div>
          </div>
        </div>
      </PortalShell>
    );

  return (
    <PortalShell go={go}>
      <div className="mx-auto max-w-5xl px-4">
        {/* hero */}
        <div className="py-12 text-center sm:py-16">
          <div className="flex flex-wrap justify-center gap-2">
            <span className="portal-chip portal-chip-sun">Gratis buat internal</span>
            <span className="portal-chip portal-chip-teal">Dibantu sampai tayang</span>
          </div>
          <h1 className="portal-display mx-auto mt-5 max-w-[16ch] text-[36px] sm:text-[60px]">
            Butuh desain? <span className="text-[#ff5a36]">Tinggal request.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-[16px] font-medium text-[#6e6257]">
            Poster, feed IG, banner, sampai video — tim Medkom yang kerjakan. Kamu cukup isi form,
            terima beres, pantau pakai kode tiket.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              className="portal-btn portal-btn-coral px-6 py-3 text-[16px]"
              onClick={() => document.getElementById("req-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              <NotePencil size={18} weight="bold" /> Buat request
            </button>
            <button className="portal-btn px-6 py-3 text-[16px]" onClick={() => go("/track/")}>
              <Ticket size={18} weight="bold" /> Lacak request
            </button>
          </div>
          <div className="mx-auto mt-8 flex max-w-[560px] divide-x-2 divide-[#23201a] rounded-2xl border-2 border-[#23201a] bg-white">
            {[
              [`${db.requests.length}`, "request masuk"],
              [`${publishedCount}`, "desain tayang"],
              [`${divisiCount}`, "divisi terbantu"],
            ].map(([n, l]) => (
              <div key={l} className="flex-1 py-3">
                <p className="portal-display text-[26px]">{n}</p>
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#6e6257]">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* cara kerja */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["01", <NotePencil key="i" size={26} weight="duotone" />, "Isi form", "Ceritakan kebutuhan + brief. Makin lengkap, makin cepat dikerjakan."],
            ["02", <PaintBrush key="i" size={26} weight="duotone" />, "Dikerjakan tim", "Admin bagi ke anggota. Revisi? Tinggal balas di tiketmu."],
            ["03", <RocketLaunch key="i" size={26} weight="duotone" />, "Pantau & terima", "Cek progres pakai ID request. Hasil final dikirim + link tayang."],
          ].map(([no, icon, t, d]) => (
            <div key={t} className="portal-card p-5">
              <div className="flex items-center justify-between">
                <span className="portal-display text-[30px] text-[#ff5a36]">{no}</span>
                {icon}
              </div>
              <p className="mt-2 text-[17px] font-extrabold">{t}</p>
              <p className="portal-hint mt-1">{d}</p>
            </div>
          ))}
        </div>

        {/* form */}
        <form id="req-form" onSubmit={submit} className="portal-card mt-8 scroll-mt-24 p-5 sm:p-8">
          <h2 className="portal-display text-[28px]">Form request</h2>
          <p className="portal-hint mt-1">Tanda * wajib diisi. Santai, bisa dilengkapi belakangan via revisi.</p>

          <div className="mt-6 space-y-7">
            <div>
              <SectionHead no="1" title="Proker & divisi" desc="Biar kami tahu request ini buat acara apa." />
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PField label="Divisi *">
                  <select className="portal-input" value={form.divisi} onChange={(e) => set("divisi", e.target.value)}>
                    <option value="">Pilih divisi…</option>
                    {["PSDM", "PENGMAS", "HUBLU", "PENDIDIKAN", "MEDKOM", "Lainnya"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </PField>
                <PField label="Nama proker *" hint="cth: WEeBI 2026">
                  <input className="portal-input" value={form.proker} onChange={(e) => set("proker", e.target.value)} />
                </PField>
                <PField label="PIC *" hint="Nama + kontak WA, cth: Dika (0858…)">
                  <input className="portal-input" value={form.pic} onChange={(e) => set("pic", e.target.value)} />
                </PField>
                <PField label="No WA" hint="Buat verifikasi kalau brief kurang jelas">
                  <input className="portal-input" value={form.wa} onChange={(e) => set("wa", e.target.value)} />
                </PField>
              </div>
            </div>

            <div>
              <SectionHead no="2" title="Kebutuhan desain" desc="Mau dibuatkan apa, buat kapan, tayang di mana." />
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PField label="Jenis request *">
                  <select className="portal-input" value={form.jenis} onChange={(e) => set("jenis", e.target.value)}>
                    {["Poster", "Feed Instagram", "Live report", "Banner", "Q-Card", "Video / Bumper", "Tiktok", "Lainnya"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </PField>
                <PField label="Deadline konten *">
                  <input type="date" className="portal-input" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                </PField>
              </div>
              <div className="mt-4">
                <PField label="Deskripsi" hint="Kebutuhan apa, untuk kapan, dipost di mana">
                  <textarea className="portal-input" value={form.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} />
                </PField>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PField label="Target tayang">
                  <select className="portal-input" value={form.publish} onChange={(e) => set("publish", e.target.value)}>
                    {["IG Feed", "IG Story", "Tiktok", "Banner cetak", "Q-Card cetak", "Proposal"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </PField>
                <div className="flex items-end pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-[15px] font-bold">
                    <input type="checkbox" className="h-5 w-5 accent-[#ff5a36]" checked={form.cetak} onChange={(e) => set("cetak", e.target.checked)} />
                    Butuh cetak (banner / Q-Card)
                  </label>
                </div>
              </div>
            </div>

            <div>
              <SectionHead no="3" title="Brief" desc="Contoh, warna, ukuran — makin detail makin bagus hasilnya." />
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PField label="Tema / pesan utama">
                  <input className="portal-input" value={form.tema} onChange={(e) => set("tema", e.target.value)} />
                </PField>
                <PField label="Palet warna" hint="cth: pastel">
                  <input className="portal-input" value={form.palet} onChange={(e) => set("palet", e.target.value)} />
                </PField>
                <PField label="Ukuran / format" hint="cth: 4:5 feed, A5 cetak">
                  <input className="portal-input" value={form.ukuran} onChange={(e) => set("ukuran", e.target.value)} />
                </PField>
                <PField label="Referensi" hint="Link moodboard / contoh yang disuka">
                  <input className="portal-input" value={form.referensi} onChange={(e) => set("referensi", e.target.value)} />
                </PField>
              </div>
            </div>

            <div>
              <SectionHead no="4" title="Aset tambahan" desc="Logo, foto, atau materi mentah — taruh di Drive lalu tempel link-nya." />
              <div className="mt-3">
                <PField label="Link aset Drive (opsional)">
                  <input className="portal-input" placeholder="https://drive.google.com/…" value={form.aset} onChange={(e) => set("aset", e.target.value)} />
                </PField>
              </div>
              <div className="mt-4">
                <PField
                  label="Upload file langsung (opsional)"
                  hint={online ? "Maks 5 file @20MB — otomatis masuk Drive Medkom." : "Aktif setelah admin sambungkan sync. Sementara pakai link Drive di atas."}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,video/*"
                    disabled={!online}
                    onChange={(e) => setFiles([...e.target.files].slice(0, 5))}
                    className="portal-input file:mr-3 file:rounded-lg file:border-2 file:border-[#23201a] file:bg-[#FFC42E] file:px-3 file:py-1.5 file:text-[13px] file:font-bold disabled:opacity-50"
                  />
                  {files.length > 0 && (
                    <p className="portal-hint mt-1">{files.length} file dipilih: {files.map((f) => f.name).join(", ")}</p>
                  )}
                </PField>
              </div>
            </div>
          </div>

          <button type="submit" disabled={sending} className="portal-btn portal-btn-coral mt-8 w-full py-3.5 text-[17px] disabled:opacity-60">
            {sending ? "Mengirim…" : <>Kirim request <ArrowRight size={18} weight="bold" /></>}
          </button>
          <p className="portal-hint mt-3 text-center">
            Sudah pernah kirim? <button type="button" className="font-bold text-[#23201a] underline" onClick={() => go("/track/")}>Lacak di sini</button> pakai ID request.
          </p>
        </form>
      </div>
    </PortalShell>
  );
}
