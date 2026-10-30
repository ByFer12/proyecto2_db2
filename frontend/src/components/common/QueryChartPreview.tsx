import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  EyeOff,
  Eye,
} from "lucide-react";

interface Props {
  datos: Record<string, unknown>[];
  colorPrimario?: string;
}

const PALETA = [
  "#38bdf8",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function QueryChartPreview({
  datos,
  colorPrimario = "#38bdf8",
}: Props) {
  const [tipoGrafica, setTipoGrafica] = useState<
    "barras" | "lineas" | "pastel"
  >("barras");
  const [metricaSeleccionada, setMetricaSeleccionada] =
    useState<string>("");
  const [mostrar, setMostrar] = useState(true);

  const analisis = useMemo(() => {
    if (!datos || datos.length === 0) return null;

    const muestra = datos.slice(0, 25);
    const claves = Array.from(
      new Set(muestra.flatMap((d) => Object.keys(d)))
    );

    const clavesNumericas: string[] = [];
    const clavesTexto: string[] = [];

    for (const clave of claves) {
      const valoresValidos = muestra
        .map((fila) => fila[clave])
        .filter((v) => v !== null && v !== undefined);

      if (valoresValidos.length === 0) continue;

      const todosNumeros = valoresValidos.every(
        (v) =>
          typeof v === "number" &&
          !Number.isNaN(v) &&
          clave !== "fila_origen"
      );

      if (todosNumeros) {
        // Si es anio o edad o mes o intento y hay otras métricas, preferirlo como categoría eje X
        if (
          ["anio", "anio_ingreso", "anio_de_ingreso", "edad", "mes"].includes(
            clave
          )
        ) {
          clavesTexto.push(clave);
        } else {
          clavesNumericas.push(clave);
        }
      } else if (
        typeof valoresValidos[0] === "string" ||
        typeof valoresValidos[0] === "number"
      ) {
        clavesTexto.push(clave);
      }
    }

    if (clavesNumericas.length === 0) return null;

    // Construir etiqueta compuesta si hay más de una columna de categoría relevante
    const clavesEjeX =
      clavesTexto.length > 0 ? clavesTexto.slice(0, 2) : [claves[0]];

    const datosGrafica = datos.slice(0, 20).map((fila, idx) => {
      const etiqueta =
        clavesEjeX
          .map((k) => String(fila[k] ?? ""))
          .filter(Boolean)
          .join(" · ") || `#${idx + 1}`;

      const item: Record<string, unknown> = {
        _etiqueta:
          etiqueta.length > 26
            ? `${etiqueta.slice(0, 24)}…`
            : etiqueta,
        _etiquetaCompleta: etiqueta,
      };

      for (const numKey of clavesNumericas) {
        item[numKey] = Number(fila[numKey] ?? 0);
      }

      return item;
    });

    return {
      clavesNumericas,
      datosGrafica,
    };
  }, [datos]);

  if (!analisis || analisis.datosGrafica.length < 1) {
    return null;
  }

  const metricaActiva =
    metricaSeleccionada &&
    analisis.clavesNumericas.includes(metricaSeleccionada)
      ? metricaSeleccionada
      : analisis.clavesNumericas[0];

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={17} className="text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Vista gráfica rápida de resultados (Top{" "}
            {analisis.datosGrafica.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {analisis.clavesNumericas.length > 1 && mostrar && (
            <select
              value={metricaActiva}
              onChange={(e) =>
                setMetricaSeleccionada(e.target.value)
              }
              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              {analisis.clavesNumericas.map((k) => (
                <option key={k} value={k}>
                  Métrica: {k.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          )}

          {mostrar && (
            <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setTipoGrafica("barras")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs ${
                  tipoGrafica === "barras"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart3 size={13} />
                Barras
              </button>
              <button
                type="button"
                onClick={() => setTipoGrafica("lineas")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs ${
                  tipoGrafica === "lineas"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LineChartIcon size={13} />
                Líneas
              </button>
              <button
                type="button"
                onClick={() => setTipoGrafica("pastel")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs ${
                  tipoGrafica === "pastel"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <PieChartIcon size={13} />
                Pastel
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrar((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
          >
            {mostrar ? <EyeOff size={13} /> : <Eye size={13} />}
            {mostrar ? "Ocultar gráfica" : "Mostrar gráfica"}
          </button>
        </div>
      </div>

      {mostrar && (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {tipoGrafica === "barras" ? (
              <BarChart data={analisis.datosGrafica}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="_etiqueta"
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={0}
                  angle={
                    analisis.datosGrafica.length > 6 ? -20 : 0
                  }
                  textAnchor={
                    analisis.datosGrafica.length > 6
                      ? "end"
                      : "middle"
                  }
                  height={
                    analisis.datosGrafica.length > 6 ? 55 : 30
                  }
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey={metricaActiva}
                  name={metricaActiva.replaceAll("_", " ")}
                  fill={colorPrimario}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            ) : tipoGrafica === "lineas" ? (
              <LineChart data={analisis.datosGrafica}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="_etiqueta"
                  stroke="#94a3b8"
                  fontSize={11}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey={metricaActiva}
                  name={metricaActiva.replaceAll("_", " ")}
                  stroke={colorPrimario}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Pie
                  data={analisis.datosGrafica.slice(0, 8)}
                  dataKey={metricaActiva}
                  nameKey="_etiqueta"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={38}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {analisis.datosGrafica
                    .slice(0, 8)
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PALETA[index % PALETA.length]}
                      />
                    ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

