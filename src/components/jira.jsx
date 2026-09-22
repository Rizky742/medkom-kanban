import {
  BookmarkSimple,
  CaretDoubleUp,
  CheckSquare,
  Minus,
} from "@phosphor-icons/react";

/* Indigo product mark (Genesis: primary hanya untuk interaktif) */
export function Logo({ size = 30, letter = "M" }) {
  return (
    <span
      className="inline-flex flex-none items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        background: "#6366F1",
        borderRadius: 6,
        fontFamily: "var(--gen-display)",
      }}
    >
      {letter}
    </span>
  );
}

/* Issue type glyphs (Genesis: indigo task, success story) */
export function IssueTypeIcon({ kind = "task", size = 16 }) {
  if (kind === "story")
    return <BookmarkSimple size={size} weight="fill" color="#10B981" />;
  return <CheckSquare size={size} weight="fill" color="#6366F1" />;
}

/* Priority glyphs */
export function PriorityIcon({ level = "medium", size = 14 }) {
  if (level === "highest")
    return <CaretDoubleUp size={size} weight="bold" color="#EF4444" />;
  return <Minus size={size} weight="bold" color="#6366F1" />;
}

const AVATAR_COLORS = [
  "#6366F1",
  "#0A0A0A",
  "#6B6B6B",
  "#10B981",
  "#F59E0B",
  "#4F46E5",
  "#20970B",
  "#9C9C9C",
];

export function avatarColor(name) {
  const s = name || "?";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
