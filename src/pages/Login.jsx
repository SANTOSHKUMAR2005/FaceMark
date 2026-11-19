import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js";
import { useAuth } from "../auth.jsx";
import Logo from "../components/Logo.jsx";
import useMeta from "../meta.js";

const TITLES = {
  login: ["Welcome back", "Log in to take or view class attendance."],
  register: ["Create your account", "We will email you a code to confirm your address."],
  verify: ["Check your email", "Enter the 6-digit code we sent you."],
  forgot: ["Forgot your password?", "Enter your email and we will send you a code."],
  reset: ["Set a new password", "Enter the code from your email and choose a new password."],
};

export default function Login() {
  const [role, setRole] = useState("student");
  const [view, setView] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", teacher_code: "", code: "", confirm: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { login } = useAuth();
  const nav = useNavigate();
  const meta = useMeta();
  const domains = meta?.allowed_email_domains || [];
  const domainOk = (email) => !domains.length || domains.includes(email.trim().toLowerCase().split("@").pop());
  const set = (k) => (e) => setF({ ...f, [k]: k === "code" ? e.target.value.replace(/\D/g, "").slice(0, 6) : e.target.value });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (v, n = "") => { setView(v); setError(""); setNotice(n); };
  const finish = (data) => { login(data); nav(data.role === "teacher" ? "/teacher" : data.role === "admin" ? "/admin" : view === "verify" ? "/student/profile" : "/student/attendance"); };

  async function submit(e) {
    e.preventDefault();
    setError(""); setNotice("");
    if (["login", "register", "forgot"].includes(view) && !domainOk(f.email)) {
      setError(`Only ${domains.map((d) => "@" + d).join(" or ")} email addresses can be used.`);
      return;
    }
    setBusy(true);
    try {
      if (view === "login") {
        try {
          const { data } = await api.post("/auth/login", { email: f.email, password: f.password, role });
          finish(data);
        } catch (err) {
          if (err.response?.data?.detail?.code === "email_not_verified") { go("verify", `Your email is not verified yet. We sent a code to ${f.email}.`); setCooldown(60); }
          else throw err;
        }
      } else if (view === "register") {
        await api.post("/auth/register", { name: f.name, email: f.email, password: f.password, role, teacher_code: f.teacher_code });
        go("verify", `We sent a 6-digit code to ${f.email}.`); setCooldown(60);
      } else if (view === "verify") {
        const { data } = await api.post("/auth/verify-email", { email: f.email, code: f.code });
        finish(data);
      } else if (view === "forgot") {
        await api.post("/auth/forgot-password", { email: f.email });
        setF({ ...f, code: "", password: "", confirm: "" });
        go("reset", "If this email is registered, we sent a 6-digit code to it."); setCooldown(60);
      } else if (view === "reset") {
        if (f.password !== f.confirm) throw new Error("The two passwords do not match.");
        await api.post("/auth/reset-password", { email: f.email, code: f.code, new_password: f.password });
        setF({ ...f, password: "", confirm: "", code: "" });
        go("login", "Password changed. You can log in now.");
      }
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  }

  async function resend() {
    setError(""); setNotice("");
    try {
      await api.post(view === "verify" ? "/auth/resend-verification" : "/auth/forgot-password", { email: f.email });
      setNotice("A new code has been sent."); setCooldown(60);
    } catch (err) { setError(errMsg(err)); }
  }

  const [title, sub] = TITLES[view];
  const codeView = view === "verify" || view === "reset";

  return (
    <div className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-white md:flex md:flex-col md:justify-between">
        <div className="flex items-center gap-2"><Logo className="h-8 w-8 text-emerald-300" /><span className="text-xl font-bold">Face Attendance</span></div>
        <div className="relative mx-auto my-10 flex aspect-square w-64 items-center justify-center">
          {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl",
            "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((c) => (
              <span key={c} className={`absolute h-12 w-12 border-emerald-300 ${c}`} />))}
          <Logo className="h-28 w-28 text-emerald-300/90" />
          <span className="absolute inset-x-6 top-1/2 h-0.5 animate-pulse bg-emerald-300/70" />
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Attendance in one click.<br />No roll calls.</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>Teachers scan the class with the webcam and submit.</li>
            <li>Students check attendance for every semester and subject.</li>
            <li>Accounts are protected with email verification.</li>
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 md:hidden"><Logo className="h-8 w-8 text-brand" /><span className="text-xl font-bold">Face Attendance</span></div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-ink/70">{sub}</p>

          {(view === "login" || view === "register") && (
            <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-ink/5 p-1">
              {["student", "teacher", "admin"].map((r) => (
                <button key={r} type="button" onClick={() => { setRole(r); if (r === "admin" && view === "register") go("login"); }}
                  className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${role === r ? "bg-white shadow-sm" : "text-ink/55 hover:text-ink"}`}>{r}</button>))}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {view === "register" && <div><label className="label">Full name</label><input className="input" required value={f.name} onChange={set("name")} /></div>}
            {codeView ? (
              <p className="rounded-lg bg-ink/5 px-3 py-2 text-sm">Code sent to <b>{f.email}</b>{" "}
                <button type="button" className="text-brand underline" onClick={() => go(view === "verify" ? "register" : "forgot")}>change</button></p>
            ) : (
              <div><label className="label">Email</label>
                <input className="input" type="email" required placeholder={domains.length ? `you@${domains[0]}` : "you@college.edu"} value={f.email} onChange={set("email")} />
                {domains.length > 0 && <p className="mt-1 text-xs text-ink/60">Use your college email ({domains.map((d) => "@" + d).join(" or ")}).</p>}</div>
            )}
            {(view === "login" || view === "register") && (
              <div><label className="label">Password</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set("password")} /></div>)}
            {view === "register" && role === "teacher" && (
              <div><label className="label">Teacher signup code</label><input className="input" required value={f.teacher_code} onChange={set("teacher_code")} />
                <p className="mt-1 text-xs text-ink/60">Ask your college admin for this code.</p></div>)}
            {codeView && (
              <div><label className="label">6-digit code</label>
                <input className="input text-center text-2xl font-bold tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={6} placeholder="······" value={f.code} onChange={set("code")} /></div>)}
            {view === "reset" && (
              <>
                <div><label className="label">New password</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set("password")} /></div>
                <div><label className="label">Confirm new password</label><input className="input" type="password" required minLength={6} value={f.confirm} onChange={set("confirm")} /></div>
              </>)}

            {notice && <p role="status" className="alert-ok">{notice}</p>}
            {error && <p role="alert" className="alert-err">{error}</p>}

            <button className="btn-primary w-full py-2.5" disabled={busy}>
              {busy ? "Please wait…" : { login: "Log in", register: "Create account", verify: "Verify and continue", forgot: "Send code", reset: "Change password" }[view]}
            </button>
          </form>

          <div className="mt-5 space-y-2 text-sm">
            {codeView && (
              <button type="button" className="text-brand underline disabled:text-ink/40 disabled:no-underline" disabled={cooldown > 0} onClick={resend}>
                {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}</button>)}
            {view === "login" && (
              <>
                <p><button className="text-brand underline" onClick={() => go("forgot")}>Forgot password?</button></p>
                {role !== "admin" && <p>New here? <button className="text-brand underline" onClick={() => go("register")}>Create an account</button></p>}
              </>)}
            {view !== "login" && <p><button className="text-brand underline" onClick={() => go("login")}>Back to log in</button></p>}
          </div>
        </div>
      </main>
    </div>
  );
}
