import { useStatusSaude } from "../hooks/useStatusSaude";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";

function tomDoStatus(valor) {
  return valor === "UP" ? "bom" : "ruim";
}

export default function Dashboard() {
  const { status, carregando, erro } = useStatusSaude();

  return (
    <Card>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-texto-mute">
        Os indicadores do índice de caminhabilidade serão implementados na Sprint 05.
      </p>

      <div className="mt-6 rounded-xl border border-base-4 bg-base-1 p-4">
        <h2 className="font-medium">Status da integração com o backend</h2>
        {carregando && <p className="mt-1 text-texto-mute">Verificando...</p>}
        {erro && (
          <p className="mt-1 text-indice-ruim">
            Não foi possível conectar ao backend em {import.meta.env.VITE_API_URL}.
          </p>
        )}
        {status && (
          <ul className="mt-2 flex flex-wrap gap-2">
            <li>
              <Badge tom={tomDoStatus(status.status)}>API: {status.status}</Badge>
            </li>
            <li>
              <Badge tom={tomDoStatus(status.banco)}>Banco de dados: {status.banco}</Badge>
            </li>
          </ul>
        )}
      </div>
    </Card>
  );
}
