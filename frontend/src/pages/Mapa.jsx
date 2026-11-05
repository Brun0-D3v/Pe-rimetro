import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/ui/Card";
import MapaLeaflet from "../components/mapa/MapaLeaflet";
import PainelDetalheTrecho from "../components/mapa/PainelDetalheTrecho";
import CabecalhoMapa from "../components/mapa/CabecalhoMapa";
import PainelFiltros from "../components/mapa/PainelFiltros";
import LegendaMapa from "../components/mapa/LegendaMapa";
import AvisoLocalizacao from "../components/mapa/AvisoLocalizacao";
import CamadaDesenhoTrecho from "../components/mapa/CamadaDesenhoTrecho";
import PainelNovoTrecho from "../components/mapa/PainelNovoTrecho";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import ConviteLogin from "../components/mapa/ConviteLogin";
import { useAuth } from "../hooks/useAuth";
import { useDesenhoTrecho } from "../hooks/useDesenhoTrecho";
import { useLocalizacao } from "../hooks/useLocalizacao";
import { useTrechos } from "../hooks/useTrechos";
import { useRegioes } from "../hooks/useRegioes";
import { criarTrecho } from "../services/trechoService";
import { pontoMedio, regiaoMaisProxima } from "../utils/geometria";

function MapaConteudo() {
  const { tema } = useTheme();
  const [regiaoSelecionadaId, setRegiaoSelecionadaId] = useState(null);
  const [trechoSelecionado, setTrechoSelecionado] = useState(null);
  const [recolhido, setRecolhido] = useState(false);
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [busca, setBusca] = useState("");
  const [focoBusca, setFocoBusca] = useState(null);

  const { trechos, carregando, erro, atualizarTrecho, adicionarTrecho } = useTrechos(regiaoSelecionadaId || undefined);
  const { regioes } = useRegioes();

  const { autenticado } = useAuth();
  const [conviteLogin, setConviteLogin] = useState(false);
  const [desenhando, setDesenhando] = useState(false);
  const [salvandoTrecho, setSalvandoTrecho] = useState(false);
  const [erroTrecho, setErroTrecho] = useState(null);
  const desenho = useDesenhoTrecho();

  const { posicao: posicaoUsuario, precisao, estado: estadoLocalizacao, erro: erroLocalizacao, ativar } =
    useLocalizacao();
  const [pedidoCentralizar, setPedidoCentralizar] = useState(0);
  const aguardandoPrimeiroFix = useRef(false);

  function aoLocalizar() {
    if (estadoLocalizacao === "ativo" && posicaoUsuario) {
      setPedidoCentralizar((atual) => atual + 1);
      return;
    }
    aguardandoPrimeiroFix.current = true;
    ativar();
  }

  useEffect(() => {
    if (estadoLocalizacao === "ativo" && posicaoUsuario && aguardandoPrimeiroFix.current) {
      aguardandoPrimeiroFix.current = false;
      setPedidoCentralizar((atual) => atual + 1);
    }
  }, [estadoLocalizacao, posicaoUsuario]);

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

  function aoAvaliarTrecho(trechoAtualizado) {
    atualizarTrecho(trechoAtualizado);
    setTrechoSelecionado(trechoAtualizado);
  }

  function encerrarDesenho() {
    setDesenhando(false);
    setErroTrecho(null);
    desenho.limpar();
  }

  function alternarDesenho() {
    if (desenhando) {
      encerrarDesenho();
      return;
    }
    if (!autenticado) {
      setTrechoSelecionado(null);
      setConviteLogin((aberto) => !aberto);
      return;
    }
    setTrechoSelecionado(null);
    setDesenhando(true);
  }

  async function salvarTrecho({ nome, regiaoId }) {
    setSalvandoTrecho(true);
    setErroTrecho(null);
    try {
      const centro = pontoMedio(desenho.pontos);
      const novoTrecho = await criarTrecho({
        nome,
        geometria: desenho.pontos,
        latitude: centro.lat,
        longitude: centro.lng,
        regiaoId,
      });
      adicionarTrecho(novoTrecho);
      setTrechoSelecionado(novoTrecho);
      encerrarDesenho();
    } catch (falha) {
      setErroTrecho(
        falha.response?.data?.mensagem ?? "Não foi possível salvar o trecho. Verifique a conexão e tente novamente."
      );
    } finally {
      setSalvandoTrecho(false);
    }
  }

  useEffect(() => {
    setFocoBusca(null);
    setTrechoSelecionado(null);
  }, [regiaoSelecionadaId, mostrarInativos]);

  if (carregando && trechos.length === 0) {
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
        onSelecionarTrecho={desenhando ? () => {} : setTrechoSelecionado}
        tema={tema}
        focoBusca={focoBusca}
        posicaoUsuario={posicaoUsuario}
        precisaoUsuario={precisao}
        pedidoCentralizar={pedidoCentralizar}
        estadoLocalizacao={estadoLocalizacao}
        aoLocalizar={aoLocalizar}
      >
        {desenhando && <CamadaDesenhoTrecho pontos={desenho.pontos} aoAdicionarPonto={desenho.adicionarPonto} />}
      </MapaLeaflet>

      {trechosVisiveis.length === 0 && (
        <p className="absolute left-1/2 top-20 z-[1000] -translate-x-1/2 rounded-full bg-base-3 px-4 py-2 text-sm text-texto-mute shadow-sm">
          Nenhum trecho cadastrado ainda.
        </p>
      )}

      <CabecalhoMapa
        busca={busca}
        aoMudarBusca={setBusca}
        sugestoes={sugestoes}
        aoSelecionarSugestao={selecionarViaBusca}
        desenhando={desenhando}
        aoAlternarDesenho={alternarDesenho}
      />

      <PainelFiltros
        recolhido={recolhido}
        aoAlternarRecolhido={() => setRecolhido((atual) => !atual)}
        regioes={regioes}
        regiaoSelecionadaId={regiaoSelecionadaId}
        aoSelecionarRegiao={setRegiaoSelecionadaId}
        mostrarInativos={mostrarInativos}
        aoAlternarMostrarInativos={() => setMostrarInativos((atual) => !atual)}
      />

      <LegendaMapa className="absolute bottom-6 left-4 z-[1000]" />

      <AvisoLocalizacao
        estado={estadoLocalizacao}
        erro={erroLocalizacao}
        className="absolute bottom-24 left-1/2 z-[1000] -translate-x-1/2"
      />

      {conviteLogin && !autenticado && !desenhando && !trechoSelecionado && (
        <Card className="absolute right-4 top-20 z-[1000] w-[calc(100%-2rem)] max-w-sm">
          <ConviteLogin mensagem="Entre para adicionar um trecho ao mapa." aoDispensar={() => setConviteLogin(false)} />
        </Card>
      )}

      {desenhando && (
        <PainelNovoTrecho
          pontos={desenho.pontos}
          comprimento={desenho.comprimento}
          motivoInvalido={desenho.motivoInvalido}
          regioes={regioes}
          regiaoSugeridaId={regiaoMaisProxima(desenho.pontos, trechos)}
          regiaoTravadaId={regiaoSelecionadaId}
          salvando={salvandoTrecho}
          erro={erroTrecho}
          aoDesfazer={desenho.desfazerPonto}
          aoLimpar={desenho.limpar}
          aoCancelar={encerrarDesenho}
          aoSalvar={salvarTrecho}
        />
      )}

      <PainelDetalheTrecho
        key={trechoSelecionado?.id}
        trecho={desenhando ? null : trechoSelecionado}
        aoFechar={() => setTrechoSelecionado(null)}
        aoAvaliado={aoAvaliarTrecho}
      />
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
