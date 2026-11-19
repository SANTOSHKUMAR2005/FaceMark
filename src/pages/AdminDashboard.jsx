import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api.js";
import useMeta from "../meta.js";
import { startYearOptions } from "../academic.js";

export default function AdminDashboard() {
  const meta = useMeta();
  const [f, setF] = useState({ q: "", department: "", degree: "", batch_start_year: "", section: "" });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const t = setTimeout(() => {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ""));
      api.get("/admin/students", { params }).then((r) => { setRows(r.data); setError(""); }).catch((e) => setError(errMsg(e)));
    }, 300);
    return () => clearTimeout(t);
  }, [f]);

  if (!meta) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Students</h1>
      <p className="mb-4 text-sm text-ink/60">Search a student to correct their details or replace their photos.</p>

      <div className="panel mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input className="input lg:col-span-2" placeholder="Search name, roll number or email" value={f.q} onChange={set("q")} />
        <select className="input" value={f.department} onChange={set("department")}><option value="">All departments</option>{meta.departments.map((d) => <option key={d}>{d}</option>)}</select>
        <select className="input" value={f.degree} onChange={set("degree")}><option value="">All degrees</option>{Object.keys(meta.degrees).map((d) => <option key={d}>{d}</option>)}</select>
        <div className="grid grid-cols-2 gap-3">
          <select className="input" value={f.batch_start_year} onChange={set("batch_start_year")}><option value="">Batch</option>{startYearOptions().map((y) => <option key={y}>{y}</option>)}</select>
          <select className="input" value={f.section} onChange={set("section")}><option value="">Section</option>{meta.sections.map((s) => <option key={s}>{s}</option>)}</select>
        </div>
      </div>

      {error && <p role="alert" className="alert-err mb-3">{error}</p>}
      {rows && rows.length === 0 && <p className="panel text-sm text-ink/70">No students found.</p>}
      {rows && rows.length > 0 && (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left"><tr>
              <th className="p-3">Student</th><th className="p-3">Department</th><th className="p-3">Degree and batch</th>
              <th className="p-3">Sec</th><th className="p-3">Sem</th><th className="p-3">Photos</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-ink/10 hover:bg-field/60">
                  <td className="p-3"><p className="font-semibold">{s.name}</p><p className="text-xs text-ink/60">{s.roll_number || "no roll number"} · {s.email}</p></td>
                  <td className="p-3">{s.department || "-"}</td>
                  <td className="p-3">{s.degree ? `${s.degree} ${s.batch_label}` : "-"}</td>
                  <td className="p-3">{s.section || "-"}</td>
                  <td className="p-3">{s.current_semester || "-"}</td>
                  <td className="p-3"><span className={s.photo_count ? "badge-brand" : "badge"}>{s.photo_count}</span></td>
                  <td className="p-3">{s.profile_complete ? <span className="badge-brand">Complete</span> : <span className="badge">{s.profile_locked ? "No photos" : "Not submitted"}</span>}</td>
                  <td className="p-3 text-right"><Link to={`/admin/students/${s.id}`} className="btn-ghost">Open</Link></td>
                </tr>))}
            </tbody>
          </table>
        </div>)}
    </div>
  );
}
