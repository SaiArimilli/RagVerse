import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge, Card } from "./ui.jsx";

export default function ExperimentCard({ number, title, description, icon: Icon, to, completed }) {
  return (
    <Link to={to}>
      <Card className="group h-full transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 text-white"><Icon className="h-5 w-5" /></div>
          {completed !== undefined && <Badge tone={completed ? "green" : "slate"}>{completed ? `${completed} done` : "not run"}</Badge>}
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Experiment {number}</p>
        <h3 className="mt-1 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-500">Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </Card>
    </Link>
  );
}
