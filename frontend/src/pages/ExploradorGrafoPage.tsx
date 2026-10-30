import { useEffect, useState } from "react";
import {
  Network,
  Search,
  UserCheck,
  Globe,
  Filter,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Layers,
} from "lucide-react";
import type { ElementDefinition } from "cytoscape";

import GrafoInteractivo from "../components/GrafoInteractivo";
import {
  obtenerAspirantesSugeridos,
  obtenerOpcionesFiltrosGrafo,
  type AspiranteSugerido,
  type OpcionesFiltrosGrafo,
  type ResumenGrafo,
} from "../services/api";

interface GrafoRespuesta {
  nodes: ElementDefinition[];
  edges: ElementDefinition[];
  resumen?: ResumenGrafo;
}

const API_URL = "http://127.0.0.1:8000";

export default function ExploradorGrafoPage() {
  const [modo, setModo] = useState<"aspirante" | "red">(
    "aspirante"
  );

  // Estado modo aspirante
  const [correlativo, setCorrelativo] = useState("");
  const [filtroMateriaAsp, setFiltroMateriaAsp] = useState("");
  const [filtroAnioAsp, setFiltroAnioAsp] = useState("");
  const [filtroAprobadoAsp, setFiltroAprobadoAsp] = useState("");
  const [incluirContexto, setIncluirContexto] = useState(true);

  // Aspirantes sugeridos para 1 clic
  const [sugeridos, setSugeridos] = useState<AspiranteSugerido[]>(
    []
  );
  const [busquedaSugeridos, setBusquedaSugeridos] = useState("");
  const [cargandoSugeridos, setCargandoSugeridos] =
    useState(false);

  // Opciones dinámicas desde Neo4j
  const [opciones, setOpciones] = useState<OpcionesFiltrosGrafo>({
    materias: ["MATEMATICA", "COMPUTACION", "MATEMATICA ITUGS"],
    carreras: [],
    departamentos: [],
    anios: [
      2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
    ],
  });

  // Estado modo red multicriterio
  const [redCarrera, setRedCarrera] = useState("");
  const [redDepartamento, setRedDepartamento] = useState("");
  const [redMateria, setRedMateria] = useState("");
  const [redAnio, setRedAnio] = useState("");
  const [redAprobado, setRedAprobado] = useState("");
  const [redLimite, setRedLimite] = useState(30);

  // Resultado del grafo
  const [grafo, setGrafo] = useState<GrafoRespuesta | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerOpcionesFiltrosGrafo()
      .then((datos) => {
        if (datos.materias.length > 0 || datos.anios.length > 0) {
          setOpciones(datos);
        }
      })
      .catch(() => {});

    void cargarSugeridos("");
  }, []);

  async function cargarSugeridos(texto: string) {
    setCargandoSugeridos(true);
    try {
      const lista = await obtenerAspirantesSugeridos(texto, 8);
      setSugeridos(lista);
    } catch {
      // Ignorar si aún no hay conexión a Neo4j
    } finally {
      setCargandoSugeridos(false);
    }
  }

  async function buscarGrafoAspirante(
    correlativoObjetivo?: string
  ) {
    const idAspirante = (
      correlativoObjetivo ?? correlativo
    ).trim();

    if (!idAspirante) {
      setError(
        "Ingresa un correlativo de aspirante o selecciona uno de la lista sugerida."
      );
      setGrafo(null);
      return;
    }

    if (correlativoObjetivo) {
      setCorrelativo(correlativoObjetivo);
    }

    setCargando(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filtroMateriaAsp) params.set("materia", filtroMateriaAsp);
      if (filtroAnioAsp) params.set("anio_ingreso", filtroAnioAsp);
      if (filtroAprobadoAsp !== "")
        params.set("aprobado", filtroAprobadoAsp);
      params.set("incluir_contexto", String(incluirContexto));

      const queryStr = params.toString()
        ? `?${params.toString()}`
        : "";

      const respuesta = await fetch(
        `${API_URL}/api/grafos/visualizar/${encodeURIComponent(
          idAspirante
        )}${queryStr}`
      );

      if (respuesta.status === 404) {
        throw new Error(
          "No se encontraron evaluaciones para este aspirante con los filtros seleccionados."
        );
      }

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos: GrafoRespuesta = await respuesta.json();

      if (!datos.nodes?.length) {
        throw new Error(
          "El aspirante no tiene datos para visualizar."
        );
      }

      setGrafo(datos);
    } catch (err) {
      setGrafo(null);
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setCargando(false);
    }
  }

  async function explorarRed() {
    setCargando(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (redCarrera) params.set("carrera", redCarrera);
      if (redDepartamento)
        params.set("departamento", redDepartamento);
      if (redMateria) params.set("materia", redMateria);
      if (redAnio) params.set("anio_ingreso", redAnio);
      if (redAprobado !== "") params.set("aprobado", redAprobado);
      params.set("limite", String(redLimite));

      const respuesta = await fetch(
        `${API_URL}/api/grafos/explorar-red?${params.toString()}`
      );

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos: GrafoRespuesta = await respuesta.json();

      if (!datos.nodes?.length) {
        throw new Error(
          "No se encontraron nodos en Neo4j para esos criterios de filtrado."
        );
      }

      setGrafo(datos);
    } catch (err) {
      setGrafo(null);
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setCargando(false);
    }
  }

  const claseInput =
    "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <Network className="text-sky-400" size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Explorador Interactivo de Grafos Neo4j
            </h1>
            <p className="text-sm text-slate-400">
              Explora visualmente nodos, relaciones y trayectorias académicas con filtros dinámicos.
            </p>
          </div>
        </div>

        {/* Selector de modo de exploración */}
        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setModo("aspirante");
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modo === "aspirante"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserCheck size={16} />
            Por Aspirante
          </button>

          <button
            type="button"
            onClick={() => {
              setModo("red");
              setError("");
              void explorarRed();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              modo === "red"
                ? "bg-violet-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Globe size={16} />
            Red por Carrera / Departamento
          </button>
        </div>
      </header>

      {/* Panel de Búsqueda y Filtros según el modo */}
      {modo === "aspirante" ? (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void buscarGrafoAspirante();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              <div className="xl:col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5">
                  Correlativo del aspirante
                </label>
                <input
                  value={correlativo}
                  onChange={(e) => setCorrelativo(e.target.value)}
                  placeholder="Ej. 949d241ac10256edf11339a303c72a50"
                  className={claseInput}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Filtrar por materia
                </label>
                <select
                  value={filtroMateriaAsp}
                  onChange={(e) =>
                    setFiltroMateriaAsp(e.target.value)
                  }
                  className={claseInput}
                >
                  <option value="">Todas las materias</option>
                  {opciones.materias.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Año de ingreso
                </label>
                <select
                  value={filtroAnioAsp}
                  onChange={(e) => setFiltroAnioAsp(e.target.value)}
                  className={claseInput}
                >
                  <option value="">Todos los años</option>
                  {opciones.anios.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Resultado evaluación
                </label>
                <select
                  value={filtroAprobadoAsp}
                  onChange={(e) =>
                    setFiltroAprobadoAsp(e.target.value)
                  }
                  className={claseInput}
                >
                  <option value="">Todos</option>
                  <option value="true">Aprobado</option>
                  <option value="false">No aprobado</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={incluirContexto}
                  onChange={(e) =>
                    setIncluirContexto(e.target.checked)
                  }
                  className="rounded border-slate-600 text-sky-500 focus:ring-sky-500"
                />
                Incluir nodos de Municipio, Departamento, Tipo de Institución y Período
              </label>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setFiltroMateriaAsp("");
                    setFiltroAnioAsp("");
                    setFiltroAprobadoAsp("");
                    setIncluirContexto(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl"
                >
                  <RotateCcw size={15} />
                  Limpiar filtros
                </button>

                <button
                  type="submit"
                  disabled={cargando}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-sm font-medium rounded-xl shadow-lg shadow-sky-600/20"
                >
                  <Search size={17} />
                  {cargando ? "Consultando Neo4j..." : "Visualizar grafo"}
                </button>
              </div>
            </div>
          </form>

          {/* Selector rápido de aspirantes reales en Neo4j */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-sky-400" />
                Selección rápida de aspirantes en Neo4j (clic para cargar su grafo):
              </span>

              <div className="flex items-center gap-2">
                <input
                  value={busquedaSugeridos}
                  onChange={(e) => {
                    setBusquedaSugeridos(e.target.value);
                    void cargarSugeridos(e.target.value);
                  }}
                  placeholder="Filtrar por carrera, depto o hash..."
                  className="px-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {cargandoSugeridos ? (
              <p className="text-xs text-slate-400">
                Cargando aspirantes destacados desde Neo4j...
              </p>
            ) : sugeridos.length === 0 ? (
              <p className="text-xs text-slate-500">
                No se encontraron sugerencias o Neo4j aún no tiene datos cargados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {sugeridos.map((item) => {
                  const activo = correlativo === item.correlativo;
                  return (
                    <button
                      key={item.correlativo}
                      type="button"
                      onClick={() =>
                        void buscarGrafoAspirante(item.correlativo)
                      }
                      className={`text-left p-3 rounded-xl border transition-all ${
                        activo
                          ? "bg-sky-500/15 border-sky-500/60 shadow-sm"
                          : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-sky-300 font-semibold truncate">
                          {item.correlativo.slice(0, 12)}…
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-slate-200 border border-slate-700 shrink-0">
                          {item.total_evaluaciones} eval.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-1">
                        {item.carreras?.[0] ?? "Sin carrera"}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span className="truncate">
                          {item.departamento}
                        </span>
                        <span className="text-emerald-400 font-medium shrink-0">
                          ✓ {item.aprobadas} aprob.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
      ) : (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
            <Filter size={16} />
            Filtros de Red Global (explora múltiples aspirantes y sus conexiones comunes)
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void explorarRed();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Carrera objetivo
              </label>
              <select
                value={redCarrera}
                onChange={(e) => setRedCarrera(e.target.value)}
                className={claseInput}
              >
                <option value="">Todas las carreras</option>
                {opciones.carreras.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Departamento
              </label>
              <select
                value={redDepartamento}
                onChange={(e) => setRedDepartamento(e.target.value)}
                className={claseInput}
              >
                <option value="">Todos los departamentos</option>
                {opciones.departamentos.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Materia
              </label>
              <select
                value={redMateria}
                onChange={(e) => setRedMateria(e.target.value)}
                className={claseInput}
              >
                <option value="">Todas</option>
                {opciones.materias.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Año ingreso
              </label>
              <select
                value={redAnio}
                onChange={(e) => setRedAnio(e.target.value)}
                className={claseInput}
              >
                <option value="">Todos</option>
                {opciones.anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Estado
              </label>
              <select
                value={redAprobado}
                onChange={(e) => setRedAprobado(e.target.value)}
                className={claseInput}
              >
                <option value="">Todos</option>
                <option value="true">Aprobados</option>
                <option value="false">No aprobados</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Límite evaluaciones
              </label>
              <select
                value={redLimite}
                onChange={(e) =>
                  setRedLimite(Number(e.target.value))
                }
                className={claseInput}
              >
                <option value={15}>15 evaluaciones</option>
                <option value={30}>30 evaluaciones</option>
                <option value={50}>50 evaluaciones</option>
                <option value={80}>80 evaluaciones</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-6 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRedCarrera("");
                  setRedDepartamento("");
                  setRedMateria("");
                  setRedAnio("");
                  setRedAprobado("");
                  setRedLimite(30);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl"
              >
                <RotateCcw size={15} />
                Restablecer
              </button>

              <button
                type="submit"
                disabled={cargando}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-600/20"
              >
                <Globe size={16} />
                {cargando ? "Generando red..." : "Aplicar filtros a la red"}
              </button>
            </div>
          </form>

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

      {/* Resultados visuales y tarjetas resumen del grafo */}
      {grafo && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          {grafo.resumen && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Layers size={14} className="text-sky-400" />
                  Elementos en el Grafo
                </p>
                <p className="text-xl font-bold text-white mt-1">
                  {grafo.nodes.length} nodos · {grafo.edges.length} rel.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className="text-emerald-400"
                  />
                  Evaluaciones Aprobadas
                </p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {grafo.resumen.aprobadas} de{" "}
                  {grafo.resumen.total_evaluaciones}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <XCircle size={14} className="text-rose-400" />
                  Evaluaciones No Aprobadas
                </p>
                <p className="text-xl font-bold text-rose-400 mt-1">
                  {grafo.resumen.reprobadas}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400">
                  Tasa de Aprobación Subgrafo
                </p>
                <p className="text-xl font-bold text-sky-300 mt-1">
                  {grafo.resumen.tasa_aprobacion}%
                </p>
              </div>
            </div>
          )}

          <GrafoInteractivo
            grafo={grafo}
            onSeleccionarAspirante={(corr) => {
              setModo("aspirante");
              void buscarGrafoAspirante(corr);
            }}
          />
        </section>
      )}
    </div>
  );
}
