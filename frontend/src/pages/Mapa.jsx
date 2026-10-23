import { useMemo, useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import CabecalhoMapa from "../components/mapa/CabecalhoMapa";
import PainelFiltros from "../components/mapa/PainelFiltros";
import LegendaMapa from "../components/mapa/LegendaMapa";
import CamadaCaminhabilidadeDemo from "../components/mapa/CamadaCaminhabilidadeDemo";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useTrechos } from "../hooks/useTrechos";
import { useRegioes } from "../hooks/useRegioes";

function MapaConteudo() {
  const { tema } = useTheme();
  const [regiaoSelecionadaId, setRegiaoSelecionadaId] = useState(null);
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);
  const [recolhido, setRecolhido] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [camadaDemoVisivel, setCamadaDemoVisivel] = useState(false);
  const [busca, setBusca] = useState("");
  const [focoBusca, setFocoBusca] = useState(null);

  const { trechos, carregando, erro } = useTrechos(regiaoSelecionadaId || undefined);
  const { regioes } = useRegioes();

  const trechosVisiveis = useMemo(
    () => (mostrarInativos ? trechos : trechos.filter((trecho) => trecho.status === "ATIVO")),
    [trechos, mostrarInativos]
  );

  const sugestoes = useMemo(() => {
    if (!busca) return [];
    const termo = busca.toLowerCase();
    return trechosVisiveis.filter((trecho) => trecho.nome.toLowerCase().includes(termo)).slice(0, 6);
  }, [busca, trechosVisiveis]);

  function selecionarViaBusca(trecho) {
    setTrechoSelecionado(trecho);
    setFocoBusca(trecho.geometria[0] ?? null);
    setBusca("");
  }

  if (carregando) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">Carregando trechos...</p>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <h1 className="text-xl font-semibold">Mapa</h1>
        <p className="mt-2 text-texto-mute">
          Não foi possível carregar os trechos. Tente novamente mais tarde.
        </p>
      </Card>
    );
  }

  return (
    <div data-theme={tema} className="relative isolate h-[calc(100dvh-8rem)] w-full">
      <MapaLeaflet
        trechos={trechosVisiveis}
        trechoSelecionadoId={trechoSelecionado?.id}
        onSelecionarTrecho={setTrechoSelecionado}
        tema={tema}
        focoBusca={focoBusca}
      >
        {camadaDemoVisivel && <CamadaCaminhabilidadeDemo />}
      </MapaLeaflet>

      {trechosVisiveis.length === 0 && (
        <p className="absolute left-1/2 top-20 z-[1000] -translate-x-1/2 rounded-full bg-base-3 px-4 py-2 text-sm text-texto-mute shadow-sm">
          Nenhum trecho cadastrado ainda.
        </p>
      )}

      <CabecalhoMapa busca={busca} aoMudarBusca={setBusca} sugestoes={sugestoes} aoSelecionarSugestao={selecionarViaBusca} />

      <PainelFiltros
        recolhido={recolhido}
        aoAlternarRecolhido={() => setRecolhido((atual) => !atual)}
        regioes={regioes}
        regiaoSelecionadaId={regiaoSelecionadaId}
        aoSelecionarRegiao={setRegiaoSelecionadaId}
        mostrarInativos={mostrarInativos}
        aoAlternarMostrarInativos={() => setMostrarInativos((atual) => !atual)}
        camadaDemoVisivel={camadaDemoVisivel}
        aoAlternarCamadaDemo={() => setCamadaDemoVisivel((atual) => !atual)}
      />

      <LegendaMapa className="absolute bottom-6 left-4 z-[1000]" />

      <PainelDetalheTrecho trecho={trechoSelecionado} aoFechar={() => setTrechoSelecionado(null)} />
    </div>
  );
}

export default function Mapa() {
  return (
    <ThemeProvider>
      <MapaConteudo />
    </ThemeProvider>
  );
}
