import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../api.js";
import useCamera from "../useCamera.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function TakeAttendance() {
  const { id } = useParams();
  const [info, setInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState(new Set()); // draft: lives only in the browser
  const [scanning, setScanning] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");
  const cam = useCamera();
  const scanningRef = useRef(false);

  useEffect(() => {
    api.get(`/classes/${id}/students`)
      .then((r) => { setInfo(r.data.class); setStudents(r.data.students); })
      .catch((e) => setError(errMsg(e)));
    return () => { scanningRef.current = false; cam.stop(); };
  }, [id]);

  // Scan loop: send one frame, wait for the answer, repeat.
  async function scanLoop() {
    while (scanningRef.current) {
      const frame = await cam.capture();
      if (frame) {
        const fd = new FormData();
        fd.append("frame", frame, "frame.jpg");
        try {
          const { data } = await api.post(`/classes/${id}/recognize`, fd);
          setPresent((prev) => new Set([...prev, ...data.recognized_ids]));
        } catch (e) { setError(errMsg(e)); }
      }
      await sleep(700);
    }
  }

  async function startScan() {
    setError("");
    if (!cam.active) await cam.start();
    scanningRef.current = true;
    setScanning(true);
    scanLoop();
  }

  function pauseScan() {
    scanningRef.current = false;
    setScanning(false);
  }

  function retake() {
    setPresent(new Set());
    setSubmitted(null);
    startScan();
  }

  async function submit() {
    pauseScan();
    try {
      const { data } = await api.post(`/classes/${id}/submit`, { present_ids: [...present] });
      cam.stop();
      setSubmitted(data);
    } catch (e) { setError(errMsg(e)); }
  }

  const toggle = (sid) => setPresent((p) => { const n = new Set(p); n.has(sid) ? n.delete(sid) : n.add(sid); return n; });

  return (
    <div>
      <Link to="/teacher" className="text-sm text-brand underline">Back to classes</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{info ? info.subject : "Take attendance"}</h1>
      {info && <p className="mb-1 text-sm text-ink/70">{info.department}: {info.label}</p>}
      <p className="mb-5 text-sm text-ink/70">Recognized students are marked present in a draft. Nothing is saved until you press Submit attendance.</p>
      {error && <p role="alert" className="alert-err mb-4">{error}</p>}
      {cam.error && <p role="alert" className="alert-err mb-4">{cam.error}</p>}

      {submitted ? (
        <div className="panel">
          <h2 className="text-lg font-bold text-brand">Attendance submitted</h2>
          <p className="mt-1">{submitted.present} of {submitted.total} students present today.</p>
          <div className="mt-4 flex gap-2">
            <Link to={`/teacher/classes/${id}/attendance`} className="btn-primary">View attendance</Link>
            <button className="btn-ghost" onClick={retake}>Take again</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="panel">
            <div className="relative aspect-4/3 overflow-hidden rounded bg-ink">
              <video ref={cam.videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              {!cam.active && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Camera is off</p>}
              {scanning && <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Scanning faces…</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!scanning
                ? <button className="btn-primary" onClick={startScan} disabled={students.length === 0}>{present.size ? "Resume scanning" : "Take attendance"}</button>
                : <button className="btn-ghost" onClick={pauseScan}>Pause scanning</button>}
              <button className="btn-primary" onClick={submit} disabled={!cam.active && present.size === 0}>Submit attendance</button>
              <button className="btn-warn" onClick={retake} disabled={present.size === 0 && !scanning}>Retake attendance</button>
            </div>
            {students.length === 0 && <p className="mt-3 text-sm text-ink/70">No students of this batch, degree, department and section have completed their profile with photos yet.</p>}
          </div>

          <div className="panel">
            <h2 className="mb-1 font-bold">Students ({present.size}/{students.length} present)</h2>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-brand transition-all" style={{ width: `${students.length ? (present.size * 100) / students.length : 0}%` }} /></div>
            <p className="mb-3 text-xs text-ink/60">Click a name to correct it by hand.</p>
            <ul className="max-h-105 divide-y divide-ink/10 overflow-auto">
              {students.map((s) => (
                <li key={s.id}>
                  <button onClick={() => toggle(s.id)} className="flex w-full items-center justify-between py-2 text-left text-sm">
                    <span>{s.name} <span className="text-ink/50">({s.roll_number})</span><span className="block text-xs text-ink/50">{s.degree} · {s.batch_label}</span></span>
                    <span className={present.has(s.id) ? "font-semibold text-brand" : "text-ink/40"}>{present.has(s.id) ? "Present" : "Absent"}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
