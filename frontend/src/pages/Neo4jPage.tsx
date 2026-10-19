
import { useState } from "react";
import { Network, Play, Info, GitBranch } from "lucide-react";

import { consultasNeo4j } from "../config/consultasNeo4j";
import { ejecutarConsultaNeo4j, type ResultadoGrafo } from "../services/api";
import ResultsTable from "../components/common/ResultsTable";

export default function Neo4jPage() {
  const [consultaId, setConsultaId] = useState(1);
  const [correlativo, setCorrelativo] = useState("");
  const [resultados, setResultados] = useState<ResultadoGrafo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ejecutada, setEjecutada] = useState(false);

  const consulta = consultasNeo4j.find(
    (item) => item.id === consultaId
  )!;

  async function ejecutar() {
    if (consulta.requiereCorrelativo && !correlativo.trim()) {
      setError("Ingresa un correlativo de aspirante.");
      return;
    }

    setCargando(true);
    setError("");
    setEjecutada(false);
    setResultados([]);

    try {
      const datos = await ejecutarConsultaNeo4j(
        consulta.endpoint,
        consulta.requiereCorrelativo
          ? correlativo.trim()
          : undefined
      );

      setResultados(datos);
      setEjecutada(true);
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
        <Network className="text-violet-400" size={30} />
        <div>
          <h1 className="text-2xl font-bold">Consultas Neo4j</h1>
          <p className="text-sm text-slate-400">
            Análisis de relaciones mediante Cypher.
          </p>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <label htmlFor="consulta-neo4j" className="block text-sm text-slate-300 mb-2">
            Selecciona una consulta
          </label>
          <select
            id="consulta-neo4j"
            value={consultaId}
            onChange={(e) => {
              setConsultaId(Number(e.target.value));
              setResultados([]);
              setError("");
              setEjecutada(false);
            }}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700"
          >
            {consultasNeo4j.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id}. {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 bg-violet-500/10 border border-violet-500/20 p-4 rounded-lg">
          <Info className="text-violet-400 shrink-0" size={20} />
          <p className="text-sm text-slate-300">
            {consulta.descripcion}
          </p>
        </div>

        {consulta.requiereCorrelativo && (
          <div>
            <label htmlFor="correlativo-neo4j" className="block text-sm mb-2">
              Correlativo del aspirante
            </label>
            <input
              id="correlativo-neo4j"
              value={correlativo}
              onChange={(e) => setCorrelativo(e.target.value)}
              placeholder="Ingresa un correlativo existente..."
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700"
            />
          </div>
        )}

        <button
          type="button"
          onClick={ejecutar}
          disabled={cargando}
          className="flex gap-2 items-center bg-violet-600 hover:bg-violet-700 disabled:opacity-50 px-5 py-3 rounded-lg font-medium"
        >
          <Play size={18} />
          {cargando ? "Ejecutando consulta..." : "Ejecutar consulta"}
        </button>

        {error && (
          <p role="alert" className="text-red-400">{error}</p>
        )}
      </section>

      {ejecutada && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="text-violet-400" size={20} />
            <h2 className="text-lg font-semibold">
              Resultados — {resultados.length} registros
            </h2>
          </div>

          <ResultsTable datos={resultados} />
        </section>
      )}
    </div>
  );
}
