import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api.js";
import useMeta from "../meta.js";
import { batchLabel, currentSemester, startYearOptions, totalSemesters } from "../academic.js";

// A new batch row. When "base" is given (adding another batch) it starts from the previous row
// with the next degree, because shared classes usually mix degrees of the same branch.
function newCohort(meta, base) {
  const degrees = Object.keys(meta.degrees);
  const degree = base ? degrees[(degrees.indexOf(base.degree) + 1) % degrees.length] : degrees[0];
  const year = base ? base.batch_start_year : new Date().getFullYear();
  return { key: Math.random().toString(36).slice(2), batch_start_year: year, degree, section: base?.section || "", semester: currentSemester(year, degree, meta) };
}

export default function TeacherDashboard() {
  const meta = useMeta();
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = () => api.get("/classes").then((r) => setClasses(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (meta && !form) setForm({ subject: "", department: "", cohorts: [newCohort(meta)] }); }, [meta]);

  // Group: batch (newest first) -> semester (latest first) -> classes. A shared class appears under each of its batches.
  const groups = useMemo(() => {
    const map = new Map();
    for (const c of classes) for (const k of c.cohorts) {
      const key = `${k.batch_start_year}|${k.degree}`;
      if (!map.has(key)) map.set(key, { key, start: k.batch_start_year, degree: k.degree, label: k.batch_label, sems: new Map(), ids: new Set() });
      const g = map.get(key);
      g.ids.add(c.id);
      if (!g.sems.has(k.semester)) g.sems.set(k.semester, []);
      g.sems.get(k.semester).push({ cls: c, cohort: k });
    }
    return [...map.values()]
      .sort((a, b) => b.start - a.start || a.degree.localeCompare(b.degree))
      .map((g) => ({ ...g, sems: [...g.sems.entries()].sort((a, b) => b[0] - a[0]) }));
  }, [classes]);

  if (!meta || !form) return <p>Loading…</p>;

  const setCohort = (i, k, v) => {
    const cohorts = form.cohorts.map((c, j) => {
      if (j !== i) return c;
      const next = { ...c, [k]: k === "batch_start_year" || k === "semester" ? Number(v) : v };
      if (k === "batch_start_year" || k === "degree") next.semester = currentSemester(next.batch_start_year, next.degree, meta);
      return next;
    });
    setForm({ ...form, cohorts });
  };
  const addCohort = () => setForm({ ...form, cohorts: [...form.cohorts, newCohort(meta, form.cohorts[form.cohorts.length - 1])] });
  const removeCohort = (i) => setForm({ ...form, cohorts: form.cohorts.filter((_, j) => j !== i) });

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/classes", {
        subject: form.subject, department: form.department,
        cohorts: form.cohorts.map(({ key, ...c }) => c)
      });
      setForm({ ...form, subject: "" });
      load();
    } catch (err) { setError(errMsg(err)); }
  }

  async function remove(c) {
    const shared = c.cohorts.length > 1 ? ` It is shared by ${c.cohorts.length} batches and will be deleted for all of them.` : "";
    if (!confirm(`Delete "${c.subject}" and all its attendance records?${shared}`)) return;
    await api.delete(`/classes/${c.id}`);
    load();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="panel space-y-4 lg:sticky lg:top-20">
        <div><h2 className="text-lg font-bold">Create a class</h2>
          <p className="text-xs text-ink/60">Add more than one batch when they study this subject together. All batches must be from the same department.</p></div>
        <div><label className="label">Subject</label>
          <input className="input" required placeholder="Data Structures" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div><label className="label">Department</label>
          <select className="input" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Select department</option>
            {meta.departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>

        {form.cohorts.map((c, i) => (
          <div key={c.key} className="space-y-3 rounded-lg border border-ink/10 bg-field/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Batch {i + 1}</p>
              {form.cohorts.length > 1 && <button type="button" className="text-xs text-red-700 underline" onClick={() => removeCohort(i)}>Remove</button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Batch start year</label>
                <select className="input" value={c.batch_start_year} onChange={(e) => setCohort(i, "batch_start_year", e.target.value)}>
                  {startYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="label">Degree</label>
                <select className="input" value={c.degree} onChange={(e) => setCohort(i, "degree", e.target.value)}>
                  {Object.keys(meta.degrees).map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <p className="text-xs text-ink/60">Batch {batchLabel(c.batch_start_year, c.degree, meta)} is in semester {currentSemester(c.batch_start_year, c.degree, meta)} now.</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Semester</label>
                <select className="input" value={c.semester} onChange={(e) => setCohort(i, "semester", e.target.value)}>
                  {Array.from({ length: totalSemesters(c.degree, meta) }, (_, n) => n + 1).map((n) => <option key={n} value={n}>Semester {n}</option>)}</select></div>
              <div><label className="label">Section</label>
                <select className="input" required value={c.section} onChange={(e) => setCohort(i, "section", e.target.value)}>
                  <option value="">Select</option>
                  {meta.sections.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
          </div>))}

        {form.cohorts.length < 8 && <button type="button" className="btn-ghost w-full" onClick={addCohort}>+ Add another batch</button>}
        {error && <p role="alert" className="alert-err">{error}</p>}
        <button className="btn-primary w-full">Create class</button>
      </form>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-xl font-bold">Your classes</h2>
            <p className="text-sm text-ink/60">Grouped by batch, then semester. Shared classes show under every batch.</p></div>
          {classes.length > 0 && <div className="flex gap-2"><span className="badge-brand">{classes.length} classes</span><span className="badge">{groups.length} batches</span></div>}
        </div>

        {loaded && classes.length === 0 && (
          <div className="panel py-12 text-center">
            <p className="text-lg font-semibold">No classes yet</p>
            <p className="mt-1 text-sm text-ink/60">Create your first class with the form to start taking attendance.</p>
          </div>)}

        <div className="space-y-5">
          {groups.map((g) => (
            <details key={g.key} open className="panel p-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-t-xl bg-ink px-5 py-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">Batch {g.label}</span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">{g.degree}</span>
                </div>
                <span className="text-sm text-white/70">{g.ids.size} {g.ids.size === 1 ? "class" : "classes"}</span>
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
                      {list.map(({ cls, cohort }) => {
                        const others = cls.cohorts.filter((k) => k.id !== cohort.id);
                        return (
                          <li key={cls.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink/10 bg-field/60 p-3">
                            <div>
                              <p className="font-semibold">{cls.subject}</p>
                              <div className="mt-1 flex flex-wrap gap-1.5"><span className="badge">{cls.department}</span><span className="badge">Section {cohort.section}</span></div>
                              {others.length > 0 && <p className="mt-1.5 text-xs text-ink/60">Shared with: {others.map((k) => `${k.degree} ${k.batch_label} (Sem ${k.semester}, Sec ${k.section})`).join("; ")}</p>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Link to={`/teacher/classes/${cls.id}/take`} className="btn-primary">Take attendance</Link>
                              <Link to={`/teacher/classes/${cls.id}/attendance`} className="btn-ghost">View</Link>
                              <button onClick={() => remove(cls)} className="btn-ghost text-red-700" aria-label={`Delete ${cls.subject}`}>Delete</button>
                            </div>
                          </li>);
                      })}
                    </ul>
                  </div>))}
              </div>
            </details>))}
        </div>
      </section>
    </div>
  );
}
