# Conclusiones y recomendaciones

## Conclusiones

1. **MongoDB y Neo4j cumplen funciones complementarias.** MongoDB conserva las evaluaciones como documentos y facilita agregaciones y filtros. Neo4j conecta aspirantes con evaluaciones, carreras, materias y ubicaciones para consultas mediante recorridos de relaciones.
2. **El identificador anónimo del aspirante no equivale al identificador de cada evaluación.** En el conjunto inicial se contabilizaron 208,453 evaluaciones y 42,371 aspirantes en el modelo de grafos; tratar cada fila como un aspirante distinto habría distorsionado las métricas.
3. **La calidad de los datos debe tratarse antes de analizarlos.** La transformación de fechas, años, aprobación y valores especiales permite filtrar y agrupar. La prueba controlada con datos inválidos verificó que el sistema registra causas específicas de rechazo sin descartar todas las filas.
4. **La visualización facilita la interpretación.** El dashboard y las tablas responden preguntas agregadas; Cytoscape representa conexiones concretas de un aspirante con sus evaluaciones, materias y carreras.
5. **La reimportación requiere una política de identidad clara.** El uso de `upsert` y `MERGE` permitió repetir la carga de un CSV ya conocido sin aumentar las evaluaciones originales. Para nuevos escenarios se recomienda fortalecer la detección de duplicados lógicos entre archivos distintos.

## Recomendaciones técnicas

- Incorporar pruebas automatizadas de validación, integridad y disponibilidad de ambas bases.
- Registrar estado de sincronización por archivo para reanudar cargas parciales en caso de falla de Neo4j.
- Añadir índices MongoDB a los filtros frecuentes tras medir consultas reales.
- Añadir mecanismos de autenticación, cuotas y control de acceso antes de exponer la API fuera de desarrollo local.
- Mejorar usabilidad con opciones de exportación y búsqueda asistida; no son requisitos mínimos del enunciado.

## Balance de la solución

El sistema permite demostrar la utilidad conjunta de una base documental para consulta analítica y una base de grafos para relaciones. La solución corresponde a un prototipo académico funcional, **no a un servicio listo para producción**.
