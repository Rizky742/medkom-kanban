import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Avatar, DueText, Empty } from "../components/ui.jsx";
import { IssueTypeIcon, PriorityIcon } from "../components/jira.jsx";
import IssueDialog from "../components/IssueDialog.jsx";
import { BOARD_COLS, STATUSES, daysLeft } from "../lib/store.js";
import { teamMembers } from "../lib/team.js";

const COL_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));

export default function Board({ db, setDb, me, isAdmin }) {
  const [q, setQ] = useState("");
  const [fPic, setFPic] = useState("Semua");
  const [openId, setOpenId] = useState(null);
  const members = teamMembers();

  /* drag kartu cuma untuk mouse; di HP, jari dipakai buat swipe */
  const canDrag =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: fine)").matches;

  function move(id, status) {
    setDb({ ...db, tasks: db.tasks.map((t) => (t.id === id ? { ...t, status } : t)) });
  }

  /* Drag khusus layar sentuh: tahan kartu ±350ms untuk mengangkat,
     geser ke kolom tujuan, lepas untuk menaruh. */
  const scrollRef = useRef(null);
  const touchDrag = useRef(null);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    function cleanup() {
      const d = touchDrag.current;
      if (!d) return;
      clearTimeout(d.timer);
      d.clone?.remove();
      scroller.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      scroller.querySelectorAll(".dragging-src").forEach((el) => el.classList.remove("dragging-src"));
      touchDrag.current = null;
    }

    function beginDrag() {
      const d = touchDrag.current;
      if (!d) return;
      d.dragging = true;
      try {
        navigator.vibrate?.(40);
      } catch {
        /* abaikan */
      }
      const c = d.src.cloneNode(true);
      c.style.cssText =
        `position:fixed;left:${d.startX - d.grabDX}px;top:${d.startY - d.grabDY}px;` +
        `width:${d.w}px;z-index:9999;pointer-events:none;opacity:.96;margin:0;` +
        `transform:rotate(2deg) scale(1.02);box-shadow:0 12px 28px rgba(9,30,66,.35);`;
      document.body.appendChild(c);
      d.clone = c;
      d.src.classList.add("dragging-src");
    }

    function setTarget(colEl) {
      const d = touchDrag.current;
      if (!d) return;
      const id = colEl?.dataset?.col || null;
      if (d.targetCol === id) return;
      d.targetCol = id;
      scroller.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
      colEl?.classList.add("drag-over");
    }

    function onStart(e) {
      if (e.touches.length !== 1) return;
      const card = e.target.closest("[data-card-id]");
      if (!card) return;
      const t = e.touches[0];
      const rect = card.getBoundingClientRect();
      touchDrag.current = {
        id: card.dataset.cardId,
        src: card,
        startX: t.clientX,
        startY: t.clientY,
        grabDX: t.clientX - rect.left,
        grabDY: t.clientY - rect.top,
        w: rect.width,
        dragging: false,
        targetCol: null,
        clone: null,
        timer: setTimeout(beginDrag, 350),
      };
    }

    function onMove(e) {
      const d = touchDrag.current;
      if (!d) return;
      const t = e.touches[0];
      if (!d.dragging) {
        // geser cepat = niat scroll, batalkan drag
        if (Math.hypot(t.clientX - d.startX, t.clientY - d.startY) > 12) {
          clearTimeout(d.timer);
          touchDrag.current = null;
        }
        return;
      }
      e.preventDefault(); // kunci scroll selama drag
      d.clone.style.left = `${t.clientX - d.grabDX}px`;
      d.clone.style.top = `${t.clientY - d.grabDY}px`;
      const under = document.elementFromPoint(t.clientX, t.clientY);
      setTarget(under?.closest?.("[data-col]"));
      // auto-scroll saat jari di tepi
      const r = scroller.getBoundingClientRect();
      if (t.clientX < r.left + 56) scroller.scrollLeft -= 14;
      else if (t.clientX > r.right - 56) scroller.scrollLeft += 14;
    }

    function onEnd() {
      const d = touchDrag.current;
      if (!d) return;
      clearTimeout(d.timer);
      if (d.dragging && d.targetCol) {
        move(d.id, d.targetCol);
        try {
          navigator.vibrate?.(20);
        } catch {
          /* abaikan */
        }
      }
      cleanup();
    }

    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.tasks]);

  const list = db.tasks.filter(
    (t) =>
      (!q || (t.title + t.id + t.reqId).toLowerCase().includes(q.toLowerCase())) &&
      (fPic === "Semua" || t.pic === fPic)
  );

  return (
    <div className="flex h-full min-h-0 flex-col py-5">
      <p className="jcrumb">Medkom 2026</p>
      <h1 className="font-display mt-0.5 text-[32px]">Papan Tugas</h1>
      <p className="hidden text-[13px] text-[#6B6B6B] sm:block">Geser kartu ke kanan kalau progres berubah. Klik kartu untuk detail dan komentar.</p>
      <p className="text-[13px] text-[#6B6B6B] sm:hidden">Tahan kartu untuk menggeser antar kolom, ketuk untuk detail & komentar.</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="search-field w-full sm:w-60">
          <MagnifyingGlass size={16} weight="bold" />
          <input
            placeholder="Cari tugas…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="search-kbd">⌘K</span>
        </div>
        <select className="input input-inline text-[13px]" value={fPic} onChange={(e) => setFPic(e.target.value)}>
          <option value="Semua">Semua anggota</option>
          {members.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <span className="jkey">{list.length} tugas</span>
      </div>

      {list.length === 0 && (
        <div className="mt-4">
          <Empty title="Tidak ada tugas" hint="Pecah request di Antrian Masuk dulu." />
        </div>
      )}

      <div ref={scrollRef} className="scroll-thin mt-3 flex min-h-0 flex-1 items-start gap-5 overflow-x-auto pb-2 max-sm:snap-x">
        {BOARD_COLS.map((col) => {
          const items = list.filter((t) =>
            t.status === col || (col === "antri" && (t.status === "verifikasi" || t.status === "masuk"))
          );
          return (
            <div
              key={col}
              data-col={col}
              className="kanban-col jcol flex max-h-full w-[78vw] max-w-[300px] flex-none flex-col p-2 sm:w-[272px] max-sm:snap-start"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("drag-over");
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("drag-over");
                const id = e.dataTransfer.getData("text/plain");
                if (id) move(id, col);
              }}
            >
              <p className="flex items-center justify-between px-1.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">
                {COL_LABEL[col]} <span className="badge badge-solid">{items.length}</span>
              </p>
              <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
                {items.map((t) => {
                  const dl = daysLeft(t.deadline);
                  return (
                    <div
                      key={t.id}
                      data-card-id={t.id}
                      draggable={canDrag}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                      onClick={() => setOpenId(t.id)}
                      className="jcard p-3"
                    >
                      <p className="text-[15px] leading-snug">{t.title}</p>
                      {t.cetak && (
                        <p className="mt-1">
                          <span className="badge">cetak</span>
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        <IssueTypeIcon kind="task" size={16} />
                        <span className="jkey">{t.id}</span>
                        <span className="ml-auto">
                          <PriorityIcon level={t.cetak ? "highest" : "medium"} />
                        </span>
                        <Avatar name={t.pic} size={24} />
                      </div>
                      {(dl < 0 || dl <= 2) && (
                        <div className="mt-1.5">
                          <DueText deadline={t.deadline} dl={dl} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {openId && (
        <IssueDialog db={db} setDb={setDb} taskId={openId} onClose={() => setOpenId(null)} me={me} isAdmin={isAdmin} mode="task" />
      )}
    </div>
  );
}
