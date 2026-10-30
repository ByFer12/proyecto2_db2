# Análisis de resultados — Pruebas específicas USAC 2015–2024

## 1. Alcance de los datos

El sistema integró **208,453 registros de evaluaciones** provenientes de archivos CSV de 2015 a 2024. Esta cifra es de **evaluaciones**, no de estudiantes únicos. En el grafo se contabilizaron **42,371 nodos `Aspirante`** distintos por su correlativo anónimo.

| Año | Evaluaciones |
| ---: | ---: |
| 2015 | 20,277 |
| 2016 | 22,137 |
| 2017 | 21,581 |
| 2018 | 20,871 |
| 2019 | 17,865 |
| 2020 | 17,931 |
| 2021 | 30,644 |
| 2022 | 24,237 |
| 2023 | 19,047 |
| 2024 | 13,863 |
| **Total** | **208,453** |

El mayor volumen anual del período corresponde a **2021, con 30,644 evaluaciones**, y el menor a **2024, con 13,863**, según los archivos cargados. Esta comparación describe volúmenes de registros y no demuestra por sí sola cambios en admisión ni desempeño académico.

## 2. Aprobación por materia

Resultados comprobados en consultas del sistema:

| Materia | Evaluaciones | Aprobadas | Tasa de aprobación |
| --- | ---: | ---: | ---: |
| MATEMATICA | 124,427 | 11,008 | 8.85 % |
| COMPUTACION | 84,004 | 18,869 | 22.46 % |
| MATEMATICA ITUGS | 22 | 0 | 0.00 % |
| **Total** | **208,453** | **29,877** | **14.33 %** |

La tasa observada de aprobación de **Computación** es superior a la de **Matemática** en el conjunto analizado. No debe interpretarse automáticamente como que una materia es intrínsecamente más fácil: las poblaciones, condiciones y oportunidades pueden ser distintas. **MATEMATICA ITUGS** tiene solo 22 evaluaciones; su 0 % no permite conclusiones robustas sobre un grupo grande.

## 3. Patrones que facilita cada base de datos

**MongoDB:** permite analizar tendencias temporales por año y mes, desagregar resultados por materia, carrera, institución educativa y procedencia geográfica, y calcular tasas sobre documentos de evaluación. Una agregación puede comparar aprobados y reprobados por año o institución.

**Neo4j:** permite partir de un aspirante y recorrer sus evaluaciones, materias y carreras, o descubrir conexiones territoriales a través de municipios y departamentos. La estructura evita tratar cada fila como si representara un aspirante diferente.

## 4. Verificación del proceso de importación

Se probó un CSV de cuatro filas con una evaluación válida y tres registros incorrectos. Resultado: **4 procesados, 1 válido, 3 rechazados y 1 sincronizado con Neo4j**. Los motivos detectados fueron aprobación desconocida, oportunidad no positiva y materia vacía. La API respondió 200 después de corregir la serialización de errores BSON. Posteriormente se retiró la evaluación de prueba de ambas bases, recuperando el total original de 208,453.

También se importó de nuevo el CSV 2015: **20,277 filas válidas y 20,277 sincronizadas con Neo4j**, sin aumentar el total original de evaluaciones.

## 5. Integridad de relaciones

Se comprobó que los **208,453 nodos `Evaluacion`** existentes tienen al menos una relación con `Materia`, con `Carrera` y con `Aspirante`. Este resultado indica integridad de esas conexiones fundamentales; no verifica automáticamente todas las reglas de negocio ni todos los enlaces auxiliares.

## 6. Límites de interpretación

- `anio_nacimiento = SIN REGISTRO` se transforma en nulo; la edad se calcula de forma aproximada con año de ingreso menos nacimiento y excluye casos sin nacimiento conocido.
- El correlativo es anónimo; deben contarse aspirantes únicos y evaluaciones por separado.
- Algunas categorías como `NINGUNO` o `SIN DATOS` requieren tratamiento explícito según la consulta.
- La información de 2015–2024 describe los CSV utilizados, no todas las cohortes o todos los aspirantes de la universidad.
- La validación manual documentada no sustituye pruebas automatizadas de extremo a extremo.

## 7. Uso de resultados

El dashboard presenta indicadores generales, las consultas permiten segmentar por variables académicas y territoriales y el explorador ofrece una vista relacional por aspirante. La combinación facilita investigar resultados descriptivos e identificar casos para análisis posterior, sin atribuir causalidad a estas estadísticas.
