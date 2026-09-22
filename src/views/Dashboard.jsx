import { DotsThree } from "@phosphor-icons/react";
import { Avatar } from "../components/ui.jsx";
import { IssueTypeIcon } from "../components/jira.jsx";
import { daysLeft } from "../lib/store.js";
import { teamMembers } from "../lib/team.js";

function Gadget({ title, children }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-[#E8E8EC] px-4 py-3">
        <p className="font-display text-[15px]">{title}</p>
        <button className="jicon-btn jicon-btn-sm" title="Gadget actions">
          <DotsThree size={18} weight="bold" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function Dashboard({ db }) {
  const t = db.tasks;
  const overdue = t.filter((x) => daysLeft(x.deadline) < 0 && x.status !== "published");
  const needVerify = t.filter((x) => x.status === "verifikasi" || x.status === "masuk");
  const inReview = t.filter((x) => x.status === "review" || x.status === "revisi");
  const published = t.filter((x) => x.status === "published");

  const byMember = teamMembers().map((m) => ({
    name: m,
    active: t.filter((x) => x.pic === m && x.status !== "published" && x.status !== "approved").length,
    done: t.filter((x) => x.pic === m && (x.status === "published" || x.status === "approved")).length,
  })).sort((a, b) => b.active - a.active);
  const maxActive = Math.max(1, ...byMember.map((m) => m.active));

  const upcoming = [...t]
    .filter((x) => x.status !== "published")
    .sort((a, b) => (a.deadline < b.deadline ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="py-5">
      <p className="jcrumb">Medkom 2026</p>
      <h1 className="font-display mt-0.5 text-[32px]">Ringkasan</h1>
      <p className="text-[13px] text-[#6B6B6B]">Yang terlambat, yang menumpuk, dan beban tiap anggota sekilas.</p>

      <div className="mt-4 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          ["Perlu verifikasi", needVerify.length, "Cek di Antrian Masuk"],
          ["Terlambat", overdue.length, "Segera kejar / jadwal ulang"],
          ["Review + Revisi", inReview.length, "Menunggu Admin"],
          ["Terbit", published.length, "Bulan ini"],
        ].map(([label, n, hint]) => (
          <div key={label} className="card card-hover p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">{label}</p>
            <p className="font-display text-[32px] leading-tight">{n}</p>
            <p className="text-[12px] text-[#6B6B6B]">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Gadget title="Beban anggota (garapan aktif)">
          <div className="space-y-2">
            {byMember.map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[13px]">
                <Avatar name={m.name} size={20} />
                <span className="w-16 flex-none truncate sm:w-20">{m.name}</span>
                <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#F4F4F6]">
                  <div className="h-full rounded-full bg-[#6366F1]" style={{ width: `${(m.active / maxActive) * 100}%` }} />
                </div>
                <span className="flex-none text-[11px] text-[#6B6B6B] sm:w-28 sm:text-right sm:text-[12px]">
                  {m.active} aktif · {m.done} selesai
                </span>
              </div>
            ))}
          </div>
        </Gadget>
        <Gadget title="Deadline terdekat">
          {upcoming.map((x) => {
            const dl = daysLeft(x.deadline);
            return (
              <div key={x.id} className="jtable-row flex items-center gap-2 py-3">
                <IssueTypeIcon kind="task" size={16} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px]">{x.title}</p>
                  <p className="jkey">
                    {x.id} · {x.pic} · {x.deadline} {x.cetak && "· cetak"}
                  </p>
                </div>
                  <span className={`text-[12px] font-medium ${dl < 0 ? "text-[#EF4444]" : dl <= 2 ? "text-[#F59E0B]" : "text-[#6B6B6B]"}`}>
                    {dl < 0 ? `Telat ${-dl} hari` : `H-${dl}`}
                  </span>
              </div>
            );
          })}
        </Gadget>
      </div>
    </div>
  );
}
