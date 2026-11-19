import { useEffect, useState } from "react";
import api, { errMsg } from "../api.js";
import useMeta from "../meta.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import StudentDetailsFields from "../components/StudentDetailsFields.jsx";
import PhotoUploader from "../components/PhotoUploader.jsx";

const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function StudentProfile() {
  const meta = useMeta();
  const [p, setP] = useState(null);       // profile from the server
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const apply = (d) => {
    setP(d);
    setForm({
      name: d.name || "", roll_number: d.roll_number || "", phone: d.phone || "",
      batch_start_year: d.batch_start_year || new Date().getFullYear(),
      degree: d.degree || "", department: d.department || "", section: d.section || ""
    });
  };
  useEffect(() => { api.get("/students/me").then((r) => apply(r.data)); }, []);

  if (!meta || !p || !form) return <p>Loading…</p>;

  async function submitProfile() {
    setBusy(true); setMsg(null);
    try {
      const { data } = await api.put("/students/me", { ...form, confirm: true });
      apply(data);
      setMsg({ type: "ok", text: "Profile submitted. Now add your face photos." });
    } catch (err) { setMsg({ type: "err", text: errMsg(err) }); }
    finally { setBusy(false); setConfirmOpen(false); }
  }

  const photoLockText = p.next_photo_update
    ? `You have already updated your photos this semester. You can update them again from ${fmtDate(p.next_photo_update)}.`
    : "You have already updated your photos this semester. Contact your college if they must be changed.";

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <div className="space-y-3 md:col-span-2">
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className={p.profile_complete ? "alert-ok" : "alert-warn"}>
          {p.profile_complete ? "Profile complete. You can be marked present by face." : "Submit your details and add 3 or 4 photos so the camera can recognise you."}
        </p>
        {p.photos_outdated && !p.photos_locked && <p className="alert-warn">A new semester has started. You can update your photos now (once this semester).</p>}
        {msg && <p role="alert" className={msg.type === "err" ? "alert-err" : "alert-ok"}>{msg.text}</p>}
      </div>

      <form className="panel space-y-4" onSubmit={(e) => { e.preventDefault(); if (!p.profile_locked) setConfirmOpen(true); }}>
        <h2 className="font-bold">Details</h2>
        {p.profile_locked ? (
          <p className="alert-ok">Your profile is submitted and locked. Academic details do not change during your course. If something is wrong, ask your college to correct it.</p>
        ) : (
          <div className="alert-warn space-y-1">
            <p className="font-semibold">Important: you can submit your profile only once.</p>
            <p>After you submit, you cannot change these details yourself. Fill them in carefully. If you have any doubt, ask your college before submitting.</p>
          </div>)}
        <StudentDetailsFields form={form} setForm={setForm} meta={meta} disabled={p.profile_locked} />
        {!p.profile_locked && <button className="btn-primary w-full">Submit profile</button>}
      </form>

      <div className="panel">
        {!p.profile_locked
          ? <div className="space-y-2"><h2 className="font-bold">Face photos</h2><p className="text-sm text-ink/70">Submit your profile first. Then you can add your photos here.</p></div>
          : <PhotoUploader saved={p.photos} locked={p.photos_locked} lockedMessage={photoLockText} warn
            onUpload={async (blobs) => {
              const fd = new FormData();
              blobs.forEach((b, i) => fd.append("files", b, `photo${i}.jpg`));
              const { data } = await api.post("/students/me/photos", fd);
              apply(data);
            }} />}
      </div>

      <ConfirmDialog open={confirmOpen} tone="warn" title="Submit your profile?" confirmText="Submit profile" busy={busy}
        checkLabel="I have checked every detail. I understand I cannot change it myself after submitting."
        onCancel={() => setConfirmOpen(false)} onConfirm={submitProfile}>
        <p><b>{form.name}</b>, roll number <b>{form.roll_number}</b></p>
        <p>{form.degree}, {form.department}, Section {form.section}, batch starting {form.batch_start_year}.</p>
        <p>These academic details stay the same for your whole course. Only the college admin can change them later.</p>
      </ConfirmDialog>
    </div>
  );
}
