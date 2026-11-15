import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import { DocumentProvider } from "../context/DocumentContext.jsx";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <DocumentProvider>
      <div className="flex min-h-screen">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar onMenu={() => setOpen(true)} />
          <main className="fade-in flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </DocumentProvider>
  );
}
