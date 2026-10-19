
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  Network,
  GitBranch,
  Search,
  Upload,
  GraduationCap,
} from "lucide-react";

const opciones = [
  { ruta: "/", nombre: "Dashboard", icono: LayoutDashboard },
  { ruta: "/mongodb", nombre: "MongoDB", icono: Database },
  { ruta: "/neo4j", nombre: "Neo4j", icono: Network },
  { ruta: "/explorador", nombre: "Explorador de grafos", icono: GitBranch },
  { ruta: "/buscador", nombre: "Buscador", icono: Search },
  { ruta: "/importar", nombre: "Importar CSV", icono: Upload },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-5 shrink-0">
      <div className="flex items-center gap-3 mb-10">
        <GraduationCap className="text-sky-400" size={28} />
        <div>
          <h1 className="font-bold text-white">USAC Analytics</h1>
          <p className="text-xs text-slate-400">Bases de Datos 2</p>
        </div>
      </div>

      <nav className="space-y-2">
        {opciones.map(({ ruta, nombre, icono: Icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ruta === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sky-500/15 text-sky-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <Icono size={19} />
            <span className="text-sm">{nombre}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
