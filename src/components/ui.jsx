import { Tray } from "@phosphor-icons/react";
import { avatarColor, initials } from "./jira.jsx";

/* Jira-style round avatar, color hashed per user */
export function Avatar({ name, size = 24 }) {
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full font-bold text-white"
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: size <= 24 ? 10 : 12,
        background: avatarColor(name),
      }}
    >
      {initials(name)}
    </span>
  );
}

const STATUS_LOZ = {
  masuk: "jloz-gray",
  verifikasi: "jloz-yellow",
  antri: "jloz-gray",
  dikerjakan: "jloz-blue",
  review: "jloz-blue",
  revisi: "jloz-red",
  approved: "jloz-green",
  published: "jloz-green",
};

const STATUS_LABEL = {
  masuk: "Masuk",
  verifikasi: "Cek brief",
  antri: "Antri",
  dikerjakan: "Dikerjakan",
  review: "Review",
  revisi: "Revisi",
  approved: "Disetujui",
  published: "Terbit",
};

export function StatusBadge({ s }) {
  return <span className={`jloz ${STATUS_LOZ[s] || "jloz-gray"}`}>{STATUS_LABEL[s] || s}</span>;
}

/* Jira shows due dates as plain text: red when overdue */
export function DueText({ deadline, dl }) {
  if (dl < 0)
    return <span className="text-[12px] font-semibold text-[#AE2E24]">Telat {Math.abs(dl)} hari</span>;
  if (dl <= 2)
    return <span className="text-[12px] font-semibold text-[#974F0C]">Tenggat H-{dl}</span>;
  return <span className="text-[12px] text-[#626F86]">{deadline}</span>;
}

export function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="lbl">
        {label} {required && <span className="text-[#C9372C]">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[12px] text-[#626F86]">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function Empty({ title, hint }) {
  return (
    <div className="card p-6 text-center">
      <Tray size={28} weight="duotone" className="mx-auto text-[#626F86]" />
      <p className="mt-2 text-[15px] font-semibold">{title}</p>
      <p className="mt-1 text-[13px] text-[#626F86]">{hint}</p>
    </div>
  );
}

/* URL aman untuk <a href>: hanya http/https, tolak javascript:/data:/vbscript:.
 * Dipakai karena link (aset, final, publish) bisa diisi user via form publik. */
export function safeHref(u) {
  const s = String(u || "").trim();
  if (!s) return null;
  if (/^(https?:\/\/|mailto:)/i.test(s)) return s;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s)) return `https://${s}`;
  return null;
}
