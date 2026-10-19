
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
