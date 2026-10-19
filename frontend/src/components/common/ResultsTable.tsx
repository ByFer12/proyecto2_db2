
type Resultado = Record<string, unknown>;

interface Props {
  datos: Resultado[];
}

function mostrarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export default function ResultsTable({ datos }: Props) {
  if (datos.length === 0) {
    return <p className="text-slate-400">No se encontraron resultados.</p>;
  }

  const columnas = Array.from(
    new Set(datos.flatMap((fila) => Object.keys(fila)))
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-800 text-slate-200">
          <tr>
            {columnas.map((columna) => (
              <th key={columna} className="px-4 py-3 whitespace-nowrap">
                {columna.replaceAll("_", " ")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {datos.map((fila, indice) => (
            <tr
              key={indice}
              className="border-t border-slate-800 hover:bg-slate-800/50"
            >
              {columnas.map((columna) => (
                <td key={columna} className="px-4 py-3">
                  {mostrarValor(fila[columna])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
