import { useState } from "react";
import { CheckCircle2, Circle, Loader2, Play, XCircle } from "lucide-react";
import { experimentsApi, ragApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import DocumentSelector from "../components/DocumentSelector.jsx";
import PDFUploader from "../components/PDFUploader.jsx";
import { Badge, Btn, Card, Field, PageHeader, inputCls } from "../components/ui.jsx";

const STEPS = [
  { id: 1, name: "Experiment 1 · Extract & chunk" },
  { id: 2, name: "Experiment 2 · Generate embeddings" },
  { id: 3, name: "Experiment 3 · Build vector index & search" },
  { id: 4, name: "Experiment 4 · Gemini RAG answer" },
];

export default function CompleteWorkflow() {
  const toast = useToast();
  const { selected, refresh, setSelectedId } = useDocuments();
  const [question, setQuestion] = useState("");
  const [state, setState] = useState({}); // id -> {status, note}
  const [running, setRunning] = useState(false);
  const [final, setFinal] = useState(null);

  const mark = (id, status, note = "") => setState((s) => ({ ...s, [id]: { status, note } }));

  const run = async () => {
    setRunning(true); setState({}); setFinal(null);
    const id = selected.id;
    let step = 1;
    try {
      mark(1, "running");
      const c = (await experimentsApi.chunk(id, 1000, 200)).data;
      mark(1, "done", `${c.total_pages} pages → ${c.total_chunks} chunks`);

      step = 2; mark(2, "running");
      const e = (await experimentsApi.embed(id, "sentence-transformers/all-MiniLM-L6-v2")).data;
      mark(2, "done", `${e.total_embeddings} vectors × ${e.dimension} dims in ${e.seconds}s`);

      step = 3; mark(3, "running");
      const ix = (await experimentsApi.index(id)).data;
      const top = (await experimentsApi.search(id, question, 5)).data.results;
      mark(3, "done", `${ix.total_vectors} vectors indexed · best match page ${top[0]?.page ?? "-"} (score ${top[0]?.score ?? "-"})`);

      step = 4; mark(4, "running");
      const a = (await ragApi.ask(id, question, null)).data;
      mark(4, "done", `${a.sources.length} sources retrieved`);
      setFinal(a);
      toast.success("Workflow complete");
    } catch (err) {
      mark(step, "error", errMsg(err));
      toast.error(errMsg(err));
    } finally { setRunning(false); refresh(); }
  };

  const icon = (s) => s === "done" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : s === "running" ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : s === "error" ? <XCircle className="h-5 w-5 text-rose-500" /> : <Circle className="h-5 w-5 text-slate-400" />;

  return (
    <>
      <PageHeader title="Complete Workflow" subtitle="Run all four experiments back-to-back on one document with default settings (chunk 1000 / overlap 200)." />
      <Card className="mb-6"><PDFUploader onUploaded={(d) => { setSelectedId(d.id); refresh(); }} /></Card>
      <DocumentSelector />
      {selected && (
        <Card>
          <Field label="Your question"><input className={inputCls} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is the role of water in the human body?" /></Field>
          <Btn className="mt-4" loading={running} disabled={!question.trim()} onClick={run}><Play className="h-4 w-4" />Run all 4 experiments</Btn>
          <ol className="mt-6 space-y-3">
            {STEPS.map((s) => (
              <li key={s.id} className="flex items-start gap-3">
                {icon(state[s.id]?.status)}
                <div><p className="text-sm font-medium">{s.name}</p>{state[s.id]?.note && <p className={`text-xs ${state[s.id].status === "error" ? "text-rose-500" : "text-slate-500"}`}>{state[s.id].note}</p>}</div>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {final && (
        <Card className="mt-6">
          <h3 className="mb-2 font-semibold">Answer</h3>
          <p className="whitespace-pre-wrap text-sm">{final.answer}</p>
          <div className="mt-3 flex flex-wrap gap-2">{[...new Set(final.sources.map((s) => s.page))].sort((a, b) => a - b).map((p) => <Badge key={p} tone="blue">Page {p}</Badge>)}</div>
        </Card>
      )}
    </>
  );
}
