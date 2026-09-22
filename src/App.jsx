import { useEffect, useRef, useState } from "react";
import {
  ArrowsClockwise,
  CalendarBlank,
  ChartBar,
  FolderOpen,
  Kanban,
  Tray,
} from "@phosphor-icons/react";
import { loadDB, loadDemoDB, resetDB, saveDB } from "./lib/store.js";
import { getApiUrl, getLastSync, mergeRemote, pullRemote, pushLocal, setApiUrl, setLastSync } from "./lib/api.js";
import { clearSession, getSession } from "./lib/auth.js";
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

function parseHash() {
  const h = location.hash.replace(/^#/, "") || "/request";
  return h.split("/").filter(Boolean);
}

function TopBar({ me, isAdmin, onLogout, onSync, sync, go }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-[#DCDFE4] bg-white px-3">
      <button onClick={() => go("/app/board")} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-[#F1F2F4]">
        <Logo size={26} />
        <span className="text-[15px] font-semibold tracking-tight">Medkom Tracker</span>
      </button>
      {/* HP: ketuk avatar untuk lihat akun / keluar */}
      <div className="ml-auto flex items-center md:hidden">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-full p-0.5 hover:bg-[#F1F2F4]"
          title={me}
        >
          <Avatar name={me} size={28} />
        </button>
        {menuOpen && (
          <>
            <button className="fixed inset-0 z-40 cursor-default" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />
            <div className="absolute right-2 top-[52px] z-50 w-60 overflow-hidden rounded-lg border border-[#DCDFE4] bg-white shadow-[0_8px_24px_rgba(9,30,66,0.25)]">
              <div className="flex items-center gap-2 border-b border-[#DCDFE4] px-3 py-2.5">
                <Avatar name={me} size={28} />
                <div className="leading-tight">
                  <p className="text-[14px] font-semibold">{me}</p>
                  <p className="text-[11px] text-[#626F86]">{isAdmin ? "Admin" : "Anggota"}</p>
                </div>
              </div>
              <div className="space-y-1.5 p-2">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      sync.mode === "online" ? "bg-[#1F8456]" : sync.mode === "error" ? "bg-[#C9372C]" : "bg-[#E2A63D]"
                    }`}
                  />
                  <p className="text-[12px] font-semibold">
                    {sync.mode === "online" ? "Tersambung" : sync.mode === "error" ? "Sync gagal" : "Mode lokal"}
                  </p>
                  {sync.busy && <ArrowsClockwise size={14} className="animate-spin text-[#626F86]" />}
                </div>
                <p className="px-1 text-[11px] text-[#626F86]">
                  {sync.last
                    ? `Terakhir: ${new Date(sync.last).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                    : "Belum pernah sync"}
                  {sync.msg ? ` · ${sync.msg}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    className="jbtn h-8 text-[13px]"
                    disabled={sync.busy}
                    onClick={() => {
                      setMenuOpen(false);
                      onSync("pull");
                    }}
                  >
                    Tarik
                  </button>
                  <button
                    className="jbtn h-8 text-[13px]"
                    disabled={sync.busy}
                    onClick={() => {
                      setMenuOpen(false);
                      onSync("push");
                    }}
                  >
                    Kirim
                  </button>
                </div>
                <p className="px-1 text-[11px] text-[#626F86]">Otomatis sync saat online.</p>
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
];

/* bottom tab bar khusus HP: jempol gampang jangkau */
function MobileTabBar({ view, go }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[#DCDFE4] bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {SIDE_ITEMS.map(({ id, short, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => go(`/app/${id}`)}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] ${
                active ? "font-semibold text-[#0C66E4]" : "font-medium text-[#626F86]"
              }`}
            >
              {active && <span className="absolute top-0 h-[3px] w-8 rounded-full bg-[#0C66E4]" />}
              <Icon size={22} className={active ? "text-[#0C66E4]" : "text-[#626F86]"} />
              {short}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SideBar({ view, go, me, isAdmin, onLogout, sync, onSync, onSetup }) {
  return (
    <aside className="hidden w-[240px] flex-none overflow-y-auto border-r border-[#DCDFE4] bg-[#FAFBFC] md:block">
      <div className="p-3">
        <div className="flex items-center gap-2 px-1 py-1">
          <Logo size={24} />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold">Medkom 2026</p>
            <p className="text-[11px] text-[#626F86]">Proyek tim</p>
          </div>
        </div>
        <p className="jnav-section">Planning</p>
        <nav className="space-y-0.5">
          {SIDE_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => go(`/app/${id}`)} className={`jnav ${view === id ? "active" : ""}`}>
              <Icon size={18} className={view === id ? "text-[#0C66E4]" : "text-[#44546F]"} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-4 rounded-lg border border-[#DCDFE4] bg-white p-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                sync.mode === "online" ? "bg-[#1F8456]" : sync.mode === "error" ? "bg-[#C9372C]" : "bg-[#E2A63D]"
              }`}
            />
            <p className="text-[12px] font-semibold">
              {sync.mode === "online" ? "Tersambung" : sync.mode === "error" ? "Sync gagal" : "Mode lokal"}
            </p>
            {sync.busy && <ArrowsClockwise size={14} className="animate-spin text-[#626F86]" />}
          </div>
          <p className="mt-0.5 text-[11px] text-[#626F86]">
            {sync.last
              ? `Terakhir: ${new Date(sync.last).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
              : "Belum pernah sync"}
            {sync.msg ? ` · ${sync.msg}` : ""}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button className="jbtn h-8 text-[12px]" disabled={sync.busy} onClick={() => onSync("pull")}>
              Tarik
            </button>
            <button className="jbtn h-8 text-[12px]" disabled={sync.busy} onClick={() => onSync("push")}>
              Kirim
            </button>
          </div>
          {sync.mode === "local" && (
            <button className="jlink mt-1.5 text-[11px]" onClick={onSetup}>
              Sambungkan ke Sheets →
            </button>
          )}
          {sync.mode !== "local" && (
            <p className="mt-1.5 text-[11px] text-[#626F86]">Otomatis kirim & tarik saat online.</p>
          )}
        </div>
        <div className="mt-6 border-t border-[#DCDFE4] pt-3">
          <div className="flex items-center gap-2 px-1">
            <Avatar name={me} size={28} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[14px] font-semibold">{me}</p>
              <p className="text-[11px] text-[#626F86]">{isAdmin ? "Admin" : "Anggota"}</p>
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
    "Tarik = ambil data Sheets · Kirim = kirim data lokal. File ≤20MB, maks 5, terkirim saat online.",
  ];

  return (
    <div className="joverlay" onClick={onClose}>
      <div className="card w-full max-w-[560px] rounded-lg p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[20px] font-medium">Sambungkan ke Sheets + Drive</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-[#44546F]">
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
        {note && <p className="mt-2 text-[13px] font-medium text-[#44546F]">{note}</p>}
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
    try {
      const remote = await pullRemote();
      const res = await pushLocal(dbRef.current, remote);
      if (res.created || res.updated) {
        const fresh = await pullRemote();
        const merged = mergeRemote(dbRef.current, fresh);
        if (JSON.stringify(merged) !== JSON.stringify(dbRef.current)) applyDb(merged);
        setLastSync(Date.now());
        setSync((s) => ({ ...s, mode: "online", last: Date.now(), msg: `oto: +${res.created} req · ~${res.updated} tugas` }));
      }
    } catch (e) {
      setSync((s) => ({ ...s, mode: getApiUrl() ? "error" : "local", msg: "gagal: " + e.message }));
    } finally {
      busyRef.current = false;
    }
  }
  function go(path) {
    if (location.hash === `#${path}`) setRoute(parseHash());
    else location.hash = `#${path}`;
  }

  const me = session?.name;
  const isAdmin = session?.role === "admin";

  async function doSync(kind) {
    if (!getApiUrl()) {
      setShowSyncHelp(true);
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    setSync((s) => ({ ...s, busy: true, msg: kind === "pull" ? "Menarik…" : "Mengirim…" }));
    try {
      const remote = await pullRemote();
      if (kind === "pull") {
        applyDb(mergeRemote(dbRef.current, remote));
      } else {
        const res = await pushLocal(dbRef.current, remote);
        const fresh = await pullRemote();
        applyDb(mergeRemote(dbRef.current, fresh));
        setLastSync(Date.now());
        setSync((s) => ({
          ...s, mode: "online", last: Date.now(),
          msg: res.created || res.updated ? `+${res.created} req · ~${res.updated} tugas` : "sudah sama",
        }));
        lastPullRef.current = Date.now();
        return;
      }
      setLastSync(Date.now());
      lastPullRef.current = Date.now();
      setSync((s) => ({
        ...s, mode: "online", last: Date.now(),
        msg: `${remote.requests.length} req · ${remote.tasks.length} tugas`,
      }));
    } catch (e) {
      setSync((s) => ({ mode: getApiUrl() ? "error" : "local", busy: false, last: s.last, msg: "gagal: " + e.message }));
    } finally {
      busyRef.current = false;
      setSync((s) => ({ ...s, busy: false }));
    }
  }

  useEffect(() => {
    if (getApiUrl()) {
      lastPullRef.current = Date.now();
      doSync("pull");
    }
    const onFocus = () => {
      if (!getApiUrl() || busyRef.current) return;
      if (Date.now() - lastPullRef.current < 15000) return;
      lastPullRef.current = Date.now();
      doSync("pull");
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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
    <div className="flex h-dvh flex-col bg-white">
      {!isPublic && session && <TopBar me={me} isAdmin={isAdmin} onLogout={logout} onSync={doSync} sync={sync} go={go} />}

      {isPublic ? (
        <>
          {view === "request" && <PublicRequest db={db} setDb={setDb} go={go} />}
          {view === "track" && <Track db={db} reqId={param} go={go} />}
        </>
      ) : !session ? (
        <Login onDone={(s) => setSession(s)} go={go} />
      ) : (
        <div className="flex min-h-0 flex-1">
          <SideBar view={view} go={go} me={me} isAdmin={isAdmin} onLogout={logout} sync={sync} onSync={doSync} onSetup={() => setShowSyncHelp(true)} />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 pb-20 md:px-6 md:pb-0">
            {view === "intake" && <Intake db={db} setDb={setDb} me={me} isAdmin={isAdmin} />}
            {(view === "board" || view === undefined) && (
              <Board db={db} setDb={setDb} me={me} isAdmin={isAdmin} />
            )}
            {view === "calendar" && <Calendar db={db} />}
            {view === "assets" && <Assets db={db} setDb={setDb} me={me} isAdmin={isAdmin} />}
            {view === "dashboard" && <Dashboard db={db} />}
          </main>
        </div>
      )}

      {!isPublic && session && <MobileTabBar view={view} go={go} />}

      {!isPublic && session && (
        <footer className="border-t border-[#DCDFE4] bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 pb-24 text-[12px] text-[#626F86] md:pb-3">
            <p>Medkom Tracker · {sync.mode === "online" ? "tersambung" : sync.mode === "error" ? "sync gagal" : "mode lokal"}</p>
            <div className="flex items-center gap-3">
              <button
                className="jlink"
                onClick={() => {
                  if (confirm("Muat data contoh demo? Data yang sekarang akan diganti.")) setDbState(loadDemoDB());
                }}
              >
                Muat contoh
              </button>
              <button
                className="jlink"
                onClick={() => {
                  if (confirm("Hapus SEMUA data dan mulai kosong?")) setDbState(resetDB());
                }}
              >
                Hapus semua
              </button>
            </div>
          </div>
        </footer>
      )}
      {showSyncHelp && (
        <SyncHelpModal
          onClose={() => setShowSyncHelp(false)}
          onSaved={() => {
            setShowSyncHelp(false);
            setSync((s) => ({ ...s, mode: "online", msg: "" }));
            doSync("pull");
          }}
        />
      )}
    </div>
  );
}
