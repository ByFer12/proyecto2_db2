
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

BASE_DIR = Path(__file__).resolve().parents[3]

load_dotenv(BASE_DIR / ".env")

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017"
)

MONGO_DB = os.getenv(
    "MONGO_DB",
    "usac_pruebas_especificas"
)

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=3000
)

db = client[MONGO_DB]


def verificar_mongodb():
    client.admin.command("ping")
    return True
