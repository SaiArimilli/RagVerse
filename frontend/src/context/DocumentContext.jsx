import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { documentsApi, errMsg } from "../services/api.js";
import { useToast } from "./ToastContext.jsx";

const DocumentContext = createContext(null);

/** Holds the user's documents and the ONE selected document used by all four experiments. */
export function DocumentProvider({ children }) {
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => Number(localStorage.getItem("selectedDoc")) || null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await documentsApi.list();
      setDocuments(data);
      setSelectedId((cur) => (data.some((d) => d.id === cur) ? cur : data[0]?.id ?? null));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (selectedId) localStorage.setItem("selectedDoc", String(selectedId)); }, [selectedId]);

  const selected = documents.find((d) => d.id === selectedId) || null;
  return (
    <DocumentContext.Provider value={{ documents, selected, selectedId, setSelectedId, refresh, loading }}>
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocuments = () => useContext(DocumentContext);
