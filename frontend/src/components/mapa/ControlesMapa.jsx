import { LocateFixed, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";

export default function ControlesMapa({ centroPadrao, zoomPadrao }) {
  const mapa = useMap();

  const classeBotao =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-base-4 bg-base-3 text-texto shadow-sm transition-colors duration-fast ease-reveal hover:bg-white/5";

  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
      <button type="button" onClick={() => mapa.zoomIn()} aria-label="Aumentar zoom" title="Aumentar zoom" className={classeBotao}>
        <Plus size={16} />
      </button>
      <button type="button" onClick={() => mapa.zoomOut()} aria-label="Diminuir zoom" title="Diminuir zoom" className={classeBotao}>
        <Minus size={16} />
      </button>
      <button
        type="button"
        onClick={() => mapa.setView(centroPadrao, zoomPadrao)}
        aria-label="Voltar à visualização inicial"
        title="Voltar à visualização inicial"
        className={classeBotao}
      >
        <LocateFixed size={16} />
      </button>
    </div>
  );
}
