import { useState } from "react";
import { Eye, FileText, Trash2, X } from "lucide-react";
import { documentsApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import PDFUploader from "../components/PDFUploader.jsx";
import { Btn, Card, PageHeader, Spinner, StatusBadge } from "../components/ui.jsx";

const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function Documents() {
  const toast = useToast();
  const { documents, refresh, loading, selectedId, setSelectedId } = useDocuments();
  const [preview, setPreview] = useState(null); // { title, url }

  const openPreview = async (doc) => {
    try {
      const { data } = await documentsApi.fileBlob(doc.id);
      setPreview({ title: doc.title, url: URL.createObjectURL(data) });
    } catch (e) { toast.error(errMsg(e)); }
  };
  const closePreview = () => { URL.revokeObjectURL(preview.url); setPreview(null); };

  const remove = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}" and all its chunks, index and chats?`)) return;
    try { await documentsApi.remove(doc.id); toast.success("Document deleted"); refresh(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Documents" subtitle="Upload and manage the PDFs used across all four experiments." />
      <PDFUploader onUploaded={(d) => { setSelectedId(d.id); refresh(); }} />

      <Card className="mt-6">
        {loading ? <Spinner /> : !documents.length ? <p className="text-sm text-slate-500">No documents yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Name</th><th>Pages</th><th>Size</th><th>Chunks</th><th>Status</th><th /></tr></thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3"><span className="flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-indigo-500" />{d.title}{d.id === selectedId && <span className="rounded bg-indigo-500/10 px-1.5 text-[10px] text-indigo-500">ACTIVE</span>}</span></td>
                    <td>{d.page_count}</td><td>{fmtSize(d.file_size)}</td><td>{d.chunk_count}</td><td><StatusBadge status={d.status} /></td>
                    <td className="space-x-1 whitespace-nowrap text-right">
                      {d.id !== selectedId && <Btn variant="ghost" onClick={() => setSelectedId(d.id)}>Use</Btn>}
                      <Btn variant="ghost" onClick={() => openPreview(d)}><Eye className="h-4 w-4" /></Btn>
                      <Btn variant="ghost" onClick={() => remove(d)}><Trash2 className="h-4 w-4 text-rose-500" /></Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4">
          <div className="mb-2 flex items-center justify-between text-white"><span className="font-medium">{preview.title}</span><button onClick={closePreview}><X /></button></div>
          <iframe title="PDF preview" src={preview.url} className="flex-1 rounded-xl bg-white" />
        </div>
      )}
    </>
  );
}
