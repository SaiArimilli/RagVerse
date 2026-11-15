import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Binary, Database, FileText, Layers, MessagesSquare, Scissors, Search } from "lucide-react";
import { dashboardApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import ExperimentCard from "../components/ExperimentCard.jsx";
import { Card, PageHeader, Spinner, Stat, StatusBadge } from "../components/ui.jsx";

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e"];
const ICONS = { 1: Scissors, 2: Binary, 3: Database, 4: MessagesSquare };
const DESC = {
  1: "Extract text and split into chunks.", 2: "Generate sentence embeddings.",
  3: "Build vector index and search.", 4: "Ask Gemini grounded questions.",
};

export default function Dashboard() {
  const toast = useToast();
  const { documents } = useDocuments();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.stats().then((r) => setStats(r.data)).catch((e) => toast.error(errMsg(e)));
  }, [toast, documents.length]);

  if (!stats) return <div className="grid place-items-center py-20"><Spinner className="h-8 w-8" /></div>;
  const t = stats.totals;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your documents, experiments and chats." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Documents" value={t.documents} icon={FileText} hint={`${t.pages} pages total`} />
        <Stat label="Chunks created" value={t.chunks} icon={Layers} />
        <Stat label="Indexed documents" value={t.indexed_documents} icon={Database} />
        <Stat label="Questions asked" value={t.questions_asked} icon={Search} hint={`${t.chat_sessions} chats`} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.experiment_progress.map((e) => (
          <ExperimentCard key={e.experiment} number={e.experiment} title={e.name} description={DESC[e.experiment]}
            icon={ICONS[e.experiment]} to={`/experiment-${e.experiment}`} completed={e.documents_completed} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">Experiment runs (last 7 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.activity}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
              <Tooltip /><Area dataKey="runs" stroke="#6366f1" fill="url(#g)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold">Document status</h3>
          {stats.status_breakdown.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.status_breakdown} dataKey="count" nameKey="status" innerRadius={50} outerRadius={85} label>
                  {stats.status_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">No documents yet.</p>}
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">Completed runs per experiment</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.experiment_progress}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip />
              <Bar dataKey="runs" radius={[8, 8, 0, 0]}>{stats.experiment_progress.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h3 className="mb-3 font-semibold">Recent activity</h3>
          <ul className="space-y-2 text-sm">
            {stats.recent_runs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">Exp {r.experiment} · {r.document}</span><StatusBadge status={r.status} />
              </li>
            ))}
            {!stats.recent_runs.length && <li className="text-slate-500">Nothing yet.</li>}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Uploaded documents</h3><Link to="/documents" className="text-sm text-indigo-500">Manage</Link></div>
        <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {documents.slice(0, 6).map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2"><span>{d.title}</span><span className="flex items-center gap-3 text-slate-500">{d.page_count} pages <StatusBadge status={d.status} /></span></li>
          ))}
          {!documents.length && <li className="py-2 text-slate-500">No documents uploaded.</li>}
        </ul>
      </Card>
    </>
  );
}
