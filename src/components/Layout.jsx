import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import Logo from "./Logo.jsx";

const link = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const home = user?.role === "teacher" ? "/teacher" : user?.role === "admin" ? "/admin" : "/student/attendance";
  const initials = (user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-ink shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-4">
            <Link to={home} className="flex items-center gap-2 text-white">
              <Logo className="h-7 w-7 text-emerald-300" />
              <span className="text-lg font-bold tracking-tight">Face Attendance</span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              {user?.role === "teacher" && <NavLink to="/teacher" className={link}>My classes</NavLink>}
              {user?.role === "admin" && <NavLink to="/admin" className={link}>Students</NavLink>}
              {user?.role === "student" && (
                <>
                  <NavLink to="/student/attendance" className={link}>My attendance</NavLink>
                  <NavLink to="/student/profile" className={link}>My profile</NavLink>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300 text-xs font-bold text-ink">{initials}</span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-white">{user?.name}</p>
                <p className="text-xs capitalize text-white/60">{user?.role}</p>
              </div>
            </div>
            <button className="rounded-lg border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
              onClick={() => { logout(); nav("/"); }}>Log out</button>
          </div>
        </div>
        {user?.role === "student" && (
          <nav className="flex gap-1 border-t border-white/10 px-4 py-1.5 sm:hidden">
            <NavLink to="/student/attendance" className={link}>My attendance</NavLink>
            <NavLink to="/student/profile" className={link}>My profile</NavLink>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
