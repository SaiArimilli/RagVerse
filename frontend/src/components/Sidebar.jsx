import { NavLink } from "react-router-dom";
import { Binary, Database, FileText, Info, LayoutDashboard, MessagesSquare, Scissors, Sparkles, Workflow, X } from "lucide-react";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/experiment-1", label: "1 · PDF & Chunking", icon: Scissors },
  { to: "/experiment-2", label: "2 · Embeddings", icon: Binary },
  { to: "/experiment-3", label: "3 · Vector Search", icon: Database },
  { to: "/experiment-4", label: "4 · RAG Chat", icon: MessagesSquare },
  { to: "/workflow", label: "Complete Workflow", icon: Workflow },
  { to: "/about", label: "About Project", icon: Info },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white p-4 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 text-white"><Sparkles className="h-5 w-5" /></span>
            RagAI
          </div>
          <button className="lg:hidden" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            >
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
