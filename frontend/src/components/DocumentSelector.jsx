import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useDocuments } from "../context/DocumentContext.jsx";
import { Card, StatusBadge, inputCls } from "./ui.jsx";

/** The same selected document is shared by all four experiments. */
export default function DocumentSelector() {
  const { documents, selectedId, setSelectedId, selected, loading } = useDocuments();
  if (loading) return null;
  if (!documents.length)
    return (
      <Card className="mb-6 text-sm">
        No documents yet. <Link to="/documents" className="font-medium text-indigo-500 underline">Upload a PDF</Link> to begin.
      </Card>
    );
  return (
    <Card className="mb-6 flex flex-wrap items-center gap-3">
      <FileText className="h-5 w-5 text-indigo-500" />
      <select className={`${inputCls} max-w-md`} value={selectedId ?? ""} onChange={(e) => setSelectedId(Number(e.target.value))}>
        {documents.map((d) => <option key={d.id} value={d.id}>{d.title} ({d.page_count} pages)</option>)}
      </select>
      {selected && <StatusBadge status={selected.status} />}
    </Card>
  );
}
