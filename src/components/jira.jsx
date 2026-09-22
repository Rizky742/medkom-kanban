import {
  BookmarkSimple,
  CaretDoubleUp,
  CheckSquare,
  Minus,
} from "@phosphor-icons/react";

/* Blue rounded-square product mark */
export function Logo({ size = 30, letter = "M" }) {
  return (
    <span
      className="inline-flex flex-none items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        background: "#0C66E4",
        borderRadius: 6,
      }}
    >
      {letter}
    </span>
  );
}

/* Jira-style issue type glyphs */
export function IssueTypeIcon({ kind = "task", size = 16 }) {
  if (kind === "story")
    return <BookmarkSimple size={size} weight="fill" color="#36B37E" />;
  return <CheckSquare size={size} weight="fill" color="#2684FF" />;
}

/* Jira-style priority glyphs */
export function PriorityIcon({ level = "medium", size = 14 }) {
  if (level === "highest")
    return <CaretDoubleUp size={size} weight="bold" color="#FF5630" />;
  return <Minus size={size} weight="bold" color="#2684FF" />;
}

const AVATAR_COLORS = [
  "#0C66E4",
  "#1F8456",
  "#6E5DC6",
  "#E56910",
  "#C9372C",
  "#227D9B",
  "#946F00",
  "#C2439B",
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
