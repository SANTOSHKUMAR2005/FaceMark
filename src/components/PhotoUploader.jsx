import { useEffect, useState } from "react";
import { errMsg, photoSrc } from "../api.js";
import useCamera from "../useCamera.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

/**
 * Capture or choose 3-4 photos and upload them.
 * warn=true  -> student mode: two warnings before saving.
 * locked=true -> shows only the saved photos and lockedMessage.
 */
export default function PhotoUploader({ saved, locked, lockedMessage, warn, onUpload }) {
  const cam = useCamera();
  const [shots, setShots] = useState([]);
  const [step, setStep] = useState(0); // 0 = closed, 1 = first warning, 2 = second warning
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => () => cam.stop(), []);

  async function snap() {
    const blob = await cam.capture();
    if (blob && shots.length < 4) setShots([...shots, { blob, url: URL.createObjectURL(blob) }]);
  }
  function pickFiles(e) {
    const files = [...e.target.files].slice(0, 4 - shots.length);
    setShots([...shots, ...files.map((f) => ({ blob: f, url: URL.createObjectURL(f) }))]);
    e.target.value = "";
  }

  async function doUpload() {
    setBusy(true); setMsg(null);
    try {
      await onUpload(shots.map((s) => s.blob));
      setShots([]); cam.stop();
      setMsg({ type: "ok", text: "Photos saved. Your face data is ready for attendance." });
    } catch (err) { setMsg({ type: "err", text: errMsg(err) }); }
    finally { setBusy(false); setStep(0); }
  }
  const requestSave = () => (warn ? setStep(1) : doUpload());

  const savedGrid = saved.length > 0 && (
    <div>
      <p className="label">Current photos</p>
      <div className="grid grid-cols-4 gap-2">{saved.map((u, i) => <img key={i} src={photoSrc(u)} className="aspect-square w-full rounded-lg object-cover" alt={`Saved photo ${i + 1}`} />)}</div>
    </div>);

  if (locked) return <div className="space-y-4"><h2 className="font-bold">Face photos</h2><p className="alert-warn">{lockedMessage}</p>{savedGrid}</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-bold">Face photos (3 or 4)</h2>
      <ul className="list-disc space-y-0.5 pl-5 text-xs text-ink/70">
        <li>Your face must fill <b>most of the photo</b>. Come close to the camera.</li>
        <li>Good light, face the camera, only you in the frame, no sunglasses or mask.</li>
        <li>Vary your angle slightly between photos.</li>
      </ul>

      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-ink">
        <video ref={cam.videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {!cam.active && <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Camera is off</p>}
        {cam.active && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="h-[82%] w-[56%] rounded-[50%] border-2 border-dashed border-white/80" />
            <span className="absolute bottom-2 rounded-full bg-ink/70 px-3 py-1 text-xs text-white">Fill the oval with your face</span>
          </div>)}
      </div>
      {cam.error && <p className="alert-err">{cam.error}</p>}
      <div className="flex flex-wrap gap-2">
        {!cam.active ? <button type="button" className="btn-ghost" onClick={cam.start}>Open camera</button>
          : <button type="button" className="btn-primary" onClick={snap} disabled={shots.length >= 4}>Capture photo</button>}
        <label className="btn-ghost cursor-pointer">Choose files<input type="file" accept="image/*" multiple hidden onChange={pickFiles} /></label>
      </div>

      {shots.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {shots.map((s, i) => (
              <div key={i} className="relative">
                <img src={s.url} className="aspect-square w-full rounded-lg object-cover" alt={`New photo ${i + 1}`} />
                <button type="button" onClick={() => setShots(shots.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded bg-ink/80 px-1.5 text-xs text-white" aria-label="Remove photo">×</button>
              </div>))}
          </div>
          <button type="button" className="btn-primary w-full" onClick={requestSave} disabled={shots.length < 3 || busy}>
            {shots.length < 3 ? `Add ${3 - shots.length} more photo(s)` : saved.length ? "Replace my photos" : "Save photos"}
          </button>
        </>)}
      {msg && <p role="alert" className={msg.type === "err" ? "alert-err" : "alert-ok"}>{msg.text}</p>}
      {savedGrid}

      <ConfirmDialog open={step === 1} tone="warn" title="Upload your photos carefully" confirmText="I understand, continue" onCancel={() => setStep(0)} onConfirm={() => setStep(2)}>
        <p>You can change your photos <b>only once per semester</b>. After you save, you cannot change them until the next semester starts.</p>
        <p>Your face must fill most of each photo, in good light, with only you in the frame.</p>
      </ConfirmDialog>
      <ConfirmDialog open={step === 2} tone="warn" title="Final confirmation" confirmText="Save my photos" checkLabel="I have checked that my photos are clear and my face fills most of the frame." busy={busy} onCancel={() => setStep(0)} onConfirm={doUpload}>
        <p>Are you sure? You will <b>not be able to change these photos before next semester</b>.</p>
      </ConfirmDialog>
    </div>
  );
}
