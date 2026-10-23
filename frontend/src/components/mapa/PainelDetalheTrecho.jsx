import { X } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function PainelDetalheTrecho({ trecho, aoFechar }) {
  if (!trecho) return null;

  return (
    <Card className="absolute top-20 right-4 z-[1000] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-texto">{trecho.nome}</h2>
          <Badge tom="neutro">{trecho.status}</Badge>
        </div>
        <Button variante="fantasma" onClick={aoFechar} aria-label="Fechar painel de detalhes do trecho">
          <X size={16} />
          Fechar
        </Button>
      </div>

      <p className="mt-4 text-sm text-texto-mute">Ainda sem avaliações</p>
    </Card>
  );
}
