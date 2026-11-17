import { useEffect, useState } from "react";
import api, { errMsg, photoSrc } from "../api.js";
import useCamera from "../useCamera.js";
import useMeta from "../meta.js";
import { batchLabel, currentSemester, startYearOptions } from "../academic.js";

export default function StudentProfile() {
  const meta = useMeta();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState([]);
  const [complete, setComplete] = useState(false);
  const [outdated, setOutdated] = useState(false);
  const [shots, setShots] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const cam = useCamera();

  const apply = (p) => {
    setForm({
      name: p.name || "", roll_number: p.roll_number || "", phone: p.phone || "",
      batch_start_year: p.batch_start_year || new Date().getFullYear(),
      degree: p.degree || "", department: p.department || "", section: p.section || "",
    });
    setSaved(p.photos); setComplete(p.profile_complete); setOutdated(p.photos_outdated);
  };

  useEffect(() => { 
    api.get("/students/me").then((r) => apply(r.data)); 
    return () => cam.stop(); 
  }, []);

  if (!meta || !form) return <p>Loading…</p>;
  const set = (k) => (e) => setForm({ ...form, [k]: k === "batch_start_year" ? Number(e.target.value) : e.target.value });
  const degree = form.degree || Object.keys(meta.degrees)[0];
  const sem = currentSemester(form.batch_start_year, degree, meta);

  async function saveDetails(e) {
    e.preventDefault();
    try {
      const { data } = await api.put("/students/me", { ...form, degree });
      apply(data); setMsg({ type: "ok", text: "Details saved." });
    } catch (err) {
       setMsg({ type: "err", text: errMsg(err) }); 
    }
  }

  async function snap() {
    const blob = await cam.capture();
    if (blob && shots.length < 4) 
      setShots([...shots, { blob, url: URL.createObjectURL(blob) }]);
  }

  function pickFiles(e) {
    const files = [...e.target.files].slice(0, 4 - shots.length);
    setShots([...shots, ...files.map((f) => ({ blob: f, url: URL.createObjectURL(f) }))]);
  }

  async function uploadPhotos() {
    const fd = new FormData();
    shots.forEach((s, i) => fd.append("files", s.blob, `photo${i}.jpg`));
    setMsg({ type: "ok", text: "Uploading and checking faces…" });
    try {

      const { data } = await api.post("/students/me/photos", fd);

      apply(data); 
      setShots([]); 
      cam.stop();
      setMsg({ type: "ok", text: "Photos updated. Your face data is ready for attendance." });
    } catch (err) {
       setMsg({ type: "err", text: errMsg(err) }); }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className={`mt-1 text-sm ${complete ? "text-brand" : "text-amber"}`}>
          {complete ? "Profile complete. You can be marked present by face." : "Finish your details and add 3 or 4 photos so the camera can recognise you."}
        </p>
        {outdated && <p role="alert" className="mt-3 rounded bg-amber/10 p-2 text-sm text-amber">A new semester has started. Please take fresh photos so the camera recognises you correctly.</p>}
        {msg.text && <p role="alert" className={`mt-3 rounded p-2 text-sm ${msg.type === "err" ? "bg-red-50 text-red-700" : "bg-green-50 text-brand"}`}>{msg.text}</p>}
      </div>

      <form onSubmit={saveDetails} className="panel space-y-4">
        <h2 className="font-bold">Details</h2>
        <div><label className="label">Full name</label><input className="input" required value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Roll number</label><input className="input" required value={form.roll_number} onChange={set("roll_number")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Degree</label>
            <select className="input" required value={form.degree} onChange={set("degree")}>
              <option value="">Select degree</option>
              {Object.keys(meta.degrees).map((d) => <option key={d} value={d}>{d} ({meta.degrees[d]} years)</option>)}</select></div>
          <div>
            <label className="label">Batch start year</label>
            <select className="input" value={form.batch_start_year} onChange={set("batch_start_year")}>
              {
              startYearOptions().map((y) => <option key={y} value={y}>{y}</option>)
              }
            </select>
          </div>
        </div>
        <p className="rounded bg-ink/5 p-2 text-sm">
          {sem > 0 ? <> Batch <b>{batchLabel(form.batch_start_year, degree, meta)}</b> . Current semester <b>{sem}</b> </> : 
            <b className="text-red-600">Invalid Batch start year or Degree</b>
          }
          <span className="block text-xs text-ink/60">The semester updates automatically every 6 months.</span>
        </p>
        <div>
          <label className="label">Department</label>
          <select className="input" required value={form.department} onChange={set("department")}>
            <option value="">Select department</option>
            {
            meta.departments.map((d) => <option key={d} value={d}>{d}</option>)
            }
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Section</label>
            <select className="input" required value={form.section} onChange={set("section")}>
              <option value="">Select section</option>
              {
              meta.sections.map((s) => <option key={s} value={s}>{s}</option>)
              }
            </select>
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={form.phone} onChange={set("phone")} />
          </div>
        </div>
        <button disabled={sem<=0} className="btn-primary w-full">Save details</button>
      </form>

      <div className="panel space-y-4">
        <h2 className="font-bold">Face photos (3 or 4)</h2>
        <p className="text-xs text-ink/60">Save your details first. Good light, face the camera, only you in the frame. Update your photos every semester. Saving replaces your earlier photos.</p>

        <div className="aspect-4/3 overflow-hidden rounded bg-ink">
          <video ref={cam.videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        </div>
        {
        cam.error && <p className="text-sm text-red-700">{cam.error}</p>
        }
        <div className="flex flex-wrap gap-2">
          {!cam.active ? <button className="btn-ghost" onClick={cam.start}>Open camera</button>
            : <button className="btn-primary" onClick={snap} disabled={shots.length >= 4}>Capture photo</button>}
          <label className="btn-ghost cursor-pointer">Choose files<input type="file" accept="image/*" multiple hidden onChange={pickFiles} /></label>
        </div>

        {shots.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-2">
              {shots.map((s, i) => (
                <div key={i} className="relative">
                  <img src={s.url} className="aspect-square w-full rounded object-cover" alt={`New photo ${i + 1}`} />
                  <button onClick={() => setShots(shots.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded bg-ink/80 px-1.5 text-xs text-white" aria-label="Remove photo">×</button>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={uploadPhotos} disabled={shots.length < 3}>
              {shots.length < 3 ? `Add ${3 - shots.length} more photo(s)` : saved.length ? "Replace my photos" : "Save photos"}
            </button>
          </>
        )}

        {saved.length > 0 && (
          <div>
            <p className="label">Current photos</p>
            <div className="grid grid-cols-4 gap-2">{saved.map((u, i) => <img key={i} src={photoSrc(u)} className="aspect-square w-full rounded object-cover" alt={`Saved photo ${i + 1}`} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
