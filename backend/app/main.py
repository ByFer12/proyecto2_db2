
from fastapi import FastAPI

app = FastAPI(
    title="API - Proyecto 2 Bases de Datos",
    description="Sistema de análisis de pruebas específicas USAC",
    version="1.0.0"
)


@app.get("/")
def inicio():
    return {
        "mensaje": "API del Proyecto 2 funcionando",
        "estado": "activo"
    }


@app.get("/api/health")
def verificar_estado():
    return {
        "status": "ok",
        "servicio": "backend"
    }
