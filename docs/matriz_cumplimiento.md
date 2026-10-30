# Matriz de cumplimiento del enunciado — revisión de cierre

> Estado fundamentado en el trabajo y resultados mostrados durante el desarrollo. El repositorio local debe verificarse antes de publicarlo. «Implementado» no equivale a una auditoría del código completo.

| Requisito del enunciado | Evidencia / ubicación esperada | Estado |
| --- | --- | --- |
| Frontend, backend y motores separados | `frontend/`, `backend/`, MongoDB y Neo4j | Implementado |
| ETL de CSV con transformación | `backend/app/etl/{transform,load_mongodb,load_neo4j}.py` | Implementado |
| Conteos, estado, duración y motivos de rechazo | API de importación, página `/importar` | Comprobado con archivos de prueba |
| 20 consultas MongoDB ejecutables en GUI | `services/estadisticas.py`, `/mongodb` | Implementado según pruebas reportadas; revisar todas individualmente |
| 5 consultas Neo4j y recorridos | `services/grafos.py`, `/neo4j` | Implementado |
| Dashboard de estadísticas | `/`, Recharts | Comprobado |
| Explorador con filtro | `/explorador`, correlativo, Cytoscape | Comprobado |
| Buscador con filtros | `/buscador` | Comprobado |
| Documentación de todas las consultas | `docs/consultas_mongodb.md`, `docs/consultas_neo4j.md` y código fuente | Documentación de propósito creada; revisar pipelines MongoDB |
| Análisis y conclusiones | `docs/analisis_resultados.md`, `docs/conclusiones.md` | Incluidos en este paquete |
| Manual técnico y de usuario | `docs/manual_tecnico.md`, `docs/manual_usuario.md` | Incluidos en este paquete |
| Archivos de configuración | `.env.example`, `frontend/package.json`, `backend/requirements.txt` | Incluir y comprobar |
| GitHub + ≥5 commits significativos | `git log --oneline`; URL repositorio | **No verificado** |
| Reproducción por otro usuario | README + importación CSV, conexión a motores | Requiere prueba fuera de la máquina original |

## Riesgos detectados

1. El repositorio GitHub y sus commits todavía requieren verificación real.
2. Los CSV originales no deben asumirse publicados con el repositorio; documentar la descarga y la carga.
3. Algunos archivos fuente no fueron inspeccionados directamente en esta auditoría; compilación, commits y funcionamiento completo deben corroborarse en la máquina local.
4. El soporte de arrastrar y soltar quedó sujeto a una revisión final del código tras una corrección de variables TypeScript sin utilizar; la selección mediante el explorador de archivos sí fue comprobada.
5. Los registros de prueba quedaron retirados de las colecciones principales, pero pueden permanecer registros en `historial_cargas`, `errores_carga` o nodos de catálogo no utilizados; esa información no invalida el recuento original, pero debería revisarse si se exige limpieza exhaustiva.
