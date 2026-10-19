
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