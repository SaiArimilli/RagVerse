import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { documentsApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { ProgressBar } from "./ui.jsx";

/** Drag-and-drop (or click) PDF upload. Calls onUploaded(document) on success. */
export default function PDFUploader({ onUploaded }) {
  const toast = useToast();
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(null);

  const upload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) return toast.error("Only PDF files are allowed.");
    setProgress(0);
    try {
      const { data } = await documentsApi.upload(file, setProgress);
      toast.success(`Uploaded "${data.title}" (${data.page_count} pages)`);
      onUploaded?.(data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
      onClick={() => input.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${drag ? "border-indigo-500 bg-indigo-500/10" : "border-slate-300 hover:border-indigo-400 dark:border-slate-700"}`}
    >
      <input ref={input} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => upload(e.target.files[0])} />
      <UploadCloud className="mx-auto h-10 w-10 text-indigo-500" />
      <p className="mt-2 font-medium">Drag & drop a PDF here, or click to browse</p>
      <p className="text-xs text-slate-500">Max 25 MB. Password-protected PDFs are not supported.</p>
      {progress !== null && <div className="mx-auto mt-4 max-w-xs"><ProgressBar value={progress} label="Uploading" /></div>}
    </div>
  );
}
