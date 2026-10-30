import { useState } from "react";
import {
  Network,
  Play,
  Info,
  GitBranch,
  Code2,
  Terminal,
  BookOpen,
  Sparkles,
} from "lucide-react";

import { consultasNeo4j } from "../config/consultasNeo4j";
import {
  ejecutarConsultaNeo4j,
  type ResultadoGrafo,
} from "../services/api";
import ResultsTable from "../components/common/ResultsTable";
import QueryChartPreview from "../components/common/QueryChartPreview";

const API_URL = "http://127.0.0.1:8000/api/grafos";

const PLANTILLAS_CYPHER = [
  {
    titulo: "Aprobación por Tipo de Institución",
    cypher: `MATCH (e:Evaluacion)-[:PROVIENE_DE_TIPO]->(i:InstitucionTipo)
RETURN
    i.nombre AS tipo_institucion,
    count(e) AS total_evaluaciones,
    sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas,
    round(100.0 * sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) / count(e), 2) AS porcentaje_aprobacion
ORDER BY total_evaluaciones DESC`,
  },
  {
    titulo: "Top 10 Carreras con más Aprobados",
    cypher: `MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion {aprobado: true})-[:PARA_CARRERA]->(c:Carrera)
WHERE c.nombre <> "NINGUNO"
RETURN
    c.nombre AS carrera,
    count(DISTINCT a) AS aspirantes_aprobados,
    count(e) AS evaluaciones_aprobadas
ORDER BY aspirantes_aprobados DESC
LIMIT 10`,
  },
  {
    titulo: "Evaluaciones por Año de Ingreso",
    cypher: `MATCH (e:Evaluacion)-[:EN_PERIODO]->(p:PeriodoIngreso)
RETURN
    p.anio AS anio_ingreso,
    count(e) AS total_evaluaciones,
    sum(CASE WHEN e.aprobado = true THEN 1 ELSE 0 END) AS aprobadas
ORDER BY anio_ingreso ASC`,
  },
];

