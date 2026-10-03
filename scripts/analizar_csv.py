import csv
from pathlib import Path
from collections import Counter
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"

archivos = sorted(DATA_DIR.glob("*.csv"))

print(f"Archivos encontrados: {len(archivos)}\n")

for archivo in archivos:
    print(f"Archivo: {archivo.name}")

    for encoding in ("utf-8-sig", "cp1252"):
        try:
            with archivo.open(
                "r",
                encoding=encoding,
                newline=""
            ) as f:
                muestra = f.read(8192)
                f.seek(0)

                dialecto = csv.Sniffer().sniff(
                    muestra,
                    delimiters=",;\t|"
                )

                lector = csv.DictReader(
                    f,
                    dialect=dialecto
                )

                columnas = lector.fieldnames
                total = sum(1 for _ in lector)

            print(f"Codificación: {encoding}")
            print(f"Delimitador: {repr(dialecto.delimiter)}")
            print(f"Columnas: {len(columnas or [])}")
            print(f"Registros: {total}")
            print(f"Encabezados: {columnas}")
            break

        except (UnicodeError, csv.Error) as error:
            print(f"Intento con {encoding}: {error}")

    else:
        print("ERROR: No se pudo interpretar el CSV")

    print("-" * 60)

equivalencias = {
    "numero_de_fecha_de_evaluaci":"numero_de_fecha_de_evaluacion",
    "departamento_institucion_ed":"departamento_institucion_educativa",
    "municipio_institucion_":"municipio_institucion_educativa",
}

campos_analizar = [
    "sexo",
    "anio_nacimiento",
    "materia",
    "aprobacion",
    "tipo_institucion_educativa",
    "numero_de_fecha_de_evaluacion",
]

print("\nAnaliis de calidad de datos:\n")

for archivo in archivos:
    conteos = {
        campo: Counter()
        for campo in campos_analizar
    }

    sin_correlativo = 0

    with archivo.open(
        "r",
        encoding="utf-8-sig",
        newline=""
    ) as f:
        lector = csv.DictReader(f)

        for fila in lector:
            fila = {
                equivalencias.get(k, k): v.strip()
                for k, v in fila.items()
                if k is not None
            }

            for campo in campos_analizar:
                conteos[campo][fila.get(campo, "")] += 1

            if not fila.get("correlativo_aspirante"):
                sin_correlativo += 1

    print(f"\nArchivo: {archivo.name}")
    print(f"Sin correlativo: {sin_correlativo}")

    for campo, valores in conteos.items():
        print(f"{campo}: {valores.most_common(10)}")