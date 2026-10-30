import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Clock,
  Database,
  Network,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCheck,
} from "lucide-react";

import {
  importarArchivosCSV,
  obtenerHistorialCargas,
  type RespuestaImportacion,
  type ArchivoImportado,
  type ResultadoMongoImportacion,
} from "../services/api";

const MAX_ARCHIVOS = 15;
const MAX_BYTES = 20 * 1024 * 1024;

export default function ImportarCSVPage() {
  const [archivos, setArchivos] = useState<File[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [progresoActual, setProgresoActual] = useState<{
    indice: number;
    total: number;
    nombre: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [respuesta, setRespuesta] =
    useState<RespuestaImportacion | null>(null);

  const [historial, setHistorial] = useState<
    ResultadoMongoImportacion[]
  >([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [erroresExpandidos, setErroresExpandidos] = useState<
    Record<string, boolean>
  >({});

  const inputRef = useRef<HTMLInputElement>(null);

  async function cargarHistorial() {
    setCargandoHistorial(true);
    try {
      const datos = await obtenerHistorialCargas();
      setHistorial(datos);
    } catch {
      // Si el backend no está disponible aún, ignorar silenciosamente
    } finally {
      setCargandoHistorial(false);
    }
  }

  useEffect(() => {
    void cargarHistorial();
  }, []);

  function procesarNuevosArchivos(nuevos: File[]) {
    setError("");
    setRespuesta(null);

    if (nuevos.length === 0) return;

    // Combinar con los ya seleccionados evitando duplicados por nombre y tamaño
    const combinados = [...archivos];
    const erroresValidacion: string[] = [];

    for (const archivo of nuevos) {
      if (!archivo.name.toLowerCase().endsWith(".csv")) {
        erroresValidacion.push(
          `"${archivo.name}" no tiene extensión .csv.`
        );
        continue;
      }
      if (archivo.size === 0) {
        erroresValidacion.push(`"${archivo.name}" está vacío.`);
        continue;
      }
      if (archivo.size > MAX_BYTES) {
        erroresValidacion.push(
          `"${archivo.name}" supera el límite de 20 MB.`
        );
        continue;
      }

      const yaExiste = combinados.some(
        (a) => a.name === archivo.name && a.size === archivo.size
      );
      if (!yaExiste) {
        combinados.push(archivo);
      }
    }

    if (combinados.length > MAX_ARCHIVOS) {
      setError(
        `Puedes importar hasta ${MAX_ARCHIVOS} archivos por lote (intentaste agregar ${combinados.length}).`
      );
      setArchivos(combinados.slice(0, MAX_ARCHIVOS));
      return;
    }

    if (erroresValidacion.length > 0) {
      setError(erroresValidacion.join(" "));
    }

    setArchivos(combinados);
  }

  function seleccionarArchivos(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const seleccionados = Array.from(evento.target.files ?? []);
    procesarNuevosArchivos(seleccionados);
    evento.target.value = "";
  }

  function manejarDragOver(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    if (!cargando) {
      setArrastrando(true);
    }
  }

  function manejarDragLeave(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    setArrastrando(false);
  }

  function manejarDrop(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    setArrastrando(false);

    if (cargando) return;

    const soltados = Array.from(evento.dataTransfer.files ?? []);
    procesarNuevosArchivos(soltados);
  }

  function quitarArchivo(indice: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== indice));
    setError("");
  }

  async function importar() {
    if (archivos.length === 0) {
      setError("Selecciona o arrastra al menos un archivo CSV.");
      return;
    }

    setCargando(true);
    setError("");
    setRespuesta(null);

    const resultadosAcumulados: ArchivoImportado[] = [];
    let completados = 0;

    try {
      for (let i = 0; i < archivos.length; i++) {
        const archivoActual = archivos[i];
        setProgresoActual({
          indice: i + 1,
          total: archivos.length,
          nombre: archivoActual.name,
        });

        const resIndividual = await importarArchivosCSV([
          archivoActual,
        ]);

        for (const item of resIndividual.resultados) {
          resultadosAcumulados.push(item);
          if (item.estado === "completado") {
            completados += 1;
          }
        }

        // Actualizar vista parcial en tiempo real
        setRespuesta({
          archivos_recibidos: archivos.length,
          archivos_completados: completados,
          resultados: [...resultadosAcumulados],
        });
      }

      void cargarHistorial();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron importar los archivos."
      );
    } finally {
      setCargando(false);
      setProgresoActual(null);
    }
  }

  const numero = (valor: number) => valor.toLocaleString("es-GT");

  const tamanoTotalMB =
    archivos.reduce((acc, a) => acc + a.size, 0) / 1024 / 1024;

  const totalLeidos =
    respuesta?.resultados.reduce(
      (total, r) => total + (r.mongodb?.total ?? 0),
      0
    ) ?? 0;

  const totalValidos =
    respuesta?.resultados.reduce(
      (total, r) => total + (r.mongodb?.validos ?? 0),
      0
    ) ?? 0;

  const totalRechazados =
    respuesta?.resultados.reduce(
      (total, r) => total + (r.mongodb?.rechazados ?? 0),
      0
    ) ?? 0;

  const totalNeo4j =
    respuesta?.resultados.reduce(
      (total, r) =>
        total + (r.neo4j?.registros_sincronizados ?? 0),
      0
    ) ?? 0;

  const tiempoTotalLote =
    respuesta?.resultados.reduce(
      (total, r) => total + (r.duracion_total_segundos ?? 0),
      0
    ) ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <UploadCloud className="text-sky-400" size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Importación y ETL de archivos CSV
            </h1>
            <p className="text-sm text-slate-400">
              Arrastra uno o varios archivos CSV para validarlos, transformarlos y sincronizarlos en MongoDB y Neo4j.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMostrarHistorial((prev) => !prev);
            if (!mostrarHistorial) void cargarHistorial();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm text-slate-200 transition-colors"
        >
          <History size={17} className="text-sky-400" />
          Historial de cargas ({historial.length})
          {mostrarHistorial ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </header>

      {/* Historial de cargas colapsable */}
      {mostrarHistorial && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <History size={18} className="text-sky-400" />
              Últimas ejecuciones registradas en MongoDB (`historial_cargas`)
            </h2>
            <button
              type="button"
              onClick={() => void cargarHistorial()}
              disabled={cargandoHistorial}
              className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-white"
            >
              <RefreshCw
                size={14}
                className={cargandoHistorial ? "animate-spin" : ""}
              />
              Actualizar
            </button>
          </div>

          {historial.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aún no hay cargas registradas en el historial.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-64">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-300 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5">Archivo</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5">Leídos</th>
                    <th className="px-3 py-2.5">Válidos</th>
                    <th className="px-3 py-2.5">Rechazados</th>
                    <th className="px-3 py-2.5">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item, idx) => (
                    <tr
                      key={`${item.archivo}-${idx}`}
                      className="border-t border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 font-medium text-slate-200">
                        {item.archivo}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {numero(item.total)}
                      </td>
                      <td className="px-3 py-2 text-emerald-400">
                        {numero(item.validos)}
                      </td>
                      <td className="px-3 py-2 text-amber-400">
                        {numero(item.rechazados)}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {item.duracion_segundos} s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Zona principal de Drag & Drop */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div
          onDragOver={manejarDragOver}
          onDragEnter={manejarDragOver}
          onDragLeave={manejarDragLeave}
          onDrop={manejarDrop}
          onClick={() => !cargando && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!cargando) inputRef.current?.click();
            }
          }}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
            arrastrando
              ? "border-sky-400 bg-sky-500/10 scale-[1.01] shadow-lg shadow-sky-500/10"
              : "border-slate-700 hover:border-sky-500/80 hover:bg-slate-800/40"
          } ${cargando ? "opacity-60 pointer-events-none" : ""}`}
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-transform ${
              arrastrando
                ? "bg-sky-500/20 text-sky-300 scale-110"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {arrastrando ? (
              <UploadCloud size={36} />
            ) : (
              <FileSpreadsheet size={36} />
            )}
          </div>

          <p className="text-lg font-semibold text-white">
            {arrastrando
              ? "¡Suelta tus archivos CSV aquí!"
              : "Arrastra y suelta tus archivos CSV aquí"}
          </p>

          <p className="text-sm text-slate-400 mt-1">
            o{" "}
            <span className="text-sky-400 underline font-medium">
              haz clic para explorar en tu equipo
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-slate-400">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              Hasta {MAX_ARCHIVOS} archivos CSV por lote
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              Máximo 20 MB por archivo
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              Codificación UTF-8 / UTF-8-SIG
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            disabled={cargando}
            onChange={seleccionarArchivos}
            className="hidden"
          />
        </div>

        {/* Lista de archivos en cola */}
        {archivos.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-200">
                  Archivos listos para procesar ({archivos.length} /{" "}
                  {MAX_ARCHIVOS})
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Total: {tamanoTotalMB.toFixed(2)} MB
                </span>
              </div>

              <button
                type="button"
                disabled={cargando}
                onClick={() => {
                  setArchivos([]);
                  setRespuesta(null);
                  setError("");
                }}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 disabled:opacity-40 transition-colors"
              >
                <Trash2 size={15} />
                Vaciar lista
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {archivos.map((archivo, indice) => (
                <div
                  key={`${archivo.name}-${archivo.size}-${indice}`}
                  className="bg-slate-800/80 border border-slate-700/70 rounded-xl px-4 py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck
                      size={20}
                      className="text-emerald-400 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {archivo.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(archivo.size / 1024 / 1024).toFixed(2)} MB · Listo para validar
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cargando}
                    onClick={() => quitarArchivo(indice)}
                    title="Quitar archivo"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/60 disabled:opacity-40"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de progreso en vivo */}
        {cargando && progresoActual && (
          <div
            role="status"
            className="bg-sky-950/30 border border-sky-800/50 rounded-xl p-4 space-y-2.5"
          >
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-sky-300 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Procesando {progresoActual.nombre}...
              </span>
              <span className="text-slate-300 font-semibold">
                Archivo {progresoActual.indice} de{" "}
                {progresoActual.total} (
                {Math.round(
                  (progresoActual.indice / progresoActual.total) * 100
                )}
                %)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
                style={{
                  width: `${
                    (progresoActual.indice / progresoActual.total) *
                    100
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Ejecutando limpieza ETL, insertando lotes en MongoDB y fusionando nodos/relaciones en Neo4j...
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={cargando || archivos.length === 0}
            onClick={importar}
            className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-sky-600/20"
          >
            {cargando ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando ETL...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Iniciar importación ({archivos.length})
              </>
            )}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 text-red-300 flex items-start gap-2.5 text-sm"
          >
            <AlertCircle size={19} className="shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Resultados del proceso de carga */}
      {respuesta && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Resumen general de la operación
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {respuesta.archivos_completados} de{" "}
                {respuesta.archivos_recibidos} archivos procesados correctamente
              </p>
            </div>

            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Clock size={14} />
              Tiempo acumulado: {tiempoTotalLote.toFixed(2)} s
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-400 text-xs uppercase tracking-wider">
                Total Registros Leídos
              </p>
              <p className="text-3xl font-bold mt-2 text-white">
                {numero(totalLeidos)}
              </p>
            </div>

            <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-5">
              <p className="text-emerald-400 text-xs uppercase tracking-wider">
                Procesados Válidos (MongoDB)
              </p>
              <p className="text-3xl font-bold mt-2 text-emerald-300">
                {numero(totalValidos)}
              </p>
            </div>

            <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-5">
              <p className="text-amber-400 text-xs uppercase tracking-wider">
                Registros Rechazados
              </p>
              <p className="text-3xl font-bold mt-2 text-amber-300">
                {numero(totalRechazados)}
              </p>
            </div>

            <div className="bg-slate-900 border border-violet-900/40 rounded-xl p-5">
              <p className="text-violet-400 text-xs uppercase tracking-wider">
                Sincronizados en Neo4j
              </p>
              <p className="text-3xl font-bold mt-2 text-violet-300">
                {numero(totalNeo4j)}
              </p>
            </div>
          </div>

          {/* Detalle individual por archivo (cumpliendo todos los campos del enunciado) */}
          <div className="space-y-4">
            {respuesta.resultados.map((resultado, indice) => {
              const claveArchivo = `${resultado.archivo_original}-${indice}`;
              const expandido =
                erroresExpandidos[claveArchivo] ?? true;
              const tasaExito =
                resultado.mongodb && resultado.mongodb.total > 0
                  ? (
                      (resultado.mongodb.validos /
                        resultado.mongodb.total) *
                      100
                    ).toFixed(1)
                  : "0.0";

              return (
                <article
                  key={claveArchivo}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {resultado.estado === "completado" ? (
                        <CheckCircle2
                          className="text-emerald-400 shrink-0"
                          size={22}
                        />
                      ) : (
                        <AlertCircle
                          className="text-red-400 shrink-0"
                          size={22}
                        />
                      )}

                      <div>
                        <h3 className="font-semibold text-base break-all text-white">
                          {resultado.archivo_original}
                        </h3>
                        {resultado.archivo_guardado && (
                          <p className="text-xs text-slate-400">
                            Almacenado como:{" "}
                            <code className="text-sky-300">
                              {resultado.archivo_guardado}
                            </code>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          resultado.estado === "completado"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-red-500/15 text-red-300 border-red-500/30"
                        }`}
                      >
                        Estado: {resultado.estado.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
                        {resultado.duracion_total_segundos} s
                      </span>
                    </div>
                  </div>

                  {resultado.mensaje && (
                    <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                      Causa del error: {resultado.mensaje}
                    </p>
                  )}

                  {resultado.mongodb && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                      <div>
                        <p className="text-xs text-slate-400">
                          Registros leídos
                        </p>
                        <p className="font-semibold text-white mt-0.5">
                          {numero(resultado.mongodb.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Procesados válidos
                        </p>
                        <p className="font-semibold text-emerald-400 mt-0.5">
                          {numero(resultado.mongodb.validos)} ({tasaExito}%)
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Rechazados / Error
                        </p>
                        <p className="font-semibold text-amber-400 mt-0.5">
                          {numero(resultado.mongodb.rechazados)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Database size={12} className="text-emerald-400" />
                          Tiempo MongoDB
                        </p>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {resultado.mongodb.duracion_segundos} s
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Network size={12} className="text-violet-400" />
                          Sincronizados Neo4j
                        </p>
                        <p className="font-semibold text-violet-300 mt-0.5">
                          {numero(
                            resultado.neo4j
                              ?.registros_sincronizados ?? 0
                          )}{" "}
                          ({resultado.neo4j?.duracion_segundos ?? 0} s)
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Tiempo total
                        </p>
                        <p className="font-semibold text-sky-300 mt-0.5">
                          {resultado.duracion_total_segundos} s
                        </p>
                      </div>
                    </div>
                  )}

                  {resultado.mongodb?.errores &&
                    resultado.mongodb.errores.length > 0 && (
                      <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-red-300 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Detalle de registros rechazados y su causa (
                            {resultado.mongodb.errores.length}{" "}
                            mostrados)
                          </h4>

                          <button
                            type="button"
                            onClick={() =>
                              setErroresExpandidos((prev) => ({
                                ...prev,
                                [claveArchivo]: !expandido,
                              }))
                            }
                            className="text-xs text-red-300 hover:text-white flex items-center gap-1"
                          >
                            {expandido ? "Ocultar" : "Mostrar"}
                            {expandido ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </div>

                        {expandido && (
                          <div className="overflow-x-auto max-h-56 rounded-lg border border-red-900/40">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-red-950/60 text-red-200 sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 w-24">
                                    Fila CSV
                                  </th>
                                  <th className="px-3 py-2">
                                    Causa del rechazo
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {resultado.mongodb.errores.map(
                                  (err, i) => (
                                    <tr
                                      key={i}
                                      className="border-t border-red-900/30 hover:bg-red-950/30"
                                    >
                                      <td className="px-3 py-1.5 font-mono text-amber-300">
                                        #{err.fila}
                                      </td>
                                      <td className="px-3 py-1.5 text-slate-200">
                                        {err.motivo}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
