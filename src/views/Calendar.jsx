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
    if (t.status === "published") return "bg-[#DFFCF0] text-[#216E4E]";
    if (t.cetak) return "bg-[#FFF1E6] text-[#974F0C]";
    return "bg-[#E9F2FF] text-[#0C66E4]";
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
          <h1 className="text-[24px] font-medium tracking-tight">Kalender</h1>
          <p className="text-[13px] text-[#626F86]">Semua deadline tugas dalam sebulan. {MONTHS[cur.m]} {cur.y}.</p>
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

      <div className="card mt-3 overflow-hidden rounded-[8px]">
        <div className="grid grid-cols-7 border-b border-[#DCDFE4] text-center text-[11px] font-semibold uppercase text-[#626F86]">
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
              className={`min-h-[64px] border-b border-r border-[#DCDFE4] p-1 align-top sm:min-h-[86px] sm:p-1.5 [&:nth-child(7n)]:border-r-0 ${
                day === todayDate && isThisMonth ? "bg-[#E9F2FF]" : ""
              }`}
            >
              {day && (
                <>
                  <p
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
                      day === todayDate && isThisMonth ? "bg-[#0C66E4] font-bold text-white" : "text-[#44546F]"
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
      <p className="mt-2 text-[12px] text-[#626F86]">
        Oranye = butuh cetak (deadline dimajukan H-2 di Backlog). Hijau = published.
      </p>
    </div>
  );
}
