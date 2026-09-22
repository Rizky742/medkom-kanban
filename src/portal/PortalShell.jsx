/* Shell khusus portal publik: header + footer kreatif, tanpa chrome Jira. */
export default function PortalShell({ go, children }) {
  return (
    <div className="portal flex min-h-dvh flex-col">
      <header className="portal-header">
        <div className="mx-auto flex h-[68px] max-w-5xl items-center gap-3 px-4">
          <button onClick={() => go("/request")} className="flex items-center gap-2.5">
            <span className="portal-mark">M</span>
            <span className="text-left leading-tight">
              <span className="block text-[17px] font-extrabold tracking-tight">Medkom Kreatif</span>
              <span className="block text-[11px] font-semibold text-[#6e6257]">GenBI UNAIR · Desain & Konten</span>
            </span>
          </button>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => go("/request")}
              className="hidden rounded-full px-3 py-2 text-[14px] font-bold hover:bg-[#f3e8d3] sm:inline"
            >
              Request
            </button>
            <button
              onClick={() => go("/track/")}
              className="hidden rounded-full px-3 py-2 text-[14px] font-bold hover:bg-[#f3e8d3] sm:inline"
            >
              Lacak
            </button>
            <button onClick={() => go("/app/board")} className="portal-btn px-4 py-2 text-[13px]">
              Masuk internal
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-16">{children}</main>

      <footer className="portal-footer">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6">
          <p className="text-[14px] font-bold">Medkom Kreatif · GenBI UNAIR 2026</p>
          <p className="text-[13px] text-[#d8cdb8]">Made by medkom with love ❤️</p>
        </div>
      </footer>
    </div>
  );
}
