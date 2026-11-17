import { useEffect, useState } from "react";
import api from "./api.js";

let cache = null;

/** Dropdown options (degrees, departments, sections) from the backend /meta endpoint. */
export default function useMeta() {
  const [meta, setMeta] = useState(cache);
  useEffect(() => {
    if (!cache) 
      api.get("/meta").then((r) => { cache = r.data; setMeta(r.data); });
  }, []);
  return meta;
}
