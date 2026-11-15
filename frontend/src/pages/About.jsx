import { ArrowRight } from "lucide-react";
import { Badge, Card, PageHeader } from "../components/ui.jsx";

const STACK = ["React + Vite", "Tailwind CSS", "Recharts", "Django REST Framework", "PyMuPDF", "LangChain text splitters", "MiniLM + ONNX Runtime", "NumPy vector search", "Google Gemini (google-genai)", "SQLite"];
const FLOW = ["Upload PDF", "Extract text per page", "Chunk (1000/200)", "Embed (MiniLM, 384-d)", "Vector search index", "Retrieve top-k", "Gemini answers + cites pages"];

export default function About() {
  return (
    <>
      <PageHeader title="About the Project" subtitle="A single integrated platform that combines four Prompt Engineering / RAG experiments." />
      <Card>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The application answers questions about an uploaded PDF using Retrieval-Augmented Generation. The text is extracted and chunked, each chunk is embedded
          into a vector, vectors are stored in a persistent NumPy index, and at question time the most relevant chunks are retrieved and handed to Gemini with
          strict instructions to answer only from that context. If the answer is not in the document, the assistant says so rather than guessing.
        </p>
      </Card>
      <Card className="mt-4"><h3 className="mb-3 font-semibold">Workflow</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">{FLOW.map((s, i) => <span key={s} className="flex items-center gap-2"><Badge tone="blue">{s}</Badge>{i < FLOW.length - 1 && <ArrowRight className="h-4 w-4 text-slate-400" />}</span>)}</div>
      </Card>
      <Card className="mt-4"><h3 className="mb-3 font-semibold">Technologies</h3><div className="flex flex-wrap gap-2">{STACK.map((s) => <Badge key={s}>{s}</Badge>)}</div></Card>
    </>
  );
}
