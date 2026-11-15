import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Badge, Btn, inputCls } from "./ui.jsx";

function Sources({ sources }) {
  if (!sources?.length) return null;
  const pages = [...new Set(sources.map((s) => s.page))].sort((a, b) => a - b);
  return (
    <details className="mt-3 rounded-xl border border-slate-200 text-xs dark:border-slate-700">
      <summary className="cursor-pointer select-none px-3 py-2 font-medium">
        Sources · pages {pages.join(", ")} ({sources.length} chunks)
      </summary>
      <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-700">
        {sources.map((s) => (
          <div key={s.chunk_index} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60">
            <div className="mb-1 flex gap-2"><Badge tone="blue">Page {s.page}</Badge><Badge>score {s.score}</Badge></div>
            <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{s.content}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function ChatWindow({ messages, onSend, sending, disabled, placeholder }) {
  const [text, setText] = useState("");
  const bottom = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const submit = (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q || sending || disabled) return;
    setText("");
    onSend(q);
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!messages.length && (
          <div className="grid h-full place-items-center text-center text-sm text-slate-500">
            <div><Bot className="mx-auto mb-2 h-10 w-10 text-indigo-500" />Ask a question about your document.<br />Answers use only retrieved passages.</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`fade-in flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${m.role === "user" ? "bg-slate-500" : "bg-gradient-to-br from-indigo-500 to-violet-600"}`}>
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-indigo-500 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && <Sources sources={m.sources} />}
            </div>
          </div>
        ))}
        {sending && <div className="flex items-center gap-2 text-sm text-slate-500"><Bot className="h-4 w-4 animate-pulse" /> Thinking…</div>}
        <div ref={bottom} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} placeholder={placeholder || "Ask a question…"} />
        <Btn type="submit" disabled={disabled || !text.trim()} loading={sending}><Send className="h-4 w-4" /></Btn>
      </form>
    </div>
  );
}
