
import { useEffect, useState } from "react";
import {
  obtenerAprobacionesMateria,
  obtenerEvolucionAnual,
  type AprobacionMateria,
  type EvolucionAnual,
} from "../services/api";

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function DashboardPage() {
  const [materias, setMaterias] = useState<AprobacionMateria[]>([]);
  const [anios, setAnios] = useState<EvolucionAnual[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      obtenerAprobacionesMateria(),
      obtenerEvolucionAnual(),
    ])
      .then(([datosMaterias, datosAnios]) => {
        setMaterias(datosMaterias);
        setAnios(datosAnios);
      })
      .catch(() => setError("No se pudieron cargar las estadísticas"))
      .finally(() => setCargando(false));
  }, []);

  const total = anios.reduce(
    (acumulado, a) => acumulado + a.total_evaluaciones, 0
  );

  const aprobadas = anios.reduce(
    (acumulado, a) => acumulado + a.aprobadas, 0
  );

  const tasa = total > 0
    ? ((aprobadas / total) * 100).toFixed(2)
    : "0.00";

  const formato = new Intl.NumberFormat("es-GT");

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-8">

        <header>
          <h1 className="text-3xl font-bold">USAC Analytics</h1>
          <p className="text-slate-400 mt-2">
            Análisis de Pruebas Específicas · 2015–2024
          </p>
        </header>

        {cargando && <p>Cargando estadísticas...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!cargando && !error && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                ["Total de evaluaciones", formato.format(total)],
                ["Evaluaciones aprobadas", formato.format(aprobadas)],
                ["Tasa de aprobación", `${tasa}%`],
              ].map(([titulo, valor]) => (
                <div
                  key={titulo}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6"
                >
                  <p className="text-slate-400 text-sm">{titulo}</p>
                  <h2 className="text-3xl font-bold mt-3">{valor}</h2>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6">
                  Aprobación por materia
                </h2>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materias}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="materia" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar
                        dataKey="porcentaje_aprobacion"
                        name="Aprobación (%)"
                        fill="#38bdf8"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-6">
                  Evolución anual de aprobación
                </h2>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={anios}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="anio_ingreso" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="porcentaje_aprobacion"
                        name="Aprobación (%)"
                        stroke="#38bdf8"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
