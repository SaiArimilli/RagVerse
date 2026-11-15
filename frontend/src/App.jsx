import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import { Login, Register } from "./pages/AuthPages.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Experiment1 from "./pages/Experiment1.jsx";
import Experiment2 from "./pages/Experiment2.jsx";
import Experiment3 from "./pages/Experiment3.jsx";
import Experiment4 from "./pages/Experiment4.jsx";
import CompleteWorkflow from "./pages/CompleteWorkflow.jsx";
import About from "./pages/About.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/experiment-1" element={<Experiment1 />} />
        <Route path="/experiment-2" element={<Experiment2 />} />
        <Route path="/experiment-3" element={<Experiment3 />} />
        <Route path="/experiment-4" element={<Experiment4 />} />
        <Route path="/workflow" element={<CompleteWorkflow />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
