import { Link } from "react-router-dom";
import { ArrowRight, Binary, Database, MessagesSquare, Scissors, Sparkles } from "lucide-react";
import ExperimentCard from "../components/ExperimentCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? "/dashboard" : "/register";
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 text-white"><Sparkles className="h-5 w-5" /></span>RagAI
        </div>
        <div className="flex gap-3 text-sm font-medium">
          {user ? <Link to="/dashboard" className="text-indigo-500">Dashboard</Link> : <><Link to="/login" className="py-2">Login</Link><Link to="/register" className="rounded-xl border border-slate-300 px-4 py-2 dark:border-slate-700">Sign up</Link></>}
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-500">Prompt Engineering · RAG · Vector Search · Gemini</span>
        <h1 className="mt-5 bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Ask questions. Get answers from your PDFs.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500 dark:text-slate-400">
          Upload a document and walk through four hands-on experiments: chunking, embeddings, vector search and Gemini-powered question answering, all in one dashboard.
        </p>
        <Link to={cta} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-violet-700">
          Get Started <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        <ExperimentCard number={1} title="PDF & Chunking" icon={Scissors} to={cta} description="Extract text from every page and split it into overlapping chunks." />
        <ExperimentCard number={2} title="Embeddings" icon={Binary} to={cta} description="Turn chunks into 384-dimensional vectors with MiniLM and ONNX Runtime." />
        <ExperimentCard number={3} title="Vector Search" icon={Database} to={cta} description="Index vectors and retrieve the most similar passages with scores." />
        <ExperimentCard number={4} title="RAG Chat" icon={MessagesSquare} to={cta} description="Gemini answers strictly from retrieved context, with page citations." />
      </section>
    </div>
  );
}
