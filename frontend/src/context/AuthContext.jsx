import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    authApi.me()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const finish = ({ token, user }) => {
    localStorage.setItem("token", token);
    setUser(user);
  };
  const login = async (username, password) => finish((await authApi.login({ username, password })).data);
  const register = async (payload) => finish((await authApi.register(payload)).data);
  const logout = async () => {
    try { await authApi.logout(); } catch { /* token may already be invalid */ }
    localStorage.removeItem("token");
    localStorage.removeItem("selectedDoc");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
