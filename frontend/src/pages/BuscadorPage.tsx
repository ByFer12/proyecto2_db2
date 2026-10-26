
import { useState, type FormEvent } from "react";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  buscarEvaluaciones,
  type FiltrosBusqueda,
  type RespuestaBusqueda,
} from "../services/api";

import ResultsTable from "../components/common/ResultsTable";

const filtrosIniciales: FiltrosBusqueda = {
  correlativo: "",
  materia: "",
  carrera: "",
  sexo: "",
  institucion: "",
  municipio: "",
  departamento: "",
  anio: "",
  aprobado: "",
};

export default function BuscadorPage() {
  const [filtros, setFiltros] =
    useState<FiltrosBusqueda>({ ...filtrosIniciales });

  const [filtrosAplicados, setFiltrosAplicados] =
    useState<FiltrosBusqueda>({ ...filtrosIniciales });

  const [datos, setDatos] = useState<RespuestaBusqueda | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function actualizar(campo: keyof FiltrosBusqueda, valor: string) {
    setFiltros((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function ejecutar(
    pagina: number,
    criterios: FiltrosBusqueda
  ) {
    setCargando(true);
    setError("");

    try {
      const respuesta = await buscarEvaluaciones(
        criterios,
        pagina,
        20
      );

      setDatos(respuesta);
      setFiltrosAplicados({ ...criterios });
    } catch (err) {
      setDatos(null);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo realizar la búsqueda."
      );
    } finally {
      setCargando(false);
    }
  }

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void ejecutar(1, filtros);
  }

  function limpiar() {
    setFiltros({ ...filtrosIniciales });
    setDatos(null);
    setError("");
  }

  const claseInput =
    "w-full bg-slate-800 border border-slate-700 " +
    "rounded-lg px-3 py-2.5 text-white " +
    "focus:outline-none focus:border-sky-500";

  return (
    <div className="space-y-6">
      <header className="flex gap-3 items-center">
        <Search size={30} className="text-sky-400" />
        <div>
          <h1 className="text-2xl font-bold">
            Buscador de evaluaciones
          </h1>
          <p className="text-sm text-slate-400">
            Explora las pruebas específicas USAC 2015–2024.
          </p>
        </div>
      </header>

      <form
        onSubmit={buscar}
        className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold">
          Filtros de búsqueda
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2">
              Correlativo de aspirante
            </label>
            <input
              className={claseInput}
              value={filtros.correlativo}
              onChange={(e) =>
                actualizar("correlativo", e.target.value)
              }
              placeholder="Correlativo completo"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Materia
            </label>
            <select
              className={claseInput}
              value={filtros.materia}
              onChange={(e) =>
                actualizar("materia", e.target.value)
              }
            >
              <option value="">Todas</option>
              <option value="MATEMATICA">Matemática</option>
              <option value="COMPUTACION">Computación</option>
              <option value="MATEMATICA ITUGS">
                Matemática ITUGS
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Carrera objetivo
            </label>
            <input
              className={claseInput}
              value={filtros.carrera}
              onChange={(e) =>
                actualizar("carrera", e.target.value)
              }
              placeholder="Ej. INGENIERIA INDUSTRIAL"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Departamento
            </label>
            <input
              className={claseInput}
              value={filtros.departamento}
              onChange={(e) =>
                actualizar("departamento", e.target.value)
              }
              placeholder="Ej. GUATEMALA"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Municipio
            </label>
            <input
              className={claseInput}
              value={filtros.municipio}
              onChange={(e) =>
                actualizar("municipio", e.target.value)
              }
              placeholder="Ej. GUATEMALA - CIUDAD"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Tipo de institución
            </label>
            <select
              className={claseInput}
              value={filtros.institucion}
              onChange={(e) =>
                actualizar("institucion", e.target.value)
              }
            >
              <option value="">Todas</option>
              <option value="PRIVADO">Privado</option>
              <option value="PUBLICO">Público</option>
              <option value="COOPERATIVA">Cooperativa</option>
              <option value="MUNICIPAL">Municipal</option>
              <option value="SIN DATOS">Sin datos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Sexo
            </label>
            <select
              className={claseInput}
              value={filtros.sexo}
              onChange={(e) =>
                actualizar("sexo", e.target.value)
              }
            >
              <option value="">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Año de ingreso
            </label>
            <select
              className={claseInput}
              value={filtros.anio}
              onChange={(e) =>
                actualizar("anio", e.target.value)
              }
            >
              <option value="">Todos los años</option>
              {Array.from({ length: 10 }, (_, i) => 2015 + i)
                .map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Resultado
            </label>
            <select
              className={claseInput}
              value={filtros.aprobado}
              onChange={(e) =>
                actualizar("aprobado", e.target.value)
              }
            >
              <option value="">Todos</option>
              <option value="true">Aprobado</option>
              <option value="false">No aprobado</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={cargando}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 px-5 py-3 rounded-lg font-medium"
          >
            <Search size={18} />
            {cargando ? "Buscando..." : "Buscar evaluaciones"}
          </button>

          <button
            type="button"
            onClick={limpiar}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-lg"
          >
            <RotateCcw size={18} />
            Limpiar
          </button>
        </div>

        {error && (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        )}
      </form>

      {datos && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Resultados de búsqueda
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {datos.total.toLocaleString("es-GT")} evaluaciones encontradas
              </p>
            </div>

            <span className="text-sm text-slate-400">
              Página {datos.pagina} de {datos.total_paginas || 1}
            </span>
          </div>

          <ResultsTable datos={datos.resultados} />

          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-slate-400">
              Mostrando {datos.resultados.length} registros
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={cargando || datos.pagina <= 1}
                onClick={() =>
                  void ejecutar(datos.pagina - 1, filtrosAplicados)
                }
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <button
                type="button"
                disabled={
                  cargando ||
                  datos.pagina >= datos.total_paginas
                }
                onClick={() =>
                  void ejecutar(datos.pagina + 1, filtrosAplicados)
                }
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
