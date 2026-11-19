import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../api.js";
import useMeta from "../meta.js";
import StudentDetailsFields from "../components/StudentDetailsFields.jsx";
import PhotoUploader from "../components/PhotoUploader.jsx";

export default function AdminStudent() {
  const { id } = useParams();
  const meta = useMeta();
  const [p, setP] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);

  const apply = (d) => {
    setP(d);
    setForm({ name: d.name || "", roll_number: d.roll_number || "", phone: d.phone || "",
      batch_start_year: d.batch_start_year || new Date().getFullYear(),
      degree: d.degree || "", department: d.department || "", section: d.section || "" });
  };
  useEffect(() => { api.get(`/admin/students/${id}`).then((r) => apply(r.data)).catch((e) => setMsg({ type: "err", text: errMsg(e) })); }, [id]);

  if (!meta) return <p>Loading…</p>;
  if (!p || !form) return msg ? <p role="alert" className="alert-err">{msg.text}</p> : <p>Loading…</p>;

  async function save(e) {
    e.preventDefault(); setMsg(null);
    try {
      const { data } = await api.put(`/admin/students/${id}`, form);
      apply(data); setMsg({ type: "ok", text: "Details saved." });
    } catch (err) { setMsg({ type: "err", text: errMsg(err) }); }
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <Link to="/admin" className="text-sm text-brand underline">Back to students</Link>
        <h1 className="mt-2 text-2xl font-bold">{p.name}</h1>
        <p className="text-sm text-ink/60">{p.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={p.profile_complete ? "badge-brand" : "badge"}>{p.profile_complete ? "Profile complete" : "Profile incomplete"}</span>
          <span className="badge">{p.profile_locked ? "Details locked for the student" : "Student has not submitted yet"}</span>
          <span className="badge">{p.photos.length} photos</span>
        </div>
        {msg && <p role="alert" className={`mt-3 ${msg.type === "err" ? "alert-err" : "alert-ok"}`}>{msg.text}</p>}
      </div>

      <form onSubmit={save} className="panel space-y-4">
        <h2 className="font-bold">Details</h2>
        <p className="text-xs text-ink/60">As admin you can change any detail. Saving also locks the details for the student.</p>
        <StudentDetailsFields form={form} setForm={setForm} meta={meta} />
        <button className="btn-primary w-full">Save details</button>
      </form>

      <div className="panel">
        <PhotoUploader saved={p.photos} locked={false} warn={false}
          onUpload={async (blobs) => {
            const fd = new FormData();
            blobs.forEach((b, i) => fd.append("files", b, `photo${i}.jpg`));
            const { data } = await api.post(`/admin/students/${id}/photos`, fd);
            apply(data);
          }} />
        <p className="mt-3 text-xs text-ink/60">Admin uploads are not limited to once per semester. The same face checks still apply.</p>
      </div>
    </div>
  );
}
