import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { Btn } from "./ui.jsx";

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
      <button className="lg:hidden" onClick={onMenu}><Menu className="h-6 w-6" /></button>
      <div className="hidden text-sm text-slate-500 lg:block">AI Document Intelligence Platform</div>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" title="Toggle theme">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800 sm:inline">{user?.username}</span>
        <Btn variant="secondary" onClick={async () => { await logout(); navigate("/login"); }}>
          <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span>
        </Btn>
      </div>
    </header>
  );
}
