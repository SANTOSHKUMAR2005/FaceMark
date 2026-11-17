import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api.js";

export default function StudentAttendance() {
  const [profile, setProfile] = useState(null);
  const [semester, setSemester] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [classId, setClassId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/students/me").then((r) => {
      setProfile(r.data);
      if (r.data.current_semester) 
        setSemester(r.data.current_semester);
    });
  }, []);

  useEffect(() => {
    setClassId(""); 
    setData(null);
    if (!profile?.current_semester) return;
    api.get("/students/me/subjects", { params: { semester } }).then((r) => setSubjects(r.data)).catch((e) => setError(errMsg(e)));
  }, [semester, profile]);

  useEffect(() => {
    if (!classId) return setData(null);
    api.get("/students/me/attendance", { params: { classroom_id: classId } }).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [classId]);

  if (!profile) return <p>Loading…</p>;
  if (!profile.current_semester)
    return <p className="panel text-sm">Fill in your batch, degree, department and section in <Link to="/student/profile" className="text-brand underline">My profile</Link> to see your attendance.</p>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">My attendance</h1>
      <p className="mb-4 text-sm text-ink/70">
        {profile.degree}, {profile.department}, Section {profile.section}, Batch {profile.batch_label}. You are in semester {profile.current_semester}.
      </p>
      {profile.photos_outdated && <p className="mb-4 rounded bg-amber/10 p-2 text-sm text-amber">New semester: <Link to="/student/profile" className="underline">update your photos</Link>.</p>}
      {!profile.profile_complete && <p className="mb-4 text-sm text-amber">Your profile is incomplete, so the camera cannot mark you present. <Link to="/student/profile" className="underline">Finish your profile.</Link></p>}
      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      <div className="panel mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Semester</label>
          <select className="input" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            {
            Array.from({ length: profile.total_semesters }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Semester {n}</option>)
            }
          </select>
        </div>
        <div>
          <label className="label">Subject</label>
          <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{subjects.length ? "Select a subject" : "No subjects in this semester"}</option>
            {
            subjects.map((s) => <option key={s.id} value={s.id}>{s.subject} ({s.teacher})</option>)
            }
          </select>
        </div>
      </div>

      {data && (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <div className="panel">
              <p className="text-2xl font-bold text-brand">{data.percentage}%</p>
              <p className="text-xs text-ink/60">Attendance</p>
            </div>
            <div className="panel">
              <p className="text-2xl font-bold">{data.attended}</p>
              <p className="text-xs text-ink/60">Classes attended</p>
            </div>
            <div className="panel">
              <p className="text-2xl font-bold">{data.total}</p>
              <p className="text-xs text-ink/60">Total classes</p>
            </div>
          </div>
          {data.records.length === 0 ? <p className="panel text-sm text-ink/70">No attendance has been submitted for this subject yet.</p> : (
            <div className="panel overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-ink/5 text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
                </thead>
                <tbody>{data.records.map((r) => (
                  <tr key={r.date} className="border-t border-ink/10">
                    <td className="p-3">{new Date(r.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className={`p-3 font-semibold ${r.present ? "text-brand" : "text-red-700"}`}>{r.present ? "Present" : "Absent"}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
