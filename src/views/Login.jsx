import { useState } from "react";
import { login } from "../lib/auth.js";
import { memberRole, teamMembers } from "../lib/team.js";
import { Logo } from "../components/jira.jsx";

export default function Login({ onDone, go }) {
  const members = teamMembers();
  const [name, setName] = useState(members[0] || "");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    const r = login(name, pin);
    if (r.ok) onDone(r.session);
    else setErr(r.error);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-[#FAFAFA] px-4 py-8">
      <form onSubmit={submit} className="card w-full max-w-[380px] p-6">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-display text-[16px]">Medkom Tracker</span>
        </div>
        <h1 className="font-display mt-4 text-[24px]">Log in</h1>
        <p className="mt-0.5 text-[13px] text-[#6B6B6B]">
          Area khusus tim Medkom. Pilih namamu lalu masukkan PIN.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="lbl">Nama</p>
            <select className="input mt-1" value={name} onChange={(e) => setName(e.target.value)}>
              {members.map((m) => (
                <option key={m} value={m}>
                  {m} {memberRole(m) === "admin" ? "· Admin" : ""}
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
          {err && <p className="text-[13px] font-medium text-[#EF4444]">{err}</p>}
          <button type="submit" className="btn-pine h-11 w-full text-sm">
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
