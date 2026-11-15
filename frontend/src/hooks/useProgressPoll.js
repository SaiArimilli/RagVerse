import { useEffect, useState } from "react";
import { experimentsApi } from "../services/api.js";

/** While `active` is true, poll embedding progress for a document every 500 ms. */
export default function useProgressPoll(active, documentId) {
  const [progress, setProgress] = useState({ done: 0, total: 0, percent: 0 });
  useEffect(() => {
    if (!active || !documentId) return undefined;
    setProgress({ done: 0, total: 0, percent: 0 });
    const timer = setInterval(async () => {
      try { setProgress((await experimentsApi.progress(documentId)).data); } catch { /* ignore */ }
    }, 500);
    return () => clearInterval(timer);
  }, [active, documentId]);
  return progress;
}
