# Manual de usuario — USAC Analytics

## 1. Inicio

Requisitos: MongoDB, Neo4j y backend FastAPI activos; abrir `http://localhost:5173/`. El menú lateral permite acceder a seis secciones. Si aparece un error de conexión, consultar al responsable de ejecutar el backend y los motores NoSQL.

## 2. Dashboard

Abrir **Dashboard**. Observar los indicadores de evaluaciones, aprobaciones y tasa de aprobación, junto con las gráficas de materias y evolución por año. Las estadísticas provienen de MongoDB a través de FastAPI.

## 3. Consultas MongoDB

Abrir **MongoDB**. Seleccionar una de las 20 consultas predefinidas y pulsar **Ejecutar consulta**. Las consultas de historial requieren el correlativo anónimo de un aspirante. Los resultados aparecen en una tabla; el botón de generación del resumen por carrera ejecuta la operación específica de resumen.

## 4. Consultas Neo4j

Abrir **Neo4j**. Seleccionar una de las cinco consultas y pulsar **Ejecutar consulta**. Para historial del aspirante, ingresar un correlativo existente. Los resultados se muestran en una tabla.

## 5. Explorador visual

Abrir **Explorador de grafos**. Introducir el correlativo de un aspirante y seleccionar **Visualizar grafo**. Colores de nodos: aspirante (azul), evaluación (violeta), materia (verde) y carrera (naranja). Hacer clic en un nodo o relación para ver sus atributos. Arrastrar nodos y utilizar controles de zoom y centrar.

Para encontrar correlativos de prueba, en Neo4j se puede ejecutar `MATCH (a:Aspirante)-[:REALIZO]->(e:Evaluacion) RETURN a.correlativo AS correlativo, count(e) AS total ORDER BY total DESC LIMIT 5;`.

## 6. Buscador

Abrir **Buscador** y combinar uno o varios filtros: correlativo, materia, carrera, tipo de institución, departamento, municipio, sexo, año o aprobación. Pulsar **Buscar evaluaciones**; se presenta el total y una tabla paginada. Usar **Anterior** y **Siguiente** para navegar; **Limpiar** restablece los filtros.

Algunos filtros son de coincidencia exacta: copiar el valor completo utilizado en los datos originales.

## 7. Importar CSV

Abrir **Importar CSV**. Seleccionar uno o varios archivos `.csv` desde el equipo; si la opción de arrastrar y soltar está habilitada en la versión actual, también se pueden depositar en el área de carga. Revisar la lista y pulsar **Iniciar importación**.

Se aceptan hasta **5 archivos**, cada uno de máximo **20 MB**. El sistema muestra por archivo el total leído, válidos, rechazados, duración, estado, número sincronizado con Neo4j y motivos de los primeros errores de fila. **Válidos** significa registros procesados correctamente, no necesariamente registros nuevos; un archivo previamente importado puede actualizar los mismos registros.

## 8. Errores frecuentes

| Mensaje | Acción |
| --- | --- |
| `Failed to fetch` | Comprobar que FastAPI esté activo en el puerto 8000 y que CORS permita el frontend. |
| HTTP 503 de MongoDB o Neo4j | Verificar que el motor correspondiente está activo y que `.env` tiene credenciales correctas. |
| Aspirante no encontrado | Copiar un correlativo existente y completo. |
| Registros rechazados | Revisar fila y motivo; corregir el CSV y reimportar. |
| El archivo supera el límite | Dividir el archivo o usar la carga CLI, según autorización del proyecto. |

## 9. Observaciones

No introducir contraseñas en campos de la interfaz ni publicar los CSV con información sensible fuera del alcance autorizado del proyecto. El correlativo es un identificador anónimo y un aspirante puede tener múltiples evaluaciones.
