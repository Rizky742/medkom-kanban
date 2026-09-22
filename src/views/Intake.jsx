import { useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Avatar, DueText, Empty, StatusBadge } from "../components/ui.jsx";
import { IssueTypeIcon } from "../components/jira.jsx";
import IssueDialog from "../components/IssueDialog.jsx";
import { MEMBERS, daysLeft, parentStatus } from "../lib/store.js";

export default function Intake({ db, setDb, me, isAdmin }) {
  const [q, setQ] = useState("");
  const [splitFor, setSplitFor] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [parts, setParts] = useState([{ title: "", pic: MEMBERS[4], deadline: "", cetak: false }]);

  function verify(reqId) {
    const existing = db.tasks.find((t) => t.reqId === reqId);
    if (existing) return;
    const req = db.requests.find((r) => r.id === reqId);
    if (!req) return;
    const task = {
      id: `MDK-${reqId.slice(4)}-A`,
      reqId,
      title: `${req.jenis[0]} ${req.proker}`,
      note: req.publishTarget[0] || "",
      pic: MEMBERS[0],
      deadline: req.deadlineAcara,
      status: "antri",
      cetak: false,
      versi: 1,
      briefLink: "",
      finalLink: "",
      publishLink: "",
      comments: [],
    };
    setDb({ ...db, tasks: [...db.tasks, task], taskSeq: db.taskSeq + 1 });
  }

  function openSplit(req) {
    setSplitFor(req);
    setParts([
      { title: `${req.jenis[0]} ${req.proker} — versi feed`, pic: "Sovia", deadline: req.deadlineAcara, cetak: false },
      { title: `${req.proker} — versi cetak`, pic: "Hannara", deadline: req.deadlineAcara, cetak: true },
    ]);
  }

  function saveSplit() {
    const req = splitFor;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const existing = db.tasks.filter((t) => t.reqId === req.id).length;
    const fresh = parts
      .filter((p) => p.title.trim())
      .map((p, i) => ({
        id: `MDK-${req.id.slice(4)}-${letters[existing + i] || i}`,
        reqId: req.id,
        title: p.title,
        note: req.publishTarget[0] || "",
        pic: p.pic,
        deadline: p.deadline || req.deadlineAcara,
        status: "antri",
        cetak: p.cetak,
        versi: 1,
        briefLink: "",
        finalLink: "",
        publishLink: "",
        comments: [],
      }));
    setDb({ ...db, tasks: [...db.tasks, ...fresh] });
    setSplitFor(null);
  }

  const incoming = [...db.requests]
    .filter((r) => !q || (r.proker + r.id + r.divisi).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="py-5">
      <p className="jcrumb">Medkom 2026</p>
      <h1 className="mt-0.5 text-[24px] font-medium tracking-tight">Antrian Masuk</h1>
      <p className="text-[13px] text-[#626F86]">Request baru dari divisi masuk ke sini. Cek brief-nya, lalu pecah jadi tugas untuk tiap anggota.</p>

      <div className="mt-3 flex items-center gap-2">
        <div className="search-field w-full sm:w-60">
          <MagnifyingGlass size={16} weight="bold" />
          <input
            placeholder="Cari request…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="jkey">{incoming.length} request</span>
      </div>

      <div className="mt-4 space-y-4">
        {incoming.length === 0 && (
          <Empty title="Belum ada request" hint="Request baru dari divisi akan muncul di sini untuk diverifikasi." />
        )}
        {incoming.map((r) => {
          const kids = db.tasks.filter((t) => t.reqId === r.id);
          const ps = parentStatus(r.id, db.tasks);
          return (
            <div key={r.id} className="card overflow-hidden">
              {/* request group header */}
              <div className="flex flex-wrap items-center gap-2 bg-[#FAFBFC] px-3 py-2">
                <IssueTypeIcon kind="story" size={16} />
                <span className="jkey font-medium">{r.id}</span>
                <span className="text-[14px] font-semibold">{r.proker}</span>
                <StatusBadge s={ps} />
                <span className="badge">{r.divisi}</span>
                <span className="badge">{kids.length} tugas</span>
                <span className="ml-auto flex items-center gap-2">
                  <DueText deadline={r.deadlineAcara} dl={daysLeft(r.deadlineAcara)} />
                  {isAdmin && kids.length === 0 && (
                    <button className="jbtn h-8 px-3 text-[13px]" onClick={() => verify(r.id)}>
                      Verifikasi
                    </button>
                  )}
                  {isAdmin && (
                    <button className="btn-pine h-8 px-3 text-[13px]" onClick={() => openSplit(r)}>
                      <Plus size={14} weight="bold" /> Pecah tugas
                    </button>
                  )}
                </span>
              </div>
              <p className="border-t border-[#DCDFE4] px-3 py-2 text-[13px] text-[#44546F]">
                PIC {r.pic} ({r.wa}) · {r.jenis.join(", ")} · {r.deskripsi}
                {r.asetMasuk.length > 0 && (
                  <>
                    {" "}·{" "}
                    <a className="jlink" href={r.asetMasuk[0]} target="_blank" rel="noreferrer">
                      aset masuk
                    </a>
                  </>
                )}
              </p>
              {/* daftar tugas */}
              {kids.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOpenId(t.id)}
                  className="jtable-row flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F7F8FA]"
                >
                  <IssueTypeIcon kind="task" size={16} />
                  <span className="jkey hidden sm:inline">{t.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{t.title}</span>
                  {t.cetak && <span className="badge">cetak</span>}
                  <span className="hidden sm:inline">
                    <DueText deadline={t.deadline} dl={daysLeft(t.deadline)} />
                  </span>
                  <StatusBadge s={t.status} />
                  <Avatar name={t.pic} size={24} />
                </button>
              ))}
              {kids.length === 0 && (
                <p className="px-3 py-3 text-[13px] text-[#626F86]">
                  Belum ada tugas. {isAdmin ? "Klik Verifikasi atau Pecah tugas untuk membagi ke anggota." : "Menunggu verifikasi Admin."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* split dialog */}
      {splitFor && (
        <div className="joverlay" onClick={() => setSplitFor(null)}>
          <div className="card max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-lg p-4 shadow-[0_12px_40px_rgba(9,30,66,0.3)] sm:p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[20px] font-medium">Pecah {splitFor.id}</h2>
            <p className="text-[13px] text-[#626F86]">{splitFor.proker} — 1 kartu = 1 tugas = 1 anggota.</p>
            <div className="mt-4 space-y-3">
              {parts.map((p, i) => (
                <div key={i} className="rounded-lg border border-[#DCDFE4] bg-[#FAFBFC] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold">Tugas {i + 1}</p>
                    <button
                      className="text-[13px] font-medium text-[#AE2E24] hover:underline"
                      onClick={() => setParts(parts.filter((_, j) => j !== i))}
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="mt-2">
                    <p className="lbl">Judul tugas</p>
                    <input
                      className="input mt-1"
                      placeholder="cth: Feed IG WEeBI 2026"
                      value={p.title}
                      onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <p className="lbl">Dikerjakan oleh</p>
                      <select
                        className="input mt-1"
                        value={p.pic}
                        onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, pic: e.target.value } : x)))}
                      >
                        {MEMBERS.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="lbl">Deadline</p>
                      <input
                        type="date"
                        className="input mt-1"
                        value={p.deadline}
                        onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, deadline: e.target.value } : x)))}
                      />
                    </div>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={p.cetak}
                      onChange={(e) => setParts(parts.map((x, j) => (j === i ? { ...x, cetak: e.target.checked } : x)))}
                    />
                    Butuh cetak
                  </label>
                </div>
              ))}
              <button
                className="jbtn h-10 w-full text-[13px] sm:h-8"
                onClick={() => setParts([...parts, { title: "", pic: MEMBERS[0], deadline: splitFor.deadlineAcara, cetak: false }])}
              >
                <Plus size={14} weight="bold" /> Tambah tugas
              </button>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="jbtn h-10 w-full px-4 text-sm sm:h-8 sm:w-auto" onClick={() => setSplitFor(null)}>
                Batal
              </button>
              <button className="btn-pine h-10 w-full px-4 text-sm sm:h-8 sm:w-auto" onClick={saveSplit}>
                Pecah
              </button>
            </div>
          </div>
        </div>
      )}

      {openId && (
        <IssueDialog db={db} setDb={setDb} taskId={openId} onClose={() => setOpenId(null)} me={me} isAdmin={isAdmin} />
      )}
    </div>
  );
}
