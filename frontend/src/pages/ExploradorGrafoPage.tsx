
import { useState } from "react";
import { Network, Search } from "lucide-react";
import type { ElementDefinition } from "cytoscape";

import GrafoInteractivo from "../components/GrafoInteractivo";

interface GrafoData {
  nodes: ElementDefinition[];
  edges: ElementDefinition[];
}

const API_URL = "http://127.0.0.1:8000";

export default function ExploradorGrafoPage() {
  const [correlativo, setCorrelativo] = useState("");
  const [grafo, setGrafo] = useState<GrafoData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function buscarGrafo() {
    if (!correlativo.trim()) {
      setError("Ingresa un correlativo de aspirante.");
      setGrafo(null);
      return;
    }

    setCargando(true);
    setError("");
    setGrafo(null);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/grafos/visualizar/${encodeURIComponent(
          correlativo.trim()
        )}`
      );

      if (respuesta.status === 404) {
        throw new Error("No se encontró el aspirante.");
      }

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos: GrafoData = await respuesta.json();

      if (!datos.nodes?.length) {
        throw new Error("El aspirante no tiene datos para visualizar.");
      }

      setGrafo(datos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Network className="text-sky-400" size={30} />

        <div>
          <h1 className="text-2xl font-bold">
            Explorador de grafos
          </h1>

          <p className="text-sm text-slate-400">
            Visualiza las relaciones almacenadas en Neo4j.
          </p>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            buscarGrafo();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            value={correlativo}
            onChange={(e) => setCorrelativo(e.target.value)}
            placeholder="Correlativo del aspirante..."
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
          />

          <button
            type="submit"
            disabled={cargando}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg"
          >
            <Search size={18} />
            {cargando ? "Buscando..." : "Visualizar grafo"}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-red-400 mt-4">
            {error}
          </p>
        )}
      </section>

      {grafo && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">
              Grafo del aspirante
            </h2>

            <span className="text-sm text-slate-400">
              {grafo.nodes.length} nodos · {grafo.edges.length} relaciones
            </span>
          </div>

          <GrafoInteractivo grafo={grafo} />
        </section>
      )}
    </div>
  );
}
