import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { errMsg } from "../services/api.js";
import { Btn, Card, Field, inputCls } from "../components/ui.jsx";

function AuthForm({ mode }) {
  const { user, login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";
  if (user) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) await login(form.username, form.password);
      else await register(form);
      navigate("/dashboard");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white"><Sparkles /></span>
          <h1 className="text-xl font-bold">{isLogin ? "Welcome back" : "Create your account"}</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Username"><input className={inputCls} value={form.username} onChange={set("username")} required autoComplete="username" /></Field>
          {!isLogin && <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set("email")} /></Field>}
          <Field label="Password"><input type="password" className={inputCls} value={form.password} onChange={set("password")} required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? "current-password" : "new-password"} /></Field>
          <Btn type="submit" loading={busy} className="w-full">{isLogin ? "Login" : "Register"}</Btn>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? <>No account? <Link className="text-indigo-500" to="/register">Register</Link></> : <>Have an account? <Link className="text-indigo-500" to="/login">Login</Link></>}
        </p>
      </Card>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
