import { useEffect, useState } from "react";
import { FileText, Layers, Scissors } from "lucide-react";
import { experimentsApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import DocumentSelector from "../components/DocumentSelector.jsx";
import { Badge, Btn, Card, Field, PageHeader, Stat, inputCls } from "../components/ui.jsx";

const PER_PAGE = 8;

export default function Experiment1() {
  const toast = useToast();
  const { selected, refresh } = useDocuments();
  const [size, setSize] = useState(1000);
  const [overlap, setOverlap] = useState(200);
  const [extraction, setExtraction] = useState(null);
  const [chunkData, setChunkData] = useState(null);
  const [busy, setBusy] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [pageNo, setPageNo] = useState(0);

  // Load chunks already saved for this document
  useEffect(() => {
    setExtraction(null); setChunkData(null); setPageFilter("all"); setPageNo(0);
    if (!selected) return;
    experimentsApi.chunks(selected.id).then((r) => r.data.total_chunks && setChunkData(r.data)).catch(() => {});
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const extract = async () => {
    setBusy("extract");
    try { setExtraction((await experimentsApi.extract(selected.id)).data); toast.success("Text extracted"); refresh(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); }
  };
  const chunk = async () => {
    setBusy("chunk");
    try { setChunkData((await experimentsApi.chunk(selected.id, Number(size), Number(overlap))).data); setPageNo(0); toast.success("Chunks created"); refresh(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); }
  };

  const chunks = (chunkData?.chunks || []).filter((c) => pageFilter === "all" || c.page === Number(pageFilter));
  const pages = Math.max(1, Math.ceil(chunks.length / PER_PAGE));
  const visible = chunks.slice(pageNo * PER_PAGE, (pageNo + 1) * PER_PAGE);

  return (
    <>
      <PageHeader title="Experiment 1 · PDF Loading & Chunking" subtitle="Extract text from each page, then split it with RecursiveCharacterTextSplitter. Every chunk keeps its original page number." />
      <DocumentSelector />
      {selected && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="PDF" value={<span className="block max-w-[14rem] truncate text-base">{selected.title}</span>} icon={FileText} />
            <Stat label="Total pages" value={selected.page_count} icon={FileText} />
            <Stat label="Total chunks" value={chunkData?.total_chunks ?? 0} icon={Layers} />
          </div>

          <Card className="mt-6">
            <h3 className="mb-3 font-semibold">Settings</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Chunk size (chars)"><input type="number" min={100} max={5000} className={inputCls} value={size} onChange={(e) => setSize(e.target.value)} /></Field>
              <Field label="Chunk overlap (chars)"><input type="number" min={0} max={2000} className={inputCls} value={overlap} onChange={(e) => setOverlap(e.target.value)} /></Field>
              <div className="flex items-end"><Btn variant="secondary" loading={busy === "extract"} onClick={extract} className="w-full">Extract text</Btn></div>
              <div className="flex items-end"><Btn loading={busy === "chunk"} onClick={chunk} className="w-full"><Scissors className="h-4 w-4" />Split into chunks</Btn></div>
            </div>
          </Card>

          {extraction && (
            <Card className="mt-6">
              <h3 className="mb-3 font-semibold">Extracted text · {extraction.total_pages} pages</h3>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {extraction.pages.map((p) => (
                  <details key={p.page} className="rounded-xl border border-slate-200 dark:border-slate-700">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Page {p.page} <span className="text-xs text-slate-500">({p.char_count} chars)</span></summary>
                    <pre className="whitespace-pre-wrap border-t border-slate-200 p-3 text-xs dark:border-slate-700">{p.text || "(no text on this page)"}</pre>
                  </details>
                ))}
              </div>
            </Card>
          )}

          {chunkData && (
            <Card className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">Chunks ({chunks.length})</h3>
                <select className={`${inputCls} max-w-[10rem]`} value={pageFilter} onChange={(e) => { setPageFilter(e.target.value); setPageNo(0); }}>
                  <option value="all">All pages</option>
                  {Array.from({ length: selected.page_count }, (_, i) => <option key={i} value={i + 1}>Page {i + 1}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {visible.map((c) => (
                  <div key={c.chunk_index} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <div className="mb-2 flex gap-2"><Badge tone="blue">Chunk #{c.chunk_index}</Badge><Badge>Page {c.page}</Badge><Badge>{c.char_count} chars</Badge></div>
                    <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                  </div>
                ))}
                {!visible.length && <p className="text-sm text-slate-500">No chunks for this page.</p>}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <Btn variant="secondary" disabled={pageNo === 0} onClick={() => setPageNo(pageNo - 1)}>Previous</Btn>
                <span>{pageNo + 1} / {pages}</span>
                <Btn variant="secondary" disabled={pageNo + 1 >= pages} onClick={() => setPageNo(pageNo + 1)}>Next</Btn>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
