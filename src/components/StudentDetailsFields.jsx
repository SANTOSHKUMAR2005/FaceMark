import { batchLabel, currentSemester, startYearOptions } from "../academic.js";

/** Shared by the student profile page and the admin edit page. */
export default function StudentDetailsFields({ form, setForm, meta, disabled }) {
  const set = (k) => (e) => setForm({ ...form, [k]: k === "batch_start_year" ? Number(e.target.value) : e.target.value });
  const degree = form.degree || Object.keys(meta.degrees)[0];
  const sem = currentSemester(form.batch_start_year, degree, meta);

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={set("name")} /></div>
      <div><label className="label">Roll number</label><input className="input" required value={form.roll_number} onChange={set("roll_number")} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Degree</label>
          <select className="input" required value={form.degree} onChange={set("degree")}>
            <option value="">Select degree</option>
            {Object.keys(meta.degrees).map((d) => <option key={d} value={d}>{d} ({meta.degrees[d]} years)</option>)}</select></div>
        <div><label className="label">Batch start year</label>
          <select className="input" value={form.batch_start_year} onChange={set("batch_start_year")}>
            {startYearOptions().map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
      </div>
      <p className="rounded-lg bg-ink/5 p-2.5 text-sm">
        Batch <b>{batchLabel(form.batch_start_year, degree, meta)}</b> · Current semester <b>{sem}</b>
        <span className="block text-xs text-ink/60">The semester updates automatically every 6 months.</span>
      </p>
      <div><label className="label">Department</label>
        <select className="input" required value={form.department} onChange={set("department")}>
          <option value="">Select department</option>
          {meta.departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Section</label>
          <select className="input" required value={form.section} onChange={set("section")}>
            <option value="">Select section</option>
            {meta.sections.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className="label">Phone (optional)</label><input className="input" value={form.phone} onChange={set("phone")} /></div>
      </div>
    </fieldset>
  );
}
