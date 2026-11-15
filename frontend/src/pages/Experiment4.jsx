import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { ragApi, errMsg } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { useDocuments } from "../context/DocumentContext.jsx";
import DocumentSelector from "../components/DocumentSelector.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { Btn, Card, PageHeader } from "../components/ui.jsx";

/** Shows whether the backend found GEMINI_API_KEY and lets the user test a live call. */
function GeminiStatus() {
  const [health, setHealth] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => { ragApi.health().then((r) => setHealth(r.data)).catch(() => {}); }, []);
  const test = async () => {
    setTesting(true);
    try { setHealth((await ragApi.health(true)).data); } catch { /* ignore */ } finally { setTesting(false); }
  };
  if (!health) return null;

  if (!health.configured)
    return (
      <Card className="mb-4 border-rose-500/40 text-sm">
        <p className="flex items-center gap-2 font-semibold text-rose-500"><AlertTriangle className="h-4 w-4" />Gemini API key not found</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-300">
          <li>In <code>backend/</code> (next to <code>manage.py</code>) create a file named exactly <code>.env</code>{!health.env_file_found && " — it does not exist yet"}.</li>
          <li>Add the line <code>GEMINI_API_KEY=your_key_here</code> (no quotes, no spaces).</li>
          <li>Stop and restart <code>python manage.py runserver</code>, then reload this page.</li>
        </ol>
      </Card>
    );

  return (
    <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />
        Gemini key loaded ({health.key_preview}) · model <code>{health.model}</code>
        {health.test && <span className={health.test.ok ? "text-emerald-500" : "text-rose-500"}>· {health.test.message}</span>}
      </span>
      <Btn variant="secondary" loading={testing} onClick={test}>Test connection</Btn>
    </Card>
  );
}

export default function Experiment4() {
  const toast = useToast();
  const { selected, refresh } = useDocuments();
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!selected) return;
    try { setSessions((await ragApi.sessions(selected.id)).data); } catch { /* ignore */ }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setSessionId(null); setMessages([]); loadSessions(); }, [loadSessions]);

  const open = async (id) => {
    try { const { data } = await ragApi.session(id); setSessionId(id); setMessages(data.messages); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const removeSession = async (id) => {
    await ragApi.deleteSession(id);
    if (id === sessionId) { setSessionId(null); setMessages([]); }
    loadSessions();
  };

  const send = async (question) => {
    setMessages((m) => [...m, { role: "user", content: question }]);
    setSending(true);
    try {
      const { data } = await ragApi.ask(selected.id, question, sessionId);
      setSessionId(data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: data.answer, sources: data.sources }]);
      loadSessions(); refresh();
    } catch (e) {
      toast.error(errMsg(e));
      setMessages((m) => m.slice(0, -1)); // remove the unanswered question
    } finally { setSending(false); }
  };

  const ready = selected?.status === "indexed";
  return (
    <>
      <PageHeader title="Experiment 4 · RAG Question Answering" subtitle="Top 4 chunks are retrieved by vector similarity and passed to Gemini, which must answer only from that context and cite page numbers." />
      <GeminiStatus />
      <DocumentSelector />
      {selected && (
        <>
          {!ready && <Card className="mb-4 text-sm text-amber-500">This document is not indexed yet. Complete Experiments 1–3 (or use the Complete Workflow page).</Card>}
          <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
            <Card className="h-fit">
              <Btn className="mb-3 w-full" onClick={() => { setSessionId(null); setMessages([]); }}><Plus className="h-4 w-4" />New chat</Btn>
              <ul className="space-y-1 text-sm">
                {sessions.map((s) => (
                  <li key={s.id} className={`flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 ${s.id === sessionId ? "bg-indigo-500/10" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                    <button className="min-w-0 flex-1 truncate text-left" onClick={() => open(s.id)}>{s.title}</button>
                    <button onClick={() => removeSession(s.id)}><Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-rose-500" /></button>
                  </li>
                ))}
                {!sessions.length && <li className="text-slate-500">No chats yet.</li>}
              </ul>
            </Card>
            <ChatWindow messages={messages} onSend={send} sending={sending} disabled={!ready} placeholder={ready ? "Ask about your document…" : "Index the document first"} />
          </div>
        </>
      )}
    </>
  );
}
