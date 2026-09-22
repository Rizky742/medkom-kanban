import { useState } from "react";
import { ArrowRight, CheckCircle, Ticket } from "@phosphor-icons/react";
import PortalShell from "../portal/PortalShell.jsx";
import { STATUSES, daysLeft, parentStatus } from "../lib/store.js";

const LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
const PILL = {
  masuk: { bg: "#E9E2D2", fg: "#23201A" },
  verifikasi: { bg: "#FFC42E", fg: "#23201A" },
  antri: { bg: "#E9E2D2", fg: "#23201A" },
  dikerjakan: { bg: "#A9D3F2", fg: "#23201A" },
  review: { bg: "#A9D3F2", fg: "#23201A" },
  revisi: { bg: "#FF5A36", fg: "#FFFFFF" },
  approved: { bg: "#0E7C6B", fg: "#FFFFFF" },
  published: { bg: "#0E7C6B", fg: "#FFFFFF" },
};

function Pill({ s }) {
  const c = PILL[s] || PILL.masuk;
  return (
    <span className="portal-pill" style={{ background: c.bg, color: c.fg }}>
      {LABEL[s] || s}
    </span>
  );
}

const STEPS = ["masuk", "verifikasi", "antri", "dikerjakan", "review", "approved", "published"];

export default function Track({ db, reqId, go }) {
  const [q, setQ] = useState(reqId || "");
  const req = db.requests.find((r) => r.id.toLowerCase() === (q || "").trim().toLowerCase());
  const kids = req ? db.tasks.filter((t) => t.reqId === req.id) : [];
  const ps = req ? parentStatus(req.id, db.tasks) : null;
  const stepIdx = ps ? STEPS.indexOf(ps === "revisi" ? "review" : ps) : -1;
  const dl = req ? daysLeft(req.deadlineAcara) : 0;

  return (
    <PortalShell go={go}>
      <div className="mx-auto max-w-[680px] px-4">
        <div className="py-10 text-center">
          <span className="portal-chip portal-chip-sun">
            <Ticket size={15} weight="bold" /> Tanpa login
          </span>
          <h1 className="portal-display mt-4 text-[38px] sm:text-[48px]">Lacak request</h1>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] font-medium text-[#6e6257]">
            Masukkan ID request dari tiketmu (contoh <b>REQ-014</b>) buat lihat progresnya.
          </p>
          <form
            className="mx-auto mt-5 flex max-w-[480px] gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(q);
            }}
          >
            <input
              className="portal-input portal-input-lg text-center text-[17px] font-bold uppercase"
              placeholder="REQ-014"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          {!req && db.requests.length > 0 && (
            <p className="portal-hint mt-3">
              Coba:{" "}
              {db.requests.slice(0, 3).map((r) => (
                <button key={r.id} className="mx-1 font-bold text-[#23201a] underline" onClick={() => setQ(r.id)}>
                  {r.id}
                </button>
              ))}
            </p>
          )}
          {!req && db.requests.length === 0 && (
            <p className="portal-hint mt-3">Belum ada request masuk. Buat dulu lewat halaman Request.</p>
          )}
        </div>

        {req && (
          <div className="portal-card overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="portal-display text-[30px]">{req.id}</span>
                <Pill s={ps} />
                <span className={`ml-auto text-[13px] font-bold ${dl < 0 ? "text-[#c22f1c]" : "text-[#6e6257]"}`}>
                  {dl < 0 ? `Telat ${Math.abs(dl)} hari` : `Deadline ${req.deadlineAcara}`}
                </span>
              </div>
              <p className="mt-1 text-[19px] font-extrabold">{req.proker}</p>
              <p className="portal-hint">
                {req.divisi} · PIC {req.pic} · {req.jenis.join(", ")}
              </p>

              <div className="mt-5 flex gap-1">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex-1 text-center">
                    <div
                      className="h-2.5 rounded-full border-2 border-[#23201a]"
                      style={{ background: i <= stepIdx ? "#0e7c6b" : "#fff" }}
                    />
                    <p className={`mt-1 hidden text-[10px] font-bold sm:block ${i <= stepIdx ? "" : "text-[#a89c87]"}`}>
                      {LABEL[s]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ticket-dash" />

            <div className="p-5 sm:p-6">
              <p className="text-[13px] font-extrabold uppercase tracking-widest text-[#6e6257]">
                Isi request ({kids.length})
              </p>
              <div className="mt-3 space-y-2.5">
                {kids.length === 0 && (
                  <p className="text-[14px] font-medium text-[#6e6257]">
                    Request diterima dan menunggu dicek tim Medkom. Cek lagi nanti ya.
                  </p>
                )}
                {kids.map((t) => (
                  <div key={t.id} className="rounded-2xl border-2 border-[#23201a] bg-[#fffdf6] p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-extrabold text-[#6e6257]">{t.id}</span>
                      <Pill s={t.status} />
                      {t.cetak && <span className="portal-pill bg-white">Butuh cetak</span>}
                    </div>
                    <p className="mt-1 text-[15px] font-bold">{t.title}</p>
                    <p className="portal-hint">
                      Dikerjakan {t.pic} · tenggat {t.deadline} · v{t.versi}
                    </p>
                    {(t.comments || []).map((c, i) => (
                      <p key={i} className="mt-1.5 rounded-xl bg-[#f3e8d3] px-3 py-2 text-[13px] font-medium">
                        Catatan Medkom: {c.text}
                      </p>
                    ))}
                    {t.status === "published" && t.publishLink && (
                      <a
                        href={t.publishLink}
                        target="_blank"
                        rel="noreferrer"
                        className="portal-btn mt-2.5 px-4 py-2 text-[13px]"
                      >
                        <CheckCircle size={15} weight="bold" /> Lihat hasil tayang <ArrowRight size={14} weight="bold" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="ticket-dash my-5" />
              <div className="ticket-barcode" />
              <p className="portal-display mt-2 text-center text-[22px] tracking-[0.2em]">{req.code}</p>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
