import { useCallback, useRef, useState } from "react";

/** Webcam helper: start/stop the camera and grab JPEG frames. */
export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  const start = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        { 
          video: { 
            width: 640, 
            height: 480 
          } 
        }
      );
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true);
    } catch {
      setError("Could not open the camera. Allow camera access in your browser and try again.");
    }
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const capture = useCallback(
    () =>
      new Promise((resolve) => {
        const v = videoRef.current;
        if (!v || !v.videoWidth) return resolve(null);
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        c.toBlob(resolve, "image/jpeg", 0.85);
      }),
    []
  );

  return { videoRef, active, error, start, stop, capture };
}
