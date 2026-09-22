import { useState } from "react";
import { Avatar, Empty, StatusBadge } from "../components/ui.jsx";
import IssueDialog from "../components/IssueDialog.jsx";

function thumb(seed, w = 600, h = 400) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const FILTERS = [
  { id: "semua", label: "Semua" },
  { id: "review", label: "Review" },
  { id: "revisi", label: "Revisi" },
  { id: "approved", label: "Disetujui" },
  { id: "published", label: "Terbit" },
  { id: "cetak", label: "Butuh cetak" },
];

export default function Assets({ db, setDb, me, isAdmin }) {
  const [filter, setFilter] = useState("semua");
  const [open, setOpen] = useState(null);

  const list = db.tasks.filter((t) =>
    filter === "semua" ? true : filter === "cetak" ? t.cetak : t.status === filter
  );
  const cur = open ? db.tasks.find((t) => t.id === open) : null;

  return (
    <div className="py-5">
      <p className="jcrumb">Medkom 2026</p>
      <div className="mt-0.5 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-medium tracking-tight">Galeri Hasil</h1>
          <p className="text-[13px] text-[#626F86]">Klik gambar untuk memeriksa, meminta revisi, atau menyetujui.</p>
        </div>
        <span className="jkey">{list.length} gambar</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-md px-2.5 py-1 text-[13px] font-medium ${
              filter === f.id ? "bg-[#E9F2FF] text-[#0C66E4]" : "text-[#44546F] hover:bg-[#F1F2F4]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="mt-3">
          <Empty title="Belum ada gambar" hint="Hasil garapan yang masuk review akan muncul di sini." />
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <button key={t.id} onClick={() => setOpen(t.id)} className="card overflow-hidden text-left hover:bg-[#FAFBFC]">
            <img src={thumb(t.id, 600, 340)} alt={t.title} className="h-36 w-full object-cover" loading="lazy" />
            <div className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="jkey font-medium">{t.id}</span>
                <StatusBadge s={t.status} />
              </div>
              <p className="mt-1 text-[14px] font-medium leading-snug">{t.title}</p>
              <div className="mt-2 flex items-center gap-2 text-[12px] text-[#626F86]">
                <Avatar name={t.pic} size={20} /> {t.pic} · v{t.versi} {t.cetak && "· cetak"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {cur && (
        <IssueDialog
          db={db}
          setDb={setDb}
          taskId={cur.id}
          onClose={() => setOpen(null)}
          me={me}
          isAdmin={isAdmin}
          mode="asset"
          preview={thumb(cur.id, 900, 500)}
        />
      )}
    </div>
  );
}
