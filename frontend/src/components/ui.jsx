import { Loader2 } from "lucide-react";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900", className)} {...rest}>
      {children}
    </div>
  );
}

const VARIANTS = {
  primary: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  danger: "bg-rose-500 text-white hover:bg-rose-600",
  ghost: "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
};

export function Btn({ variant = "primary", loading, disabled, className, children, ...rest }) {
  return (
    <button
      disabled={disabled || loading}
      className={cx("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50", VARIANTS[variant], className)}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Spinner = ({ className }) => <Loader2 className={cx("h-5 w-5 animate-spin text-indigo-500", className)} />;

export function ProgressBar({ value = 0, label }) {
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{value}%</span></div>}
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

const TONES = {
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  blue: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};
export const Badge = ({ tone = "slate", children }) => (
  <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[tone])}>{children}</span>
);

const STATUS_TONE = { uploaded: "slate", extracted: "blue", chunked: "blue", embedded: "amber", indexed: "green", failed: "red", completed: "green", running: "amber" };
export const StatusBadge = ({ status }) => <Badge tone={STATUS_TONE[status] || "slate"}>{status}</Badge>;

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function CodePanel({ title, children, className }) {
  return (
    <div className={cx("overflow-hidden rounded-xl border border-slate-800 bg-slate-950", className)}>
      {title && <div className="border-b border-slate-800 px-3 py-1.5 text-xs text-slate-400">{title}</div>}
      <pre className="max-h-72 overflow-auto p-3 text-xs leading-relaxed text-emerald-300">{children}</pre>
    </div>
  );
}

export function Stat({ label, value, icon: Icon, hint }) {
  return (
    <Card className="flex items-center gap-4">
      {Icon && <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 text-white"><Icon className="h-5 w-5" /></div>}
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
      </div>
    </Card>
  );
}

export const Field = ({ label, children }) => (
  <label className="block text-sm"><span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">{label}</span>{children}</label>
);

export const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800";
