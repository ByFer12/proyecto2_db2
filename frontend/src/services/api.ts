
const API_URL = "http://127.0.0.1:8000";

export interface AprobacionMateria {
  materia: string;
  total_evaluaciones: number;
  aprobadas: number;
  porcentaje_aprobacion: number;
}
export interface EvolucionAnual {
  anio_ingreso: number;
  total_evaluaciones: number;
  aprobadas: number;
  no_aprobadas: number;
  porcentaje_aprobacion: number;
  porcentaje_no_aprobacion: number;
}

export async function obtenerAprobacionesMateria():
  Promise<AprobacionMateria[]> {

  const respuesta = await fetch(
    `${API_URL}/api/estadisticas/porcentaje-aprobacion-materia`
  );

  if (!respuesta.ok) {
    throw new Error(
      `Error HTTP: ${respuesta.status}`
    );
  }

  return respuesta.json();
}

export async function obtenerEvolucionAnual(): Promise<EvolucionAnual[]> {
  const respuesta = await fetch(
    `${API_URL}/api/estadisticas/evolucion-aprobacion-anual`
  );

  if (!respuesta.ok) {
    throw new Error(`Error HTTP: ${respuesta.status}`);
  }

  return respuesta.json();
}

export type ResultadoGrafo = Record<string, unknown>;

export async function ejecutarConsultaNeo4j(
  endpoint: string,
  correlativo?: string
): Promise<ResultadoGrafo[]> {
  const ruta = correlativo
    ? `${endpoint}/${encodeURIComponent(correlativo)}`
    : endpoint;

  const respuesta = await fetch(
    `${API_URL}/api/grafos${ruta}`
  );

  if (!respuesta.ok) {
    if (respuesta.status === 404) {
      throw new Error("No se encontraron datos para esta consulta.");
    }

    throw new Error(
      `No se pudo ejecutar la consulta. HTTP ${respuesta.status}`
    );
  }

  return respuesta.json();
}


export interface FiltrosBusqueda {
  correlativo: string;
  materia: string;
  carrera: string;
  sexo: string;
  institucion: string;
  municipio: string;
  departamento: string;
  anio: string;
  aprobado: string;
}

export interface RespuestaBusqueda {
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  resultados: Record<string, unknown>[];
}

export async function buscarEvaluaciones(
  filtros: FiltrosBusqueda,
  pagina = 1,
  limite = 20
): Promise<RespuestaBusqueda> {
  const parametros = new URLSearchParams();

  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor.trim() !== "") {
      parametros.set(clave, valor.trim());
    }
  }

  parametros.set("pagina", String(pagina));
  parametros.set("limite", String(limite));

  const respuesta = await fetch(
    `${API_URL}/api/busqueda/evaluaciones?${parametros}`
  );

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }

  return respuesta.json();
}


export interface ErrorImportacion {
  archivo: string;
  fila: number;
  motivo: string;
}

export interface ResultadoMongoImportacion {
  archivo: string;
  total: number;
  validos: number;
  rechazados: number;
  duracion_segundos: number;
  estado: string;
  errores: ErrorImportacion[];
}

export interface ResultadoNeo4jImportacion {
  registros_sincronizados: number;
  duracion_segundos: number;
}

export interface ArchivoImportado {
  archivo_original: string;
  archivo_guardado?: string;
  estado: string;
  mensaje?: string;
  mongodb?: ResultadoMongoImportacion;
  neo4j?: ResultadoNeo4jImportacion;
  duracion_total_segundos: number;
}

export interface RespuestaImportacion {
  archivos_recibidos: number;
  archivos_completados: number;
  resultados: ArchivoImportado[];
}

export async function importarArchivosCSV(
  archivos: File[]
): Promise<RespuestaImportacion> {
  const formulario = new FormData();

  archivos.forEach((archivo) => {
    formulario.append("archivos", archivo);
  });

  const respuesta = await fetch(
    `${API_URL}/api/importacion/csv`,
    {
      method: "POST",
      body: formulario,
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

  return respuesta.json();
}

export async function obtenerHistorialCargas(): Promise<
  ResultadoMongoImportacion[]
> {
  const respuesta = await fetch(
    `${API_URL}/api/importacion/historial`
  );

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }

  return respuesta.json();
}

export interface AspiranteSugerido {
  correlativo: string;
  total_evaluaciones: number;
  aprobadas: number;
  carreras: string[];
  materias: string[];
  departamento: string;
}

export interface OpcionesFiltrosGrafo {
  materias: string[];
  carreras: string[];
  departamentos: string[];
  anios: number[];
}

export interface ResumenGrafo {
  correlativo?: string;
  total_evaluaciones: number;
  aprobadas: number;
  reprobadas: number;
  tasa_aprobacion: number;
  materias: string[];
  carreras: string[];
}

export async function obtenerAspirantesSugeridos(
  busqueda = "",
  limite = 12
): Promise<AspiranteSugerido[]> {
  const params = new URLSearchParams({
    limite: String(limite),
  });
  if (busqueda.trim()) {
    params.set("busqueda", busqueda.trim());
  }

  const respuesta = await fetch(
    `${API_URL}/api/grafos/aspirantes-sugeridos?${params}`
  );

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }

  return respuesta.json();
}

export async function obtenerOpcionesFiltrosGrafo(): Promise<OpcionesFiltrosGrafo> {
  const respuesta = await fetch(
    `${API_URL}/api/grafos/filtros-opciones`
  );

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }

  return respuesta.json();
}
