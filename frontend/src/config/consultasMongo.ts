
export interface ConsultaMongo {
  id: number;
  nombre: string;
  endpoint: string;
  metodo?: "GET" | "POST";
  requiereCorrelativo?: boolean;
}

export const consultasMongo: ConsultaMongo[] = [
  { id: 1, nombre: "Aspirantes por institución", endpoint: "/aspirantes-institucion" },
  { id: 2, nombre: "Aprobados por materia", endpoint: "/aprobados-materia" },
  { id: 3, nombre: "Aprobados por carrera y año", endpoint: "/aprobados-carrera-anio" },
  { id: 4, nombre: "Porcentaje de aprobación por materia", endpoint: "/porcentaje-aprobacion-materia" },
  { id: 5, nombre: "Promedio de edad por carrera", endpoint: "/promedio-edad-carrera" },
  { id: 6, nombre: "Generar resumen por carrera", endpoint: "/generar-resumen-carrera", metodo: "POST" },
  { id: 7, nombre: "Edad de aprobados por carrera e institución", endpoint: "/promedio-edad-aprobados-carrera-institucion" },
  { id: 8, nombre: "Aprobados por municipio y carrera", endpoint: "/aprobados-municipio-carrera" },
  { id: 9, nombre: "Evaluaciones mensuales de instituciones públicas", endpoint: "/evaluaciones-mensuales-publicas" },
  { id: 10, nombre: "Top 5 carreras entre 16 y 18 años", endpoint: "/top-carreras-jovenes" },
  { id: 11, nombre: "Historial de desempeño por aspirante", endpoint: "/historial-desempeno", requiereCorrelativo: true },
  { id: 12, nombre: "Distribución por sexo e institución", endpoint: "/distribucion-sexo-institucion" },
  { id: 13, nombre: "Tasa de aprobación por edad", endpoint: "/tasa-aprobacion-edad" },
  { id: 14, nombre: "Promedio de intentos por materia", endpoint: "/promedio-intentos-materia" },
  { id: 15, nombre: "Historial completo de aspirante", endpoint: "/historial-completo", requiereCorrelativo: true },
  { id: 16, nombre: "Carreras con reprobados en primer intento", endpoint: "/carreras-reprobados-primer-intento" },
  { id: 17, nombre: "Top 5 municipios con más aspirantes", endpoint: "/top-municipios-aspirantes" },
  { id: 18, nombre: "Tasa de aprobación por institución", endpoint: "/tasa-aprobacion-institucion" },
  { id: 19, nombre: "Carreras demandadas por departamento", endpoint: "/carreras-demandadas-departamento" },
  { id: 20, nombre: "Evolución anual de aprobación", endpoint: "/evolucion-aprobacion-anual" },
];
