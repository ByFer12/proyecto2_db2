# Documentación de las 20 consultas MongoDB

## Implementación

Las consultas analíticas se implementan en `backend/app/services/estadisticas.py` y se exponen mediante rutas de `backend/app/api/estadisticas.py`. El frontend permite ejecutarlas desde `/mongodb`. **Para ver los pipelines completos se debe consultar el código fuente de esas funciones**; esta tabla documenta el objetivo de cada consulta y su ruta HTTP.

| N.º | Consulta | Ruta bajo `/api/estadisticas` | Interpretación |
| ---: | --- | --- | --- |
| 1 | Aspirantes por tipo de institución | `/aspirantes-institucion` | Distribución de aspirantes por procedencia educativa. |
| 2 | Aprobados por materia | `/aprobados-materia` | Conteo de evaluaciones aprobadas por materia. |
| 3 | Aprobados por carrera y año | `/aprobados-carrera-anio` | Comparación por carrera objetivo y cohorte. |
| 4 | Porcentaje de aprobación por materia | `/porcentaje-aprobacion-materia` | Proporción de resultados aprobados por materia. |
| 5 | Promedio de edad por carrera | `/promedio-edad-carrera` | Edad aproximada media de aspirantes por carrera. |
| 6 | Generar colección `resumen_carrera` | `POST /generar-resumen-carrera` | Materializar una colección auxiliar de agregados. |
| 7 | Edad de aprobados por carrera e institución | `/promedio-edad-aprobados-carrera-institucion` | Edad promedio de aprobados segmentada. |
| 8 | Aprobados por municipio y carrera | `/aprobados-municipio-carrera` | Distribución geográfica y académica. |
| 9 | Evaluaciones mensuales de instituciones públicas | `/evaluaciones-mensuales-publicas` | Tendencia por mes y materia en centros públicos. |
| 10 | Top de carreras entre 16 y 18 años | `/top-carreras-jovenes` | Preferencias de aspirantes jóvenes. |
| 11 | Historial de desempeño del aspirante | `/historial-desempeno/{correlativo}` | Oportunidades y resultados de una persona anónima. |
| 12 | Distribución por sexo e institución | `/distribucion-sexo-institucion` | Distribución cruzada de variables. |
| 13 | Tasa de aprobación por edad | `/tasa-aprobacion-edad` | Variación de aprobaciones con edad aproximada. |
| 14 | Promedio de intentos por materia | `/promedio-intentos-materia` | Esfuerzo expresado en oportunidades de evaluación. |
| 15 | Historial completo | `/historial-completo/{correlativo}` | Información disponible del aspirante. |
| 16 | Carreras con más reprobados al primer intento | `/carreras-reprobados-primer-intento` | Dificultad inicial por carrera. |
| 17 | Top cinco municipios con más aspirantes | `/top-municipios-aspirantes` | Concentración territorial. |
| 18 | Tasa de aprobación por institución | `/tasa-aprobacion-institucion` | Comparación entre modalidades educativas. |
| 19 | Carrera más demandada por departamento | `/carreras-demandadas-departamento` | Preferencia principal por departamento. |
| 20 | Evolución anual de aprobación | `/evolucion-aprobacion-anual` | Evaluaciones aprobadas y no aprobadas por año. |

## Técnicas documentales

Se aplican los operadores de agregación según el caso: `$match` para filtros, `$group` para agrupar, `$sum` y `$avg` para indicadores, `$project` para campos calculados, `$sort` y `$limit` para rankings. Para conteos de aspirantes, considerar el correlativo anónimo como entidad única y no confundir cantidad de evaluaciones con cantidad de aspirantes.

Ejemplo conceptual (no sustituye las consultas concretas guardadas en el backend):

```javascript
db.evaluaciones.aggregate([
  { $match: { aprobado: true } },
  { $group: { _id: "$materia", evaluaciones_aprobadas: { $sum: 1 } } },
  { $sort: { evaluaciones_aprobadas: -1 } }
]);
```

## Revisión antes de entregar

Comprobar que los veinte endpoints funcionan desde `/mongodb` y que cada función real de `estadisticas.py` corresponde a la definición del enunciado. Si el docente requiere scripts MongoShell independientes, exportar o adaptar cada pipeline de las funciones del backend: **esta documentación no pretende afirmar que se hayan generado veinte archivos `.js` completos**.
