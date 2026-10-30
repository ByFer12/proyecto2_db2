
import { useState, type ChangeEvent } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";


import {
  importarArchivosCSV,
  type RespuestaImportacion,
} from "../services/api";

const MAX_ARCHIVOS = 5;
const MAX_BYTES = 20 * 1024 * 1024;

export default function ImportarCSVPage() {
  const [archivos, setArchivos] = useState<File[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  
  const [respuesta, setRespuesta] =
    useState<RespuestaImportacion | null>(null);

  function seleccionarArchivos(
    evento: ChangeEvent<HTMLInputElement>
  ) {
    const seleccionados = Array.from(evento.target.files ?? []);

    setError("");
    setRespuesta(null);

    if (seleccionados.length > MAX_ARCHIVOS) {
      setError(`Solo puedes seleccionar ${MAX_ARCHIVOS} archivos.`);
      setArchivos([]);
      evento.target.value = "";
      return;
    }

    const archivoInvalido = seleccionados.find(
      (archivo) =>
        !archivo.name.toLowerCase().endsWith(".csv") ||
        archivo.size > MAX_BYTES ||
        archivo.size === 0
    );

    if (archivoInvalido) {
      setError(
        `Archivo inválido: ${archivoInvalido.name}. ` +
        "Debe ser CSV, no estar vacío y pesar como máximo 20 MB."
      );
      setArchivos([]);
      evento.target.value = "";
      return;
    }

    setArchivos(seleccionados);
    evento.target.value = "";
  }

  async function importar() {
    if (archivos.length === 0) {
      setError("Selecciona al menos un archivo CSV.");
      return;
    }

    setCargando(true);
    setError("");
    setRespuesta(null);

    try {
      const resultado = await importarArchivosCSV(archivos);
      setRespuesta(resultado);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron importar los archivos."
      );
    } finally {
      setCargando(false);
    }
  }

  const numero = (valor: number) =>
    valor.toLocaleString("es-GT");

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

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <UploadCloud className="text-sky-400" size={30} />

        <div>
          <h1 className="text-2xl font-bold">
            Importación de archivos CSV
          </h1>
          <p className="text-sm text-slate-400">
            Carga evaluaciones y sincronízalas con MongoDB y Neo4j.
          </p>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <label className="block cursor-pointer border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-xl p-10 text-center transition-colors">
          <FileSpreadsheet
            size={42}
            className="text-green-400 mx-auto mb-4"
          />

          <p className="font-semibold">
            Seleccionar archivos CSV
          </p>

          <p className="text-sm text-slate-400 mt-2">
            Máximo 5 archivos de 20 MB cada uno
          </p>

          <input
            type="file"
            accept=".csv,text/csv"
            multiple
            disabled={cargando}
            onChange={seleccionarArchivos}
            className="hidden"
          />
        </label>

        {archivos.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">
                Archivos seleccionados ({archivos.length})
              </h2>

              <button
                type="button"
                disabled={cargando}
                onClick={() => {
                  setArchivos([]);
                  setRespuesta(null);
                }}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 disabled:opacity-40"
              >
                <Trash2 size={16} />
                Quitar todos
              </button>
            </div>

            {archivos.map((archivo, indice) => (
              <div
                key={`${archivo.name}-${indice}`}
                className="bg-slate-800 rounded-lg p-4 flex justify-between gap-3"
              >
                <span className="truncate">
                  {archivo.name}
                </span>

                <span className="text-sm text-slate-400 shrink-0">
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={cargando || archivos.length === 0}
          onClick={importar}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 px-6 py-3 rounded-lg font-medium"
        >
          {cargando ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Procesando archivos...
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Iniciar importación
            </>
          )}
        </button>

        {cargando && (
          <p className="text-sm text-slate-400" role="status">
            Validando archivos y sincronizando bases de datos.
            No cierres esta página mientras se procesa la solicitud.
          </p>
        )}

        {error && (
          <p role="alert" className="text-red-400 flex gap-2">
            <AlertCircle size={20} className="shrink-0" />
            {error}
          </p>
        )}
      </section>

      {respuesta && (
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold">
              Resultado de la importación
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {respuesta.archivos_completados} de{" "}
              {respuesta.archivos_recibidos} archivos completados
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["Registros válidos", totalValidos],
              ["Registros rechazados", totalRechazados],
              ["Sincronizados con Neo4j", totalNeo4j],
            ].map(([titulo, valor]) => (
              <div
                key={String(titulo)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5"
              >
                <p className="text-slate-400 text-sm">
                  {titulo}
                </p>

                <p className="text-3xl font-bold mt-2">
                  {numero(Number(valor))}
                </p>
              </div>
            ))}
          </div>

          {respuesta.resultados.map((resultado, indice) => (
            <article
              key={`${resultado.archivo_original}-${indice}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                {resultado.estado === "completado" ? (
                  <CheckCircle2 className="text-green-400" />
                ) : (
                  <AlertCircle className="text-red-400" />
                )}

                <h3 className="font-semibold break-all">
                  {resultado.archivo_original}
                </h3>
              </div>

              {resultado.mensaje && (
                <p className="text-red-400">
                  {resultado.mensaje}
                </p>
              )}

              {resultado.mongodb && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <p>
                    <span className="text-slate-400">Procesados:</span>{" "}
                    {numero(resultado.mongodb.total)}
                  </p>

                  <p>
                    <span className="text-slate-400">Válidos:</span>{" "}
                    {numero(resultado.mongodb.validos)}
                  </p>

                  <p>
                    <span className="text-slate-400">Rechazados:</span>{" "}
                    {numero(resultado.mongodb.rechazados)}
                  </p>

                  <p>
                    <span className="text-slate-400">Duración:</span>{" "}
                    {resultado.duracion_total_segundos} s
                  </p>
                </div>
              )}

              {resultado.mongodb?.errores &&
                resultado.mongodb.errores.length > 0 && (
                  <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-red-300">
                      Errores de validación
                    </h4>

                    {resultado.mongodb.errores.map((err, i) => (
                      <p key={i} className="text-sm text-slate-300">
                        Fila {err.fila}: {err.motivo}
                      </p>
                    ))}
                  </div>
                )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
