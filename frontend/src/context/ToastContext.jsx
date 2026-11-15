import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

const ToastContext = createContext(null);
const STYLES = {
  success: ["border-emerald-500/40", "text-emerald-500", CheckCircle2],
  error: ["border-rose-500/40", "text-rose-500", XCircle],
  info: ["border-indigo-500/40", "text-indigo-500", Info],
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, type, message }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 4500);
  }, []);
  const toast = useMemo(
    () => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }),
    [push]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => {
          const [border, color, Icon] = STYLES[t.type];
          return (
            <div key={t.id} className={`fade-in flex items-start gap-3 rounded-xl border bg-white p-3 shadow-lg dark:bg-slate-900 ${border}`}>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
              <p className="text-sm">{t.message}</p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
