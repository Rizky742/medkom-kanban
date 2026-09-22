import { useState } from "react";
import { DotsThree, X } from "@phosphor-icons/react";
import { Avatar, StatusBadge, safeHref } from "./ui.jsx";
import { IssueTypeIcon } from "./jira.jsx";
import { BOARD_COLS, STATUSES, daysLeft } from "../lib/store.js";
import { teamMembers } from "../lib/team.js";

const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
const STATUS_LOZ = {
  antri: "jloz-gray",
  dikerjakan: "jloz-blue",
  review: "jloz-blue",
  revisi: "jloz-red",
  approved: "jloz-green",
  published: "jloz-green",
};

/**
 * Jira-style issue dialog.
 * mode="task" (Board/Backlog): status, assignee, version bump, add comment.
 * mode="asset" (Assets proofing): approve/revise/published, comments read-only.
 */
export default function IssueDialog({ db, setDb, taskId, onClose, me, isAdmin, preview, mode = "task" }) {
  const task = db.tasks.find((t) => t.id === taskId);
  const [comment, setComment] = useState("");

  if (!task) return null;
  const req = db.requests.find((r) => r.id === task.reqId);
  const isAsset = mode === "asset";
  const asetHref = safeHref(req?.asetMasuk?.[0]);
  const finalHref = safeHref(task.finalLink);
  const publishHref = safeHref(task.publishLink);
  const members = teamMembers();

  function patch(p) {
    setDb({ ...db, tasks: db.tasks.map((t) => (t.id === task.id ? { ...t, ...p } : t)) });
  }
  function addComment() {
    if (!comment.trim()) return;
    const d = new Date();
    const stamp = `${d.getDate()}/${d.getMonth() + 1}`;
    patch({ comments: [...(task.comments || []), { by: me, text: comment.trim(), at: stamp }] });
    setComment("");
  }

  return (
    <div className="joverlay" onClick={onClose}>
      <div
        className="card max-h-full w-full max-w-[980px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-5 pt-4">
          <IssueTypeIcon kind="task" size={16} />
          <span className="jkey font-medium">{task.id}</span>
          <span className="jkey">/ {task.reqId}</span>
          <div className="ml-auto flex items-center">
            <button className="jicon-btn" title="Actions">
              <DotsThree size={20} weight="bold" />
            </button>
            <button className="jicon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pt-1">
          <h2 className="font-display px-2 text-[24px]">{task.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
            {isAsset && !isAdmin ? (
              <StatusBadge s={task.status} />
            ) : (
              <select
                value={task.status}
                onChange={(e) => patch({ status: e.target.value })}
                className={`jloz cursor-pointer ${STATUS_LOZ[task.status]}`}
                style={{ appearance: "auto" }}
              >
                {BOARD_COLS.map((s) => (
                  <option key={s} value={s} disabled={!isAdmin && (s === "approved" || s === "published")}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            )}
            <StatusBadge s={task.status} />
          </div>
        </div>

        <div className="grid gap-6 px-5 pb-5 pt-4 md:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            {preview && (
              <img src={preview} alt={task.title} className="mb-4 w-full rounded-[12px] border border-[#E8E8EC] object-cover" />
            )}
            <p className="lbl">Deskripsi & brief</p>
            <div className="mt-1 text-[15px]">
              <p>{req?.deskripsi || "—"}</p>
              <p className="mt-2 text-[#6B6B6B]">
                Brief: {[req?.brief?.tema, req?.brief?.palet, req?.brief?.ukuran].filter(Boolean).join(" · ") || "—"}
              </p>
              {asetHref && (
                <p className="mt-1">
                  <a className="jlink" href={asetHref} target="_blank" rel="noreferrer noopener">
                    Aset masuk dari pemohon
                  </a>
                </p>
              )}
              <p className="mt-1 text-[#6B6B6B]">
                Hasil akhir:{" "}
                {finalHref ? (
                  <a className="jlink" href={finalHref} target="_blank" rel="noreferrer noopener">
                    buka Drive
                  </a>
                ) : (
                  "belum ada"
                )}
                {" · "}Link tayang:{" "}
                {publishHref ? (
                  <a className="jlink" href={publishHref} target="_blank" rel="noreferrer noopener">
                    lihat
                  </a>
                ) : (
                  "belum tayang"
                )}
              </p>
            </div>

            <p className="lbl mt-5">Komentar</p>
            <div className="mt-2 space-y-3">
              {(task.comments || []).map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Avatar name={c.by} size={32} />
                  <div className="min-w-0">
                    <p className="text-[15px]">
                      <span className="font-medium">{c.by}</span>{" "}
                      <span className="text-[12px] text-[#9C9C9C]">{c.at}</span>
                    </p>
                    <p className="mt-0.5 text-[15px]">{c.text}</p>
                  </div>
                </div>
              ))}
              {!isAsset && (
                <div className="flex gap-2">
                  <Avatar name={me} size={32} />
                  <div className="flex-1">
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Tulis komentar…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="mt-2 flex gap-2">
                      <button className="btn-pine h-8 px-3 text-sm" onClick={addComment}>
                        Simpan
                      </button>
                      <button className="jbtn h-8 px-3 text-sm" onClick={() => setComment("")}>
                        Batal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="rounded-[8px] border border-[#E8E8EC] bg-[#FAFAFA] px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">
              Detail
            </p>
            <div>
              <p className="lbl">Dikerjakan oleh</p>
              {isAsset ? (
                <p className="mt-1 text-[14px]">{task.pic}</p>
              ) : (
              <select
                className="input mt-1 text-[13px]"
                value={task.pic}
                  disabled={!isAdmin}
                  onChange={(e) => patch({ pic: e.target.value })}
                >
                  {members.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <p className="lbl">Pemohon</p>
              <p className="mt-1 text-[14px]">
                {req?.divisi} · {req?.pic}
              </p>
            </div>
            <div>
              <p className="lbl">Keterangan</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {task.cetak && <span className="badge">cetak</span>}
                <span className="badge">{task.note}</span>
                <span className="badge">v{task.versi}</span>
              </div>
            </div>
            <div>
              <p className="lbl">Deadline</p>
              <p className="mt-1 text-[14px]">
                {task.deadline} (H-{daysLeft(task.deadline)}){task.cetak && " · butuh cetak"}
              </p>
            </div>
            <div>
              <p className="lbl">Dari request</p>
              <p className="mt-1 text-[13px]">
                <span className="jkey">{req?.id}</span> {req?.proker}
              </p>
            </div>
            {!isAsset && (
              <button className="jlink text-[13px]" onClick={() => patch({ versi: task.versi + 1 })}>
                Naikkan versi (v{task.versi} → v{task.versi + 1})
              </button>
            )}
            {!isAdmin && (
              <p className="text-[12px] text-[#6B6B6B]">Hanya Admin yang bisa menyetujui hasil akhir.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
