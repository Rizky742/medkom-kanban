import { useEffect, useRef, useState } from "react";
import {
  ArrowsClockwise,
  CalendarBlank,
  ChartBar,
  FolderOpen,
  Kanban,
  Tray,
  Users,
} from "@phosphor-icons/react";
import { loadDB, saveDB } from "./lib/store.js";
import { getApiUrl, getLastSync, mergeRemote, pullRemote, pushLocal, setApiUrl, setLastSync } from "./lib/api.js";
import { clearSession, getSession, refreshSession } from "./lib/auth.js";
import { Avatar } from "./components/ui.jsx";
import { Logo } from "./components/jira.jsx";
import Login from "./views/Login.jsx";
import PublicRequest from "./views/PublicRequest.jsx";
import Track from "./views/Track.jsx";
import Intake from "./views/Intake.jsx";
import Board from "./views/Board.jsx";
import Calendar from "./views/Calendar.jsx";
import Assets from "./views/Assets.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Team from "./views/Team.jsx";

function parseHash() {
  const h = location.hash.replace(/^#/, "") || "/request";
  return h.split("/").filter(Boolean);
}

function TopBar({ me, isAdmin, onLogout, sync, go }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-[#E8E8EC] bg-white/80 px-4 backdrop-blur">
      <button onClick={() => go("/app/board")} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-[#F4F4F6]">
        <Logo size={26} />
        <span className="font-display text-[15px]">Medkom Tracker</span>
      </button>
      {/* HP: ketuk avatar untuk lihat akun / keluar */}
      <div className="ml-auto flex items-center md:hidden">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full p-0.5 hover:bg-[#F4F4F6]"
          title={me}
        >
          <Avatar name={me} size={28} />
        </button>
        {menuOpen && (
          <>
            <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />
            <div className="jdropdown absolute right-2 top-[52px] z-50 w-60 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#E8E8EC] px-3 py-2.5">
                <Avatar name={me} size={28} />
                <div className="leading-tight">
                  <p className="text-[14px] font-medium">{me}</p>
                  <p className="text-[11px] text-[#6B6B6B]">{isAdmin ? "Admin" : "Anggota"}</p>
                </div>
              </div>
              <div className="space-y-1.5 p-2">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      sync.mode === "online" ? "bg-[#10B981]" : sync.mode === "error" ? "bg-[#EF4444]" : "bg-[#F59E0B]"
                    }`}
                  />
                  <p className="text-[12px] font-medium">
                    {sync.mode === "online" ? "Tersambung" : sync.mode === "error" ? "Sync gagal" : "Mode lokal"}
                  </p>
                  {sync.busy && <ArrowsClockwise size={14} className="animate-spin text-[#6B6B6B]" />}
                </div>
                <p className="px-1 text-[11px] text-[#6B6B6B]">
                  {sync.last
                    ? `Sync ${new Date(sync.last).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                    : "Belum pernah sync"}
                </p>
                <button
                  className="jbtn h-8 w-full text-[13px]"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Keluar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="ml-auto hidden items-center md:flex">
        <Avatar name={me} size={24} />
      </div>
    </header>
  );
}

const SIDE_ITEMS = [
  { id: "board", label: "Papan Tugas", short: "Tugas", icon: Kanban },
  { id: "intake", label: "Antrian Masuk", short: "Antrian", icon: Tray },
  { id: "calendar", label: "Kalender", short: "Kalender", icon: CalendarBlank },
  { id: "assets", label: "Galeri Hasil", short: "Galeri", icon: FolderOpen },
  { id: "dashboard", label: "Ringkasan", short: "Ringkasan", icon: ChartBar },
  { id: "team", label: "Tim & PIN", short: "Tim", icon: Users },
];

/* bottom tab bar khusus HP: jempol gampang jangkau */
function MobileTabBar({ view, go }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E8E8EC] bg-white/80 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-6">
        {SIDE_ITEMS.map(({ id, short, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => go(`/app/${id}`)}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] ${
                active ? "font-medium text-[#6366F1]" : "font-medium text-[#6B6B6B]"
              }`}
            >
              {active && <span className="absolute top-0 h-[3px] w-8 rounded-full bg-[#6366F1]" />}
              <Icon size={22} className={active ? "text-[#6366F1]" : "text-[#9C9C9C]"} />
              {short}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SideBar({ view, go, me, isAdmin, onLogout, sync, onSetup }) {
  return (
    <aside className="hidden w-[240px] flex-none overflow-y-auto border-r border-[#E8E8EC] bg-white md:block">
      <div className="p-3">
        <p className="jnav-section">Planning</p>
        <nav className="space-y-0.5">
          {SIDE_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(`/app/${id}`)} className={`jnav ${view === id ? "active" : ""}`}>
              <Icon size={18} className={view === id ? "text-[#6366F1]" : "text-[#6B6B6B]"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="card mt-4 p-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                sync.mode === "online" ? "bg-[#10B981]" : sync.mode === "error" ? "bg-[#EF4444]" : "bg-[#F59E0B]"
              }`}
            />
            <p className="text-[12px] font-medium">
              {sync.mode === "online" ? "Tersambung" : sync.mode === "error" ? "Sync gagal" : "Mode lokal"}
            </p>
            {sync.busy && <ArrowsClockwise size={14} className="animate-spin text-[#6B6B6B]" />}
          </div>
          <p className="mt-0.5 text-[11px] text-[#6B6B6B]">
            {sync.last
              ? `Sync ${new Date(sync.last).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
              : "Belum pernah sync"}
          </p>
          {sync.mode === "local" && (
            <button className="jlink mt-1.5 text-[11px]" onClick={onSetup}>
              Sambungkan ke Sheets →
            </button>
          )}
        </div>
        <div className="mt-6 border-t border-[#E8E8EC] pt-3">
          <div className="flex items-center gap-2 px-1">
            <Avatar name={me} size={28} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[14px] font-medium">{me}</p>
              <p className="text-[11px] text-[#6B6B6B]">{isAdmin ? "Admin" : "Anggota"}</p>
            </div>
          </div>
          <button onClick={onLogout} className="jbtn mt-2 h-8 w-full text-[13px]">
            Keluar
          </button>
        </div>
      </div>
    </aside>
  );
}

function SyncHelpModal({ onClose, onSaved }) {
  const [url, setUrl] = useState(getApiUrl() || "");
  const [testing, setTesting] = useState(false);
  const [note, setNote] = useState("");

  async function save(test) {
    const u = url.trim();
    if (!u.startsWith("https://script.google.com/")) {
      setNote("URL harus diawali https://script.google.com/");
      return;
    }
    setApiUrl(u);
    if (!test) {
      onSaved();
      return;
    }
    setTesting(true);
    try {
      await pullRemote();
      setNote("Tersambung! Menarik data…");
      setTimeout(onSaved, 500);
    } catch (e) {
      setNote("Gagal: " + e.message + ". Pastikan Deploy > akses Anyone.");
    } finally {
      setTesting(false);
    }
  }

  const steps = [
    "Buka script.google.com → proyek Medkom Tracker (atau New project lalu paste apps-script/Code.gs).",
    "Jalankan setup() sekali → Allow → pilih akun genbiunair26@gmail.com.",
    "Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy.",
    "Copy URL …/exec → tempel di bawah → Tes & Simpan.",
    "Setelah tersambung, data tersinkron otomatis. File ≤20MB, maks 5, terkirim saat online.",
  ];

  return (
    <div className="joverlay" onClick={onClose}>
      <div className="card w-full max-w-[560px] p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-[24px]">Sambungkan ke Sheets + Drive</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-[#6B6B6B]">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="lbl mt-4">URL Web App (/exec)</p>
        <input
          className="input mt-1"
          placeholder="https://script.google.com/macros/s/…/exec"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setNote("");
          }}
        />
        {note && <p className="mt-2 text-[13px] font-medium text-[#6B6B6B]">{note}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button className="jbtn h-8 px-3 text-sm" onClick={onClose}>
            Tutup
          </button>
          <button className="jbtn h-8 px-3 text-sm" disabled={testing} onClick={() => save(false)}>
            Simpan
          </button>
          <button className="btn-pine h-8 px-4 text-sm" disabled={testing} onClick={() => save(true)}>
            {testing ? "Mengetes…" : "Tes & Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [db, setDbState] = useState(() => loadDB());
  const [route, setRoute] = useState(parseHash);
  const [session, setSession] = useState(() => getSession());
  const [sync, setSync] = useState({
    mode: getApiUrl() ? "online" : "local",
    busy: false,
    msg: "",
    last: getLastSync(),
  });
  const [showSyncHelp, setShowSyncHelp] = useState(false);
  const dbRef = useRef(null);
  dbRef.current = db;
  const busyRef = useRef(false);
  const lastPullRef = useRef(0);

  useEffect(() => {
    const fn = () => setRoute(parseHash());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  function applyDb(next) {
    setDbState(next);
    saveDB(next);
  }
  function setDb(next) {
    applyDb(next);
    scheduleAutoPush();
  }
  const pushTimer = useRef(null);
  function scheduleAutoPush() {
    if (!getApiUrl()) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      pushTimer.current = null;
      autoPush();
    }, 2500);
  }
  async function autoPush() {
    if (!getApiUrl() || busyRef.current) return;
    busyRef.current = true;
    setSync((s) => ({ ...s, busy: true }));
    try {
      const remote = await pullRemote();
      const res = await pushLocal(dbRef.current, remote);
      if (res.created || res.updated) {
        const fresh = await pullRemote();
        const merged = mergeRemote(dbRef.current, fresh);
        if (JSON.stringify(merged) !== JSON.stringify(dbRef.current)) applyDb(merged);
      }
      setLastSync(Date.now());
      lastPullRef.current = Date.now();
      setSync((s) => ({ ...s, mode: "online", last: Date.now(), msg: "" }));
    } catch {
      setSync((s) => ({ ...s, mode: getApiUrl() ? "error" : "local", msg: "" }));
    } finally {
      busyRef.current = false;
      setSync((s) => ({ ...s, busy: false }));
    }
  }
  function go(path) {
    if (location.hash === `#${path}`) setRoute(parseHash());
    else location.hash = `#${path}`;
  }

  const me = session?.name;
  const isAdmin = session?.role === "admin";

  // Sinkronisasi senyap: tarik terbaru lalu kirim yang kurang.
  // Dipakai saat buka app, kembali fokus, tiap 30 detik, dan setelah setup.
  async function autoSync() {
    if (!getApiUrl()) {
      setShowSyncHelp(true);
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    setSync((s) => ({ ...s, busy: true }));
    try {
      const remote = await pullRemote();
      const res = await pushLocal(dbRef.current, remote);
      const fresh = res.created || res.updated ? await pullRemote() : remote;
      const merged = mergeRemote(dbRef.current, fresh);
      if (JSON.stringify(merged) !== JSON.stringify(dbRef.current)) applyDb(merged);
      setLastSync(Date.now());
      lastPullRef.current = Date.now();
      setSync((s) => ({ ...s, mode: "online", last: Date.now(), msg: "" }));
    } catch {
      setSync((s) => ({ mode: getApiUrl() ? "error" : "local", busy: false, last: s.last, msg: "" }));
    } finally {
      busyRef.current = false;
      setSync((s) => ({ ...s, busy: false }));
    }
  }

  useEffect(() => {
    if (getApiUrl()) {
      lastPullRef.current = Date.now();
      autoSync();
    }
    const onFocus = () => {
      if (!getApiUrl() || busyRef.current) return;
      if (Date.now() - lastPullRef.current < 15000) return;
      lastPullRef.current = Date.now();
      autoSync();
    };
    const timer = setInterval(() => {
      if (!getApiUrl() || busyRef.current) return;
      if (document.hidden) return;
      lastPullRef.current = Date.now();
      autoSync();
    }, 30000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [view, param] = route[0] === "app" ? [route[1] || "board", null] : [route[0] || "request", route[1]];
  const isPublic = view === "request" || view === "track";

  function logout() {
    clearSession();
    setSession(null);
    go("/request");
  }

  return (
    <div className="flex h-dvh flex-col bg-[#FAFAFA]">
      {!isPublic && session && <TopBar me={me} isAdmin={isAdmin} onLogout={logout} sync={sync} go={go} />}

      {isPublic ? (
        <>
          {view === "request" && <PublicRequest db={db} setDb={setDb} go={go} />}
          {view === "track" && <Track db={db} reqId={param} go={go} />}
        </>
      ) : !session ? (
        <Login onDone={(s) => setSession(s)} go={go} />
      ) : (
        <div className="flex min-h-0 flex-1">
          <SideBar view={view} go={go} me={me} isAdmin={isAdmin} onLogout={logout} sync={sync} onSetup={() => setShowSyncHelp(true)} />
          <main className="mx-auto flex min-h-0 w-full max-w-[1280px] min-w-0 flex-1 flex-col overflow-y-auto px-6 pb-20 md:pb-0">
            {view === "intake" && <Intake db={db} setDb={setDb} me={me} isAdmin={isAdmin} />}
            {(view === "board" || view === undefined) && (
              <Board db={db} setDb={setDb} me={me} isAdmin={isAdmin} />
            )}
            {view === "calendar" && <Calendar db={db} />}
            {view === "assets" && <Assets db={db} setDb={setDb} me={me} isAdmin={isAdmin} />}
            {view === "dashboard" && <Dashboard db={db} />}
            {view === "team" && (
              <Team
                me={me}
                isAdmin={isAdmin}
                onTeamChange={() => setSession(refreshSession())}
              />
            )}
          </main>
        </div>
      )}

      {!isPublic && session && <MobileTabBar view={view} go={go} />}

      {showSyncHelp && (
        <SyncHelpModal
          onClose={() => setShowSyncHelp(false)}
          onSaved={() => {
            setShowSyncHelp(false);
            setSync((s) => ({ ...s, mode: "online", msg: "" }));
            autoSync();
          }}
        />
      )}
    </div>
  );
}
