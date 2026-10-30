import { useState } from "react";
import {
  Database,
  Play,
  Info,
  Code2,
  Terminal,
  BookOpen,
  Sparkles,
} from "lucide-react";

import { consultasMongo } from "../config/consultasMongo";
import ResultsTable from "../components/common/ResultsTable";
import QueryChartPreview from "../components/common/QueryChartPreview";

type Resultado = Record<string, unknown>;

const API_URL = "http://127.0.0.1:8000/api/estadisticas";

const PLANTILLAS_MONGO = [
  {
    titulo: "Top 10 Carreras con más Evaluaciones",
    modo: "aggregate" as const,
    coleccion: "evaluaciones",
    json: JSON.stringify(
      [
        {
          $group: {
            _id: "$carrera_objetivo",
            total_evaluaciones: { $sum: 1 },
            aprobadas: { $sum: { $cond: ["$aprobado", 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            carrera: "$_id",
            total_evaluaciones: 1,
            aprobadas: 1,
          },
        },
        { $sort: { total_evaluaciones: -1 } },
        { $limit: 10 },
      ],
      null,
      2
    ),
  },
  {
    titulo: "Evaluaciones por Sexo",
    modo: "aggregate" as const,
    coleccion: "evaluaciones",
    json: JSON.stringify(
      [
        {
          $group: {
            _id: "$sexo",
            total_evaluaciones: { $sum: 1 },
            aprobadas: { $sum: { $cond: ["$aprobado", 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            sexo: "$_id",
            total_evaluaciones: 1,
            aprobadas: 1,
          },
        },
        { $sort: { total_evaluaciones: -1 } },
      ],
      null,
      2
    ),
  },
  {
    titulo: "Filtro Directo (find): Aprobados en Computación",
    modo: "find" as const,
    coleccion: "evaluaciones",
    json: JSON.stringify(
      {
        materia: "COMPUTACION",
        aprobado: true,
      },
      null,
      2
    ),
  },
];

export default function MongoDBPage() {
  const [modoVista, setModoVista] = useState<
    "predeterminadas" | "editor"
  >("predeterminadas");
  const [consultaId, setConsultaId] = useState(1);
  const [correlativo, setCorrelativo] = useState("");
  const [mostrarPipeline, setMostrarPipeline] = useState(false);

  // Estado del editor personalizado
  const [coleccionActiva, setColeccionActiva] =
    useState("evaluaciones");
  const [modoConsulta, setModoConsulta] = useState<
    "aggregate" | "find"
  >("aggregate");
  const [consultaJson, setConsultaJson] = useState(
    PLANTILLAS_MONGO[0].json
  );
  const [limitePersonalizado, setLimitePersonalizado] =
    useState(100);

  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ejecutada, setEjecutada] = useState(false);

  const consulta = consultasMongo.find(
    (item) => item.id === consultaId
  )!;

  async function ejecutarConsultaPredeterminada() {
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
        const detalle = await respuesta.json().catch(() => null);
        throw new Error(
          typeof detalle?.detail === "string"
            ? detalle.detail
            : `Error HTTP ${respuesta.status}`
        );
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
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setCargando(false);
    }
  }

  async function ejecutarConsultaPersonalizada() {
    setError("");
    let objetoParseado: unknown;

    try {
      objetoParseado = JSON.parse(consultaJson);
    } catch {
      setError(
        "El JSON ingresado no es válido. Revisa las comillas, llaves o corchetes."
      );
      return;
    }

    setCargando(true);
    setEjecutada(false);
    setResultados([]);

    try {
      const respuesta = await fetch(
        `${API_URL}/consulta-personalizada`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coleccion: coleccionActiva,
            modo: modoConsulta,
            consulta: objetoParseado,
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

      const datos: Resultado[] = await respuesta.json();
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
    setColeccionActiva(
      consulta.id === 6 ? "resumen_carrera" : "evaluaciones"
    );
    setModoConsulta("aggregate");
    setConsultaJson(consulta.pipelineEjemplo);
    setModoVista("editor");
    setError("");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Database className="text-emerald-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Consultas y Consola Analítica (MongoDB)
            </h1>
            <p className="text-slate-400 text-sm">
              Ejecuta las 20 consultas del enunciado o escribe tus propios pipelines y filtros JSON con visualización gráfica.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setModoVista("predeterminadas");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modoVista === "predeterminadas"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen size={16} />
            Consultas Predeterminadas (20)
          </button>

          <button
            type="button"
            onClick={() => {
              setModoVista("editor");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modoVista === "editor"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Terminal size={16} />
            Escribir Consulta MongoDB
          </button>
        </div>
      </header>

      {modoVista === "predeterminadas" ? (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div>
            <label
              htmlFor="consulta"
              className="block text-sm mb-2 text-slate-300"
            >
              Selecciona una de las 20 consultas analíticas
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
            >
              {consultasMongo.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id}. {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
            <div className="flex gap-3 items-start">
              <Info
                className="text-emerald-400 shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-sm text-slate-200">
                {consulta.descripcion}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarPipeline((p) => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 text-xs text-emerald-300"
              >
                <Code2 size={14} />
                {mostrarPipeline
                  ? "Ocultar Pipeline"
                  : "Ver Pipeline"}
              </button>

              <button
                type="button"
                onClick={abrirEnEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs text-emerald-200"
              >
                <Terminal size={14} />
                Editar en consola
              </button>
            </div>
          </div>

          {mostrarPipeline && (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-64">
              {consulta.pipelineEjemplo}
            </pre>
          )}

          {consulta.requiereCorrelativo && (
            <div>
              <label
                htmlFor="correlativo"
                className="block text-sm mb-2"
              >
                Correlativo del aspirante
              </label>
              <input
                id="correlativo"
                value={correlativo}
                onChange={(e) => setCorrelativo(e.target.value)}
                placeholder="Ingresa el correlativo..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"
              />
            </div>
          )}

          <button
            onClick={ejecutarConsultaPredeterminada}
            disabled={cargando}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-3 rounded-xl font-medium transition-colors"
          >
            <Play size={18} />
            {cargando ? "Ejecutando..." : "Ejecutar consulta"}
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
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <Sparkles size={16} />
              Plantillas rápidas MongoDB (clic para cargar):
            </div>

            <div className="flex flex-wrap gap-2">
              {PLANTILLAS_MONGO.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setColeccionActiva(p.coleccion);
                    setModoConsulta(p.modo);
                    setConsultaJson(p.json);
                    setError("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
                >
                  {p.titulo}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Colección MongoDB
              </label>
              <select
                value={coleccionActiva}
                onChange={(e) => setColeccionActiva(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value="evaluaciones">evaluaciones</option>
                <option value="resumen_carrera">
                  resumen_carrera
                </option>
                <option value="historial_cargas">
                  historial_cargas
                </option>
                <option value="errores_carga">errores_carga</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Tipo de operación
              </label>
              <select
                value={modoConsulta}
                onChange={(e) => {
                  const nuevoModo = e.target.value as
                    | "aggregate"
                    | "find";
                  setModoConsulta(nuevoModo);
                  if (
                    nuevoModo === "find" &&
                    consultaJson.trim().startsWith("[")
                  ) {
                    setConsultaJson(
                      JSON.stringify({ aprobado: true }, null, 2)
                    );
                  } else if (
                    nuevoModo === "aggregate" &&
                    consultaJson.trim().startsWith("{")
                  ) {
                    setConsultaJson(PLANTILLAS_MONGO[0].json);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value="aggregate">
                  Aggregation Pipeline ([ ... ])
                </option>
                <option value="find">
                  Filtro find ({"{ ... }"})
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Límite máximo de resultados
              </label>
              <select
                value={limitePersonalizado}
                onChange={(e) =>
                  setLimitePersonalizado(Number(e.target.value))
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value={25}>25 documentos</option>
                <option value={50}>50 documentos</option>
                <option value={100}>100 documentos</option>
                <option value={200}>200 documentos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {modoConsulta === "aggregate"
                ? "Pipeline de Agregación en formato JSON ([ { \"$match\": ... }, { \"$group\": ... } ])"
                : "Filtro de Búsqueda en formato JSON ({ \"materia\": \"MATEMATICA\" })"}
            </label>
            <textarea
              rows={9}
              value={consultaJson}
              onChange={(e) => setConsultaJson(e.target.value)}
              spellCheck={false}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={ejecutarConsultaPersonalizada}
              disabled={cargando}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-5 py-2.5 rounded-xl font-medium text-sm"
            >
              <Play size={17} />
              {cargando
                ? "Ejecutando en MongoDB..."
                : "Ejecutar consulta personalizada"}
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
          <h2 className="text-lg font-semibold">
            Resultados — {resultados.length} registros
          </h2>

          {/* Apartado gráfico compacto */}
          <QueryChartPreview
            datos={resultados}
            colorPrimario="#10b981"
          />

          <ResultsTable datos={resultados} />
        </section>
      )}
    </div>
  );
}
