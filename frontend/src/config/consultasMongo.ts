export interface ConsultaMongo {
  id: number;
  nombre: string;
  descripcion: string;
  endpoint: string;
  metodo?: "GET" | "POST";
  requiereCorrelativo?: boolean;
  pipelineEjemplo: string;
}

export const consultasMongo: ConsultaMongo[] = [
  {
    id: 1,
    nombre: "Aspirantes por institución",
    descripcion:
      "Cantidad de aspirantes únicos agrupados por tipo de institución educativa.",
    endpoint: "/aspirantes-institucion",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $group: {
            _id: {
              institucion: "$tipo_institucion_educativa",
              aspirante: "$correlativo_aspirante",
            },
          },
        },
        {
          $group: {
            _id: "$_id.institucion",
            total_aspirantes: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            tipo_institucion: "$_id",
            total_aspirantes: 1,
          },
        },
        { $sort: { total_aspirantes: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 2,
    nombre: "Aprobados por materia",
    descripcion:
      "Cantidad de evaluaciones aprobadas agrupadas por materia.",
    endpoint: "/aprobados-materia",
    pipelineEjemplo: JSON.stringify(
      [
        { $match: { aprobado: true } },
        {
          $group: {
            _id: "$materia",
            total_aprobados: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            materia: "$_id",
            total_aprobados: 1,
          },
        },
        { $sort: { total_aprobados: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 3,
    nombre: "Aprobados por carrera y año",
    descripcion:
      "Cantidad de aspirantes aprobados agrupados por carrera objetivo y año de ingreso.",
    endpoint: "/aprobados-carrera-anio",
    pipelineEjemplo: JSON.stringify(
      [
        { $match: { aprobado: true } },
        {
          $group: {
            _id: {
              carrera: "$carrera_objetivo",
              anio: "$anio_de_ingreso",
              aspirante: "$correlativo_aspirante",
            },
          },
        },
        {
          $group: {
            _id: { carrera: "$_id.carrera", anio: "$_id.anio" },
            total_aspirantes_aprobados: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            carrera: "$_id.carrera",
            anio_ingreso: "$_id.anio",
            total_aspirantes_aprobados: 1,
          },
        },
        {
          $sort: {
            anio_ingreso: 1,
            total_aspirantes_aprobados: -1,
          },
        },
      ],
      null,
      2
    ),
  },
  {
    id: 4,
    nombre: "Porcentaje de aprobación por materia",
    descripcion:
      "Calcula el porcentaje de aprobación correspondiente a cada materia evaluada.",
    endpoint: "/porcentaje-aprobacion-materia",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $group: {
            _id: "$materia",
            total_evaluaciones: { $sum: 1 },
            aprobadas: {
              $sum: { $cond: ["$aprobado", 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            materia: "$_id",
            total_evaluaciones: 1,
            aprobadas: 1,
            porcentaje_aprobacion: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        "$aprobadas",
                        "$total_evaluaciones",
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { total_evaluaciones: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 5,
    nombre: "Promedio de edad por carrera",
    descripcion:
      "Edad promedio de los aspirantes agrupados por carrera objetivo.",
    endpoint: "/promedio-edad-carrera",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            edad_aproximada: { $gte: 10, $lte: 100 },
          },
        },
        {
          $group: {
            _id: {
              aspirante: "$correlativo_aspirante",
              carrera: "$carrera_objetivo",
              anio: "$anio_de_ingreso",
            },
            edad: { $first: "$edad_aproximada" },
          },
        },
        {
          $group: {
            _id: "$_id.carrera",
            promedio_edad: { $avg: "$edad" },
            total_aspirantes_periodo: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            carrera: "$_id",
            promedio_edad: { $round: ["$promedio_edad", 2] },
            total_aspirantes_periodo: 1,
          },
        },
        { $sort: { carrera: 1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 6,
    nombre: "Generar resumen por carrera",
    descripcion:
      "Genera y actualiza la colección auxiliar resumen_carrera y muestra sus documentos.",
    endpoint: "/generar-resumen-carrera",
    metodo: "POST",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $project: {
            _id: 0,
            carrera: "$_id",
            total_aspirantes: 1,
            total_evaluaciones: 1,
            evaluaciones_aprobadas: 1,
            porcentaje_aprobacion: 1,
          },
        },
        { $sort: { total_aspirantes: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 7,
    nombre: "Edad de aprobados por carrera e institución",
    descripcion:
      "Edad promedio de aspirantes que aprobaron agrupada por carrera y tipo de institución.",
    endpoint: "/promedio-edad-aprobados-carrera-institucion",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            aprobado: true,
            edad_aproximada: { $gte: 10, $lte: 100 },
          },
        },
        {
          $group: {
            _id: {
              carrera: "$carrera_objetivo",
              institucion: "$tipo_institucion_educativa",
            },
            promedio_edad: { $avg: "$edad_aproximada" },
            total_evaluaciones: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            carrera: "$_id.carrera",
            tipo_institucion: "$_id.institucion",
            promedio_edad: { $round: ["$promedio_edad", 2] },
            total_evaluaciones: 1,
          },
        },
      ],
      null,
      2
    ),
  },
  {
    id: 8,
    nombre: "Aprobados por municipio y carrera",
    descripcion:
      "Distribución de aprobados según el municipio de la institución educativa y carrera objetivo.",
    endpoint: "/aprobados-municipio-carrera",
    pipelineEjemplo: JSON.stringify(
      [
        { $match: { aprobado: true } },
        {
          $group: {
            _id: {
              departamento:
                "$departamento_institucion_educativa",
              municipio: "$municipio_institucion_educativa",
              carrera: "$carrera_objetivo",
            },
            total_aprobados: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            departamento: "$_id.departamento",
            municipio: "$_id.municipio",
            carrera: "$_id.carrera",
            total_aprobados: 1,
          },
        },
        { $sort: { total_aprobados: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 9,
    nombre: "Evaluaciones mensuales de instituciones públicas",
    descripcion:
      "Cantidad de evaluaciones por mes y materia considerando aspirantes de instituciones públicas.",
    endpoint: "/evaluaciones-mensuales-publicas",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            tipo_institucion_educativa: "PUBLICO",
          },
        },
        {
          $group: {
            _id: {
              anio: { $year: "$fecha_asignacion" },
              mes: { $month: "$fecha_asignacion" },
              materia: "$materia",
            },
            total_evaluaciones: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            anio: "$_id.anio",
            mes: "$_id.mes",
            materia: "$_id.materia",
            total_evaluaciones: 1,
          },
        },
        { $sort: { anio: 1, mes: 1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 10,
    nombre: "Top 5 carreras entre 16 y 18 años",
    descripcion:
      "Las cinco carreras objetivo con mayor cantidad de aspirantes entre 16 y 18 años.",
    endpoint: "/top-carreras-jovenes",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            edad_aproximada: { $gte: 16, $lte: 18 },
            carrera_objetivo: {
              $nin: ["NINGUNO", "SIN DATOS", ""],
            },
          },
        },
        {
          $group: {
            _id: {
              carrera: "$carrera_objetivo",
              aspirante: "$correlativo_aspirante",
            },
          },
        },
        {
          $group: {
            _id: "$_id.carrera",
            total_aspirantes: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            carrera: "$_id",
            total_aspirantes: 1,
          },
        },
        { $sort: { total_aspirantes: -1 } },
        { $limit: 5 },
      ],
      null,
      2
    ),
  },
  {
    id: 11,
    nombre: "Historial de desempeño por aspirante",
    descripcion:
      "Consulta las evaluaciones, materias, intentos y resultados de un aspirante específico.",
    endpoint: "/historial-desempeno",
    requiereCorrelativo: true,
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            correlativo_aspirante:
              "949d241ac10256edf11339a303c72a50",
          },
        },
        {
          $project: {
            _id: 0,
            correlativo_aspirante: 1,
            fecha_asignacion: 1,
            materia: 1,
            numero_de_fecha_de_evaluacion: 1,
            anio_de_ingreso: 1,
            aprobacion: 1,
            carrera_objetivo: 1,
          },
        },
      ],
      null,
      2
    ),
  },
  {
    id: 12,
    nombre: "Distribución por sexo e institución",
    descripcion:
      "Cantidad de aspirantes agrupados por sexo y tipo de institución educativa.",
    endpoint: "/distribucion-sexo-institucion",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $group: {
            _id: {
              aspirante: "$correlativo_aspirante",
              sexo: "$sexo",
              institucion: "$tipo_institucion_educativa",
            },
          },
        },
        {
          $group: {
            _id: {
              sexo: "$_id.sexo",
              institucion: "$_id.institucion",
            },
            total_aspirantes: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            sexo: "$_id.sexo",
            tipo_institucion: "$_id.institucion",
            total_aspirantes: 1,
          },
        },
      ],
      null,
      2
    ),
  },
  {
    id: 13,
    nombre: "Tasa de aprobación por edad",
    descripcion:
      "Porcentaje de aprobación correspondiente a cada edad registrada.",
    endpoint: "/tasa-aprobacion-edad",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            edad_aproximada: { $gte: 10, $lte: 100 },
          },
        },
        {
          $group: {
            _id: "$edad_aproximada",
            total_evaluaciones: { $sum: 1 },
            evaluaciones_aprobadas: {
              $sum: { $cond: ["$aprobado", 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            edad: "$_id",
            total_evaluaciones: 1,
            evaluaciones_aprobadas: 1,
            porcentaje_aprobacion: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        "$evaluaciones_aprobadas",
                        "$total_evaluaciones",
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { edad: 1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 14,
    nombre: "Promedio de intentos por materia",
    descripcion:
      "Promedio de oportunidades de evaluación utilizadas por los aspirantes en cada materia.",
    endpoint: "/promedio-intentos-materia",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $group: {
            _id: {
              aspirante: "$correlativo_aspirante",
              materia: "$materia",
              anio: "$anio_de_ingreso",
            },
            oportunidades: {
              $addToSet: "$numero_de_fecha_de_evaluacion",
            },
          },
        },
        {
          $project: {
            materia: "$_id.materia",
            cantidad_intentos: { $size: "$oportunidades" },
          },
        },
        {
          $group: {
            _id: "$materia",
            promedio_intentos: { $avg: "$cantidad_intentos" },
            total_aspirantes_periodo: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            materia: "$_id",
            promedio_intentos: {
              $round: ["$promedio_intentos", 2],
            },
            total_aspirantes_periodo: 1,
          },
        },
      ],
      null,
      2
    ),
  },
  {
    id: 15,
    nombre: "Historial completo de aspirante",
    descripcion:
      "Muestra toda la información documental disponible de un aspirante mediante su correlativo.",
    endpoint: "/historial-completo",
    requiereCorrelativo: true,
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            correlativo_aspirante:
              "949d241ac10256edf11339a303c72a50",
          },
        },
        { $sort: { anio_de_ingreso: 1, fecha_asignacion: 1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 16,
    nombre: "Carreras con reprobados en primer intento",
    descripcion:
      "Carreras objetivo con mayor cantidad de aspirantes que no aprobaron en su primera oportunidad.",
    endpoint: "/carreras-reprobados-primer-intento",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            numero_de_fecha_de_evaluacion: 1,
            aprobado: false,
            carrera_objetivo: {
              $nin: ["NINGUNO", "SIN DATOS", ""],
            },
          },
        },
        {
          $group: {
            _id: {
              aspirante: "$correlativo_aspirante",
              carrera: "$carrera_objetivo",
            },
          },
        },
        {
          $group: {
            _id: "$_id.carrera",
            total_aspirantes_reprobados: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            carrera: "$_id",
            total_aspirantes_reprobados: 1,
          },
        },
        { $sort: { total_aspirantes_reprobados: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 17,
    nombre: "Top 5 municipios con más aspirantes",
    descripcion:
      "Los cinco municipios de procedencia con mayor cantidad de aspirantes registrados.",
    endpoint: "/top-municipios-aspirantes",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            municipio_institucion_educativa: {
              $nin: ["", "SIN DATOS"],
            },
          },
        },
        {
          $group: {
            _id: {
              aspirante: "$correlativo_aspirante",
              municipio: "$municipio_institucion_educativa",
              departamento:
                "$departamento_institucion_educativa",
            },
          },
        },
        {
          $group: {
            _id: {
              municipio: "$_id.municipio",
              departamento: "$_id.departamento",
            },
            total_aspirantes: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            municipio: "$_id.municipio",
            departamento: "$_id.departamento",
            total_aspirantes: 1,
          },
        },
        { $sort: { total_aspirantes: -1 } },
        { $limit: 5 },
      ],
      null,
      2
    ),
  },
  {
    id: 18,
    nombre: "Tasa de aprobación por institución",
    descripcion:
      "Calcula y compara el porcentaje de aprobación entre los tipos de institución educativa.",
    endpoint: "/tasa-aprobacion-institucion",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $group: {
            _id: "$tipo_institucion_educativa",
            total_evaluaciones: { $sum: 1 },
            evaluaciones_aprobadas: {
              $sum: { $cond: ["$aprobado", 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            tipo_institucion: "$_id",
            total_evaluaciones: 1,
            evaluaciones_aprobadas: 1,
            porcentaje_aprobacion: {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        "$evaluaciones_aprobadas",
                        "$total_evaluaciones",
                      ],
                    },
                    100,
                  ],
                },
                2,
              ],
            },
          },
        },
        { $sort: { porcentaje_aprobacion: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 19,
    nombre: "Carreras demandadas por departamento",
    descripcion:
      "Determina la carrera objetivo con mayor demanda dentro de cada departamento.",
    endpoint: "/carreras-demandadas-departamento",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $match: {
            departamento_institucion_educativa: {
              $nin: ["SIN DATOS", ""],
            },
            carrera_objetivo: {
              $nin: ["NINGUNO", "SIN DATOS", ""],
            },
          },
        },
        {
          $group: {
            _id: {
              departamento:
                "$departamento_institucion_educativa",
              carrera: "$carrera_objetivo",
              aspirante: "$correlativo_aspirante",
            },
          },
        },
        {
          $group: {
            _id: {
              departamento: "$_id.departamento",
              carrera: "$_id.carrera",
            },
            total_aspirantes: { $sum: 1 },
          },
        },
        { $sort: { total_aspirantes: -1 } },
      ],
      null,
      2
    ),
  },
  {
    id: 20,
    nombre: "Evolución anual de aprobación",
    descripcion:
      "Cantidad y porcentaje de evaluaciones aprobadas y no aprobadas agrupadas por año de ingreso.",
    endpoint: "/evolucion-aprobacion-anual",
    pipelineEjemplo: JSON.stringify(
      [
        {
          $group: {
            _id: "$anio_de_ingreso",
            total_evaluaciones: { $sum: 1 },
            aprobadas: { $sum: { $cond: ["$aprobado", 1, 0] } },
            no_aprobadas: {
              $sum: { $cond: ["$aprobado", 0, 1] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            anio_ingreso: "$_id",
            total_evaluaciones: 1,
            aprobadas: 1,
            no_aprobadas: 1,
          },
        },
        { $sort: { anio_ingreso: 1 } },
      ],
      null,
      2
    ),
  },
];
