
import os
from pathlib import Path

from dotenv import load_dotenv
from neo4j import GraphDatabase

BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / ".env")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USER = os.getenv("NEO4J_USER")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USER, NEO4J_PASSWORD)
)


def verificar_neo4j():
    driver.verify_connectivity()

    with driver.session(database=NEO4J_DATABASE) as session:
        resultado = session.run(
            "RETURN 1 AS conectado"
        )
        return resultado.single()["conectado"] == 1
