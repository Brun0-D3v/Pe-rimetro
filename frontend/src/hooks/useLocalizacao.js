import { useCallback, useEffect, useRef, useState } from "react";

const OPCOES_WATCH = { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 };
const LIMIAR_MOVIMENTO_METROS = 5;
const RAIO_TERRA_METROS = 6371000;

const MENSAGENS = {
  negado:
    "Permissão de localização negada. Para usar este recurso, libere o acesso à localização nas configurações do navegador e tente de novo.",
  indisponivel: "Não foi possível obter sua posição agora. Verifique o sinal de GPS ou da rede.",
  sem_suporte: "Este navegador não oferece localização.",
};

function geolocalizacaoSuportada() {
  return typeof navigator !== "undefined" && Boolean(navigator.geolocation);
}

// Distância aproximada (haversine) entre dois pontos { lat, lng }, em metros.
function distanciaMetros(a, b) {
  const paraRadianos = (graus) => (graus * Math.PI) / 180;
  const dLat = paraRadianos(b.lat - a.lat);
  const dLng = paraRadianos(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(a.lat)) * Math.cos(paraRadianos(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
}

export function useLocalizacao() {
  const [posicao, setPosicao] = useState(null);
  const [precisao, setPrecisao] = useState(null);
  const [estado, setEstado] = useState(() => (geolocalizacaoSuportada() ? "inativo" : "sem_suporte"));
  const idWatchRef = useRef(null);
  const ultimaPosicaoRef = useRef(null);

  const encerrarWatch = useCallback(() => {
    if (idWatchRef.current !== null) {
      navigator.geolocation.clearWatch(idWatchRef.current);
      idWatchRef.current = null;
    }
  }, []);

  const aoPosicionar = useCallback((leitura) => {
    const nova = { lat: leitura.coords.latitude, lng: leitura.coords.longitude };
    const anterior = ultimaPosicaoRef.current;
    if (!anterior || distanciaMetros(anterior, nova) >= LIMIAR_MOVIMENTO_METROS) {
      ultimaPosicaoRef.current = nova;
      setPosicao(nova);
    }
    setPrecisao(leitura.coords.accuracy);
    setEstado("ativo");
  }, []);

  const aoFalhar = useCallback(
    (falha) => {
      if (falha.code === 1) {
        encerrarWatch();
        setEstado("negado");
        return;
      }
      setEstado("indisponivel");
    },
    [encerrarWatch]
  );

  const ativar = useCallback(() => {
    if (!geolocalizacaoSuportada()) {
      setEstado("sem_suporte");
      return;
    }
    if (idWatchRef.current !== null) return;
    setEstado("buscando");
    idWatchRef.current = navigator.geolocation.watchPosition(aoPosicionar, aoFalhar, OPCOES_WATCH);
  }, [aoPosicionar, aoFalhar]);

  const desativar = useCallback(() => {
    encerrarWatch();
    ultimaPosicaoRef.current = null;
    setPosicao(null);
    setPrecisao(null);
    setEstado(geolocalizacaoSuportada() ? "inativo" : "sem_suporte");
  }, [encerrarWatch]);

  // Ao desmontar, só encerra o watch (sem setState em componente desmontado).
  useEffect(() => encerrarWatch, [encerrarWatch]);

  return { posicao, precisao, estado, erro: MENSAGENS[estado] ?? null, ativar, desativar };
}
