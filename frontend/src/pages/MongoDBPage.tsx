
import { useState } from "react";
import { Database, Play } from "lucide-react";

import { consultasMongo } from "../config/consultasMongo";
import ResultsTable from "../components/common/ResultsTable";

type Resultado = Record<string, unknown>;

const API_URL = "http://127.0.0.1:8000/api/estadisticas";

export default function MongoDBPage() {
  const [consultaId, setConsultaId] = useState(1);
  const [correlativo, setCorrelativo] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ejecutada, setEjecutada] = useState(false);

  const consulta = consultasMongo.find(
    (item) => item.id === consultaId
  )!;

  async function ejecutarConsulta() {
    if (consulta.requiereCorrelativo && !correlativo.trim()) {
      setError("Debes ingresar un correlativo de aspirante.");
      return;
    }

    setCargando(true);
    setError("");
    setEjecutada(false);
    setResultados([]);

    try {
      const ruta = consulta.requiereCorrelativo
        ? `${consulta.endpoint}/${encodeURIComponent(correlativo.trim())}`
        : consulta.endpoint;

      const respuesta = await fetch(`${API_URL}${ruta}`, {
        method: consulta.metodo ?? "GET",
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos: unknown = await respuesta.json();

      if (Array.isArray(datos)) {
        setResultados(datos as Resultado[]);
      } else if (
        datos !== null &&
        typeof datos === "object" &&
        "evaluaciones" in datos &&
        Array.isArray(datos.evaluaciones)
      ) {
        setResultados(datos.evaluaciones as Resultado[]);
      } else if (
        datos !== null &&
        typeof datos === "object" &&
        "resultados" in datos &&
        Array.isArray(datos.resultados)
      ) {
        setResultados(datos.resultados as Resultado[]);
      } else {
        setResultados([datos as Resultado]);
      }

      setEjecutada(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Database className="text-green-400" size={30} />
        <div>
          <h1 className="text-2xl font-bold">Consultas MongoDB</h1>
          <p className="text-slate-400 text-sm">
            Ejecuta las 20 consultas analíticas del proyecto.
          </p>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div>
          <label htmlFor="consulta" className="block text-sm mb-2 text-slate-300">
            Selecciona una consulta
          </label>
          <select
            id="consulta"
            value={consultaId}
            onChange={(e) => {
              setConsultaId(Number(e.target.value));
              setResultados([]);
              setEjecutada(false);
              setError("");
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
          >
            {consultasMongo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.id}. {item.nombre}
              </option>
            ))}
          </select>
        </div>

        {consulta.requiereCorrelativo && (
          <div>
            <label htmlFor="correlativo" className="block text-sm mb-2">
              Correlativo del aspirante
            </label>
            <input
              id="correlativo"
              value={correlativo}
              onChange={(e) => setCorrelativo(e.target.value)}
              placeholder="Ingresa el correlativo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3"
            />
          </div>
        )}

        <button
          onClick={ejecutarConsulta}
          disabled={cargando}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 px-5 py-3 rounded-lg font-medium"
        >
          <Play size={18} />
          {cargando ? "Ejecutando..." : "Ejecutar consulta"}
        </button>

        {error && <p className="text-red-400">{error}</p>}
      </section>

      {ejecutada && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Resultados — {resultados.length} registros
          </h2>
          <ResultsTable datos={resultados} />
        </section>
      )}
    </div>
  );
}