export default function Neo4jPage() {
  const [modo, setModo] = useState<"predeterminadas" | "editor">(
    "predeterminadas"
  );
  const [consultaId, setConsultaId] = useState(1);
  const [correlativo, setCorrelativo] = useState("");
  const [mostrarCypher, setMostrarCypher] = useState(false);

  // Estado del editor Cypher personalizado
  const [cypherTexto, setCypherTexto] = useState(
    PLANTILLAS_CYPHER[0].cypher
  );
  const [limitePersonalizado, setLimitePersonalizado] =
    useState(100);

  const [resultados, setResultados] = useState<ResultadoGrafo[]>(
    []
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ejecutada, setEjecutada] = useState(false);

  const consulta = consultasNeo4j.find(
    (item) => item.id === consultaId
  )!;

  async function ejecutarPredeterminada() {
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

  async function ejecutarPersonalizada() {
    if (!cypherTexto.trim()) {
      setError("Escribe una consulta Cypher para ejecutar.");
      return;
    }

    setCargando(true);
    setError("");
    setEjecutada(false);
    setResultados([]);

    try {
      const respuesta = await fetch(
        `${API_URL}/consulta-personalizada`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cypher: cypherTexto,
            limite: limitePersonalizado,
          }),
        }
      );

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null);
        throw new Error(
          typeof detalle?.detail === "string"
            ? detalle.detail
            : `Error HTTP ${respuesta.status}`
        );
      }

      const datos: ResultadoGrafo[] = await respuesta.json();
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

  function abrirEnEditor() {
    const codigoBase = consulta.requiereCorrelativo
      ? consulta.cypher.replace(
          "$correlativo",
          `"${correlativo.trim() || "949d241ac10256edf11339a303c72a50"}"`
        )
      : consulta.cypher;
    setCypherTexto(codigoBase);
    setModo("editor");
    setError("");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Network className="text-violet-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Consultas y Consola Cypher (Neo4j)
            </h1>
            <p className="text-sm text-slate-400">
              Ejecuta las consultas de grafos del proyecto o escribe tus propias consultas Cypher con vista gráfica.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setModo("predeterminadas");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modo === "predeterminadas"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen size={16} />
            Consultas Predeterminadas (5)
          </button>

          <button
            type="button"
            onClick={() => {
              setModo("editor");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modo === "editor"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Terminal size={16} />
            Escribir Consulta Cypher
          </button>
        </div>
      </header>

      {modo === "predeterminadas" ? (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <label
              htmlFor="consulta-neo4j"
              className="block text-sm text-slate-300 mb-2"
            >
              Selecciona una consulta predeterminada
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
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
            >
              {consultasNeo4j.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}. {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl">
            <div className="flex gap-3 items-start">
              <Info
                className="text-violet-400 shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-sm text-slate-200">
                {consulta.descripcion}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarCypher((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-violet-500/30 text-xs text-violet-300"
              >
                <Code2 size={14} />
                {mostrarCypher ? "Ocultar Cypher" : "Ver Cypher"}
              </button>

              <button
                type="button"
                onClick={abrirEnEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-xs text-violet-200"
              >
                <Terminal size={14} />
                Editar en consola
              </button>
            </div>
          </div>

          {mostrarCypher && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-violet-300 overflow-x-auto">
              {consulta.cypher}
            </pre>
          )}

          {consulta.requiereCorrelativo && (
            <div>
              <label
                htmlFor="correlativo-neo4j"
                className="block text-sm mb-2"
              >
                Correlativo del aspirante
              </label>
              <input
                id="correlativo-neo4j"
                value={correlativo}
                onChange={(e) => setCorrelativo(e.target.value)}
                placeholder="Ingresa un correlativo existente..."
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          )}

          <button
            type="button"
            onClick={ejecutarPredeterminada}
            disabled={cargando}
            className="flex gap-2 items-center bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-3 rounded-xl font-medium transition-colors"
          >
            <Play size={18} />
            {cargando ? "Ejecutando consulta..." : "Ejecutar consulta"}
          </button>

          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}
        </section>
      ) : (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
              <Sparkles size={16} />
              Plantillas Cypher rápidas (clic para cargar):
            </div>

            <div className="flex flex-wrap gap-2">
              {PLANTILLAS_CYPHER.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCypherTexto(p.cypher)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
                >
                  {p.titulo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              Consulta Cypher (solo lectura: MATCH, WHERE, WITH, RETURN, ORDER BY, LIMIT)
            </label>
            <textarea
              rows={8}
              value={cypherTexto}
              onChange={(e) => setCypherTexto(e.target.value)}
              spellCheck={false}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-violet-200 focus:outline-none focus:border-violet-500"
              placeholder="MATCH (n) RETURN n LIMIT 25"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Límite máximo de filas:</span>
              <select
                value={limitePersonalizado}
                onChange={(e) =>
                  setLimitePersonalizado(Number(e.target.value))
                }
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>

            <button
              type="button"
              onClick={ejecutarPersonalizada}
              disabled={cargando}
              className="flex gap-2 items-center bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-2.5 rounded-xl font-medium text-sm"
            >
              <Play size={17} />
              {cargando
                ? "Ejecutando Cypher..."
                : "Ejecutar consulta Cypher"}
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="text-red-300 text-sm bg-red-950/30 border border-red-800/60 rounded-xl p-3"
            >
              {error}
            </p>
          )}
        </section>
      )}

      {ejecutada && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <GitBranch className="text-violet-400" size={20} />
            <h2 className="text-lg font-semibold">
              Resultados — {resultados.length} registros
            </h2>
          </div>

          {/* Apartado gráfico compacto */}
          <QueryChartPreview
            datos={resultados}
            colorPrimario="#8b5cf6"
          />

          <ResultsTable datos={resultados} />
        </section>
      )}
    </div>
  );
}
