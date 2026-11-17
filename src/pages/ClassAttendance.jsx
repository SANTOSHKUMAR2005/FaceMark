import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg } from "../api.js";

const fmt = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export default function ClassAttendance() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api.get(`/classes/${id}/attendance`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e))); }, [id]);

  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <div>
      <Link to="/teacher" className="text-sm text-brand underline"><button className="p-1 px-1.5 bg-emerald-300 rounded-2xl">Back to classes</button></Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{data.class.subject} (Semester {data.class.semester})</h1>
      <p className="mb-1 text-sm text-ink/70">{data.class.name}</p>
      <p className="mb-5 text-sm text-ink/70">Today and the previous 4 days. A dash means no attendance was submitted that day.</p>
      {data.students.length === 0 ? (
        <p className="panel text-sm text-ink/70">No attendance has been submitted in the last 5 days.</p>
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left">
              <tr>
                <th className="p-3">Roll no.</th><th className="p-3">Name</th>
                {data.dates.map((d) => <th key={d} className="p-3 text-center">{fmt(d)}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id} className="border-t border-ink/10">
                  <td className="p-3">{s.roll_number}</td><td className="p-3">{s.name}</td>
                  {data.dates.map((d) => {
                    const m = s.marks[d];
                    return <td key={d} className={`p-3 text-center font-semibold ${m === true ? "text-brand" : m === false ? "text-red-700" : "text-ink/30"}`}>{m === true ? "P" : m === false ? "A" : "–"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
