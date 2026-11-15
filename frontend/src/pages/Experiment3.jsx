import { useState } from "react";
import { Database, Search } from "lucide-react";
import { experimentsApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import DocumentSelector from "../components/DocumentSelector.jsx";
import { Badge, Btn, Card, PageHeader, ProgressBar, Stat, inputCls } from "../components/ui.jsx";

export default function Experiment3() {
  const toast = useToast();
  const { selected, refresh } = useDocuments();
  const [indexInfo, setIndexInfo] = useState(null);
  const [building, setBuilding] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [inspect, setInspect] = useState(null);

  const build = async () => {
    setBuilding(true);
    try { setIndexInfo((await experimentsApi.index(selected.id)).data); toast.success("Vector index built and saved"); refresh(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBuilding(false); }
  };
  const search = async (e) => {
    e.preventDefault();
    setSearching(true); setInspect(null);
    try { setResults((await experimentsApi.search(selected.id, query.trim(), 5)).data.results); }
    catch (err) { toast.error(errMsg(err)); } finally { setSearching(false); }
  };

  const ready = selected && ["embedded", "indexed"].includes(selected.status);
  return (
    <>
      <PageHeader title="Experiment 3 · Vector Search & Semantic Search" subtitle="Store embeddings in a NumPy index (saved to disk, so it survives restarts) and retrieve the top 5 most similar chunks." />
      <DocumentSelector />
      {selected && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-semibold">Build index</h3><p className="text-sm text-slate-500">Requires embeddings from Experiment 2.</p></div>
              <Btn loading={building} disabled={!ready} onClick={build}><Database className="h-4 w-4" />{selected.status === "indexed" ? "Rebuild index" : "Create vector index"}</Btn>
            </div>
            {building && <div className="mt-4"><ProgressBar value={60} label="Indexing…" /></div>}
          </Card>

          {indexInfo && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat label="Vectors stored" value={indexInfo.total_vectors} icon={Database} />
              <Stat label="Dimension" value={indexInfo.dimension} icon={Database} />
              <Stat label="Index size (KB)" value={indexInfo.index_size_kb} icon={Database} hint="IndexFlatIP · cosine" />
            </div>
          )}

          <Card className="mt-6">
            <h3 className="mb-3 font-semibold">Semantic search</h3>
            <form onSubmit={search} className="flex gap-2">
              <input className={inputCls} placeholder="e.g. What does water do in the body?" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Btn type="submit" loading={searching} disabled={!query.trim() || selected.status !== "indexed"}><Search className="h-4 w-4" />Search</Btn>
            </form>
            {selected.status !== "indexed" && <p className="mt-2 text-sm text-amber-500">Build the index first.</p>}
          </Card>

          {results && (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                {results.map((r) => (
                  <button key={r.chunk_index} onClick={() => setInspect(r)} className={`block w-full rounded-2xl border p-4 text-left transition hover:border-indigo-400 ${inspect?.chunk_index === r.chunk_index ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                    <div className="mb-2 flex items-center gap-2"><Badge tone="blue">#{r.rank}</Badge><Badge>Page {r.page}</Badge><span className="ml-auto text-xs font-semibold">score {r.score}</span></div>
                    <ProgressBar value={Math.max(0, Math.round(r.score * 100))} />
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{r.content}</p>
                  </button>
                ))}
                {!results.length && <p className="text-sm text-slate-500">No results.</p>}
              </div>
              <Card className="h-fit lg:sticky lg:top-24">
                <h3 className="mb-2 font-semibold">Retrieved text</h3>
                {inspect ? (<><div className="mb-2 flex gap-2"><Badge tone="blue">Chunk #{inspect.chunk_index}</Badge><Badge>Page {inspect.page}</Badge></div><p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">{inspect.content}</p></>) : <p className="text-sm text-slate-500">Click a result to inspect its full text.</p>}
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}
