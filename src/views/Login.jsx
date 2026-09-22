import { useState } from "react";
import { ADMINS, MEMBERS } from "../lib/store.js";
import { login } from "../lib/auth.js";
import { Logo } from "../components/jira.jsx";

export default function Login({ onDone, go }) {
  const [name, setName] = useState(MEMBERS[0]);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const r = login(name, pin);
    if (r.ok) onDone(r.session);
    else setErr(r.error);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FAFBFC] px-4 py-8">
      <form onSubmit={submit} className="card w-full max-w-[380px] p-6">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-[16px] font-semibold tracking-tight">Medkom Tracker</span>
        </div>
        <h1 className="mt-4 text-[20px] font-medium">Log in</h1>
        <p className="mt-0.5 text-[13px] text-[#626F86]">
          Area khusus tim Medkom. Pilih namamu lalu masukkan PIN.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="lbl">Nama</p>
            <select className="input mt-1" value={name} onChange={(e) => setName(e.target.value)}>
              {MEMBERS.map((m) => (
                <option key={m} value={m}>
                  {m} {ADMINS.includes(m) ? "· Admin" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="lbl">PIN</p>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              className="input mt-1"
              placeholder="••••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErr("");
              }}
            />
          </div>
          {err && <p className="text-[13px] font-medium text-[#AE2E24]">{err}</p>}
          <button type="submit" className="btn-pine h-9 w-full text-sm">
            Log in
          </button>
        </div>
        <button type="button" className="jlink mt-4 text-[13px]" onClick={() => go("/request")}>
          ← Kembali ke halaman request
        </button>
      </form>
    </div>
  );
}
