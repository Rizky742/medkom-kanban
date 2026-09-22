import { useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function Calendar({ db }) {
  const today = new Date();
  const [cur, setCur] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const isThisMonth = cur.y === today.getFullYear() && cur.m === today.getMonth();
  const todayDate = today.getDate();
  const first = new Date(cur.y, cur.m, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const byDay = {};
  db.tasks.forEach((t) => {
    if (!t.deadline) return;
    const d = new Date(t.deadline + "T00:00:00");
    if (isNaN(d.getTime())) return;
    if (d.getFullYear() === cur.y && d.getMonth() === cur.m) {
      const k = d.getDate();
      (byDay[k] = byDay[k] || []).push(t);
    }
  });

  function pill(t) {
    if (t.status === "published") return "bg-[#e8f8f1] text-[#0c7a55]";
    if (t.status === "revisi") return "bg-[#fdecec] text-[#c0362c]";
    if (t.cetak) return "bg-[#fef5e2] text-[#9a6b0a]";
    return "bg-[#eef0ff] text-[#4f46e5]";
  }

  function shiftMonth(delta) {
    setCur((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <div className="py-5">
      <p className="jcrumb">Medkom 2026</p>
      <div className="mt-0.5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-[32px]">Kalender</h1>
          <p className="text-[13px] text-[#6B6B6B]">Semua deadline tugas dalam sebulan. {MONTHS[cur.m]} {cur.y}.</p>
        </div>
        <div className="flex gap-1">
          <button className="jbtn h-8 px-3 text-[13px]" onClick={() => shiftMonth(-1)}>
            ← Prev
          </button>
          <button
            className="jbtn h-8 px-3 text-[13px]"
            onClick={() => setCur({ y: today.getFullYear(), m: today.getMonth() })}
          >
            Hari ini
          </button>
          <button className="jbtn h-8 px-3 text-[13px]" onClick={() => shiftMonth(1)}>
            Next →
          </button>
        </div>
      </div>

      <div className="card mt-3 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#E8E8EC] text-center text-[11px] font-medium uppercase text-[#6B6B6B]">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => (
            <div
              key={i}
              className={`min-h-[64px] border-b border-r border-[#E8E8EC] p-1 align-top sm:min-h-[86px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${
                day === todayDate && isThisMonth ? "bg-[#eef0ff]" : ""
              }`}
            >
              {day && (
                <>
                  <p
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
                      day === todayDate && isThisMonth ? "bg-[#6366F1] font-medium text-white" : "text-[#6B6B6B]"
                    }`}
                  >
                    {day}
                  </p>
                  <div className="mt-1 space-y-1">
                    {(byDay[day] || []).slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        title={`${t.id} ${t.title} — ${t.pic}`}
                        className={`truncate rounded-[3px] px-1 py-0.5 text-[10px] font-medium sm:px-1.5 sm:text-[12px] ${pill(t)}`}
                      >
                        {t.id} · {t.title.slice(0, 22)}
                      </div>
                    ))}
                    {(byDay[day] || []).length > 3 && (
                      <p className="text-[11px] text-[#626F86]">+{(byDay[day] || []).length - 3} lagi</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[12px] text-[#6B6B6B]">
        Kuning = butuh cetak. Hijau = terbit. Merah = revisi.
      </p>
    </div>
  );
}
