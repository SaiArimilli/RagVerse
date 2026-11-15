import { useState } from "react";
import { Binary, Hash, Ruler } from "lucide-react";
import { experimentsApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import useProgressPoll from "../hooks/useProgressPoll.js";
import DocumentSelector from "../components/DocumentSelector.jsx";
import { Badge, Btn, Card, CodePanel, Field, PageHeader, ProgressBar, Stat, inputCls } from "../components/ui.jsx";

const MODELS = ["sentence-transformers/all-MiniLM-L6-v2", "sentence-transformers/paraphrase-MiniLM-L3-v2"];

export default function Experiment2() {
  const toast = useToast();
  const { selected, refresh } = useDocuments();
  const [model, setModel] = useState(MODELS[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState("");
  const [qResult, setQResult] = useState(null);
  const [qBusy, setQBusy] = useState(false);
  const progress = useProgressPoll(running, selected?.id);

  const generate = async () => {
    setRunning(true); setResult(null);
    try { setResult((await experimentsApi.embed(selected.id, model)).data); toast.success("Embeddings generated"); refresh(); }
    catch (e) { toast.error(errMsg(e)); } finally { setRunning(false); }
  };
  const embedQuery = async () => {
    setQBusy(true);
    try { setQResult((await experimentsApi.embedQuery(selected.id, model, query)).data); }
    catch (e) { toast.error(errMsg(e)); } finally { setQBusy(false); }
  };

  return (
    <>
      <PageHeader title="Experiment 2 · Text Embeddings" subtitle="Convert every chunk into a numerical vector with MiniLM through ONNX Runtime. Vectors are normalised so dot product equals cosine similarity." />
      <DocumentSelector />
      {selected && (
        <>
          <Card>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2"><Field label="Embedding model"><select className={inputCls} value={model} onChange={(e) => setModel(e.target.value)}>{MODELS.map((m) => <option key={m}>{m}</option>)}</select></Field></div>
              <div className="flex items-end"><Btn loading={running} onClick={generate} disabled={!selected.chunk_count} className="w-full"><Binary className="h-4 w-4" />Generate embeddings</Btn></div>
            </div>
            {!selected.chunk_count && <p className="mt-3 text-sm text-amber-500">Run Experiment 1 (chunking) first.</p>}
            {running && <div className="mt-4"><ProgressBar value={progress.percent} label={`Embedding chunks… ${progress.done}/${progress.total || "?"} (first run downloads the model)`} /></div>}
          </Card>

          {result && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <Stat label="Embeddings generated" value={result.total_embeddings} icon={Hash} />
                <Stat label="Dimensions" value={result.dimension} icon={Ruler} />
                <Stat label="Time (s)" value={result.seconds} icon={Binary} />
              </div>
              <Card className="mt-6">
                <h3 className="mb-3 font-semibold">Sample vectors (first 8 values)</h3>
                <div className="space-y-3">
                  {result.samples.map((s) => (
                    <div key={s.chunk_index}>
                      <div className="mb-1 flex items-center gap-2 text-xs"><Badge tone="blue">Chunk #{s.chunk_index}</Badge><Badge>Page {s.page}</Badge><span className="truncate text-slate-500">{s.preview}…</span></div>
                      <CodePanel>[{s.values.join(", ")}, …]</CodePanel>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          <Card className="mt-6">
            <h3 className="mb-3 font-semibold">Query embedding</h3>
            <div className="flex gap-2">
              <input className={inputCls} placeholder="Type a question to embed…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Btn variant="secondary" loading={qBusy} disabled={!query.trim()} onClick={embedQuery}>Embed</Btn>
            </div>
            {qResult && <CodePanel className="mt-3" title={`${qResult.dimension} dimensions · norm ${qResult.norm}`}>[{qResult.sample_values.join(", ")}, …]</CodePanel>}
          </Card>
        </>
      )}
    </>
  );
}
