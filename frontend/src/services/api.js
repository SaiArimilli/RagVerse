import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api",
});

// Attach the auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Expired/invalid token -> back to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !["/login", "/register"].includes(window.location.pathname)) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/** Turn any axios error into a readable message. */
export const errMsg = (e) =>
  e?.response?.data?.error || (e?.code === "ERR_NETWORK" ? "Cannot reach the server. Is Django running?" : e?.message) || "Something went wrong";

export const authApi = {
  register: (d) => api.post("/auth/register/", d),
  login: (d) => api.post("/auth/login/", d),
  logout: () => api.post("/auth/logout/"),
  me: () => api.get("/auth/me/"),
};

export const documentsApi = {
  list: () => api.get("/documents/"),
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/documents/upload/", form, {
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
    });
  },
  remove: (id) => api.delete(`/documents/${id}/`),
  fileBlob: (id) => api.get(`/documents/${id}/file/`, { responseType: "blob" }),
};

export const experimentsApi = {
  extract: (document_id) => api.post("/experiments/extract/", { document_id }),
  chunk: (document_id, chunk_size, chunk_overlap) =>
    api.post("/experiments/chunk/", { document_id, chunk_size, chunk_overlap }),
  chunks: (document_id) => api.get("/experiments/chunks/", { params: { document_id } }),
  embed: (document_id, model_name) => api.post("/experiments/embed/", { document_id, model_name }),
  embedQuery: (document_id, model_name, query) =>
    api.post("/experiments/embed/", { document_id, model_name, query }),
  progress: (document_id) => api.get("/experiments/progress/", { params: { document_id } }),
  index: (document_id) => api.post("/experiments/index/", { document_id }),
  search: (document_id, query, k = 5) => api.post("/experiments/search/", { document_id, query, k }),
  runs: (document_id) => api.get("/experiments/runs/", { params: { document_id } }),
};

export const ragApi = {
  ask: (document_id, question, session_id) =>
    api.post("/rag/ask/", { document_id, question, session_id: session_id || null }),
  health: (test = false) => api.get("/rag/health/", { params: test ? { test: 1 } : {} }),
  sessions: (document_id) => api.get("/rag/sessions/", { params: { document_id } }),
  session: (id) => api.get(`/rag/sessions/${id}/`),
  deleteSession: (id) => api.delete(`/rag/sessions/${id}/`),
};

export const dashboardApi = { stats: () => api.get("/dashboard/stats/") };

export default api;
