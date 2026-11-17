import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api.js";
import useMeta from "../meta.js";
import { batchLabel, currentSemester, startYearOptions, totalSemesters } from "../academic.js";

export default function TeacherDashboard() {
  const meta = useMeta();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = () => api.get("/classes").then((r) => setClasses(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (meta && !form) {
      const degree = Object.keys(meta.degrees)[0];
      const year = new Date().getFullYear();
      setForm({ subject: "", batch_start_year: year, degree, department: "", section: "", semester: currentSemester(year, degree, meta) });
    }
  }, [meta]);

  // Group: batch (newest first) -> semester (latest first) -> classes
  const groups = useMemo(() => {
    const map = new Map();
    for (const c of classes) {
      const key = `${c.batch_start_year}|${c.degree}`;
      if (!map.has(key)) map.set(key, { key, start: c.batch_start_year, degree: c.degree, label: c.batch_label, sems: new Map(), count: 0 });
      const g = map.get(key);
      g.count++;
      if (!g.sems.has(c.semester)) g.sems.set(c.semester, []);
      g.sems.get(c.semester).push(c);
    }
    return [...map.values()]
      .sort((a, b) => b.start - a.start || a.degree.localeCompare(b.degree))
      .map((g) => ({ ...g, sems: [...g.sems.entries()].sort((a, b) => b[0] - a[0]) }));
  }, [classes]);

  if (!meta || !form) return <p>Loading…</p>;

  const change = (k) => (e) => {
    const next = { ...form, [k]: k === "batch_start_year" ? Number(e.target.value) : e.target.value };
    if (k === "batch_start_year" || k === "degree") next.semester = currentSemester(next.batch_start_year, next.degree, meta);
    setForm(next);
  };
  const nowSem = currentSemester(form.batch_start_year, form.degree, meta);

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/classes", { ...form, semester: Number(form.semester) });
      setForm({ ...form, subject: "" });
      load();
    } catch (err) { setError(errMsg(err)); }
  }

  async function remove(c) {
    if (!confirm(`Delete "${c.subject}" and all its attendance records?`)) return;
    await api.delete(`/classes/${c.id}`);
    load();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={create} className="panel space-y-4 lg:sticky lg:top-20">
        <div><h2 className="text-lg font-bold">Create a class</h2><p className="text-xs text-ink/60">Students of the same batch, degree, department and section are added automatically.</p></div>
        <div><label className="label">Subject</label>
          <input className="input" required placeholder="Data Structures" value={form.subject} onChange={change("subject")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Batch start year</label>
            <select className="input" value={form.batch_start_year} onChange={change("batch_start_year")}>
              {startYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div><label className="label">Degree</label>
            <select className="input" value={form.degree} onChange={change("degree")}>
              {Object.keys(meta.degrees).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {nowSem > 0 ? <p className="alert-ok -mt-1 text-xs">Batch {batchLabel(form.batch_start_year, form.degree, meta)} is in semester {nowSem} right now.</p> : <p className=" text-red-600 -mt-1 text-xs">Invalid Batch Start year or Degree.</p> }

        <div><label className="label">Department</label>
          <select className="input" required value={form.department} onChange={change("department")}>
            <option value="">Select department</option>
            {meta.departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Semester</label>
            <select className="input" value={form.semester} onChange={change("semester")}>
              {Array.from({ length: totalSemesters(form.degree, meta) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Semester {n}</option>)}</select></div>
          <div><label className="label">Section</label>
            <select className="input" required value={form.section} onChange={change("section")}>
              <option value="">Select</option>
              {meta.sections.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        {error && <p role="alert" className="alert-err">{error}</p>}
        <button disabled={nowSem<=0} className="btn-primary w-full">Create class</button>
      </form>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-xl font-bold">Your classes</h2>
            <p className="text-sm text-ink/60">Grouped by batch, then semester.</p></div>
          {classes.length > 0 && <div className="flex gap-2"><span className="badge-brand">{classes.length} classes</span><span className="badge">{groups.length} batches</span></div>}
        </div>

        {loaded && classes.length === 0 && (
          <div className="panel py-12 text-center">
            <p className="text-lg font-semibold">No classes yet</p>
            <p className="mt-1 text-sm text-ink/60">Create your first class with the form to start taking attendance.</p>
          </div>)}

        <div className="space-y-5">
          {groups.map((g) => (
            <details key={g.key} open className="panel group p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-t-xl bg-ink px-5 py-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">Batch {g.label}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">{g.degree}</span>
                </div>
                <span className="text-sm text-white/70">{g.count} {g.count === 1 ? "class" : "classes"}</span>
              </summary>
              <div className="space-y-5 p-5">
                {g.sems.map(([sem, list]) => (
                  <div key={sem}>
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-bold">Semester {sem}</h3>
                      {sem === currentSemester(g.start, g.degree, meta) && <span className="badge-brand">Current</span>}
                      <span className="h-px flex-1 bg-ink/10" />
                    </div>
                    <ul className="space-y-2">
                      {list.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 bg-field/60 p-3">
                          <div>
                            <p className="font-semibold">{c.subject}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5"><span className="badge">{c.department}</span><span className="badge">Section {c.section}</span></div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/teacher/classes/${c.id}/take`} className="btn-primary">Take attendance</Link>
                            <Link to={`/teacher/classes/${c.id}/attendance`} className="btn-ghost">View</Link>
                            <button onClick={() => remove(c)} className="btn-ghost text-red-700" aria-label={`Delete ${c.subject}`}>Delete</button>
                          </div>
                        </li>))}
                    </ul>
                  </div>))}
              </div>
            </details>))}
        </div>
      </section>
    </div>
  );
}
