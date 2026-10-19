
export interface ConsultaNeo4j {
  id: number;
  nombre: string;
  descripcion: string;
  endpoint: string;
  requiereCorrelativo?: boolean;
}

export const consultasNeo4j: ConsultaNeo4j[] = [
  {
    id: 1,
    nombre: "Evaluaciones y aprobaciones por materia",
    descripcion: "Cuenta las evaluaciones, aprobaciones y tasas de aprobación de cada materia.",
    endpoint: "/aprobaciones-materia",
  },
  {
    id: 2,
    nombre: "Aspirantes por departamento",
    descripcion: "Recorre aspirantes, evaluaciones, municipios y departamentos para identificar las principales procedencias.",
    endpoint: "/aspirantes-departamento",
  },
  {
    id: 3,
    nombre: "Historial académico por aspirante",
    descripcion: "Recupera materias, intentos, resultados y carreras relacionadas con un aspirante.",
    endpoint: "/historial",
    requiereCorrelativo: true,
  },
  {
    id: 4,
    nombre: "Carreras más demandadas por departamento",
    descripcion: "Identifica la carrera con más aspirantes dentro de cada departamento.",
    endpoint: "/carreras-departamento",
  },
  {
    id: 5,
    nombre: "Desempeño por número de oportunidad",
    descripcion: "Compara las evaluaciones aprobadas y sus porcentajes según la materia y oportunidad.",
    endpoint: "/desempeno-intentos",
  },
];
