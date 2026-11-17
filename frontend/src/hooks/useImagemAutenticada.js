import { useEffect, useState } from "react";
import api from "../services/api";

// A <img> não envia o cabeçalho Authorization, e a foto de uma ocorrência oculta exige o token do dono.
// Por isso a imagem é baixada via axios como blob e exposta por uma URL de objeto, revogada ao sair.
export function useImagemAutenticada(fotoId) {
  const [estado, setEstado] = useState({ fotoId: null, url: null, erro: null });

  useEffect(() => {
    let cancelado = false;
    let urlCriada = null;
    api
      .get(`/fotos/${fotoId}`, { responseType: "blob" })
      .then((resposta) => {
        if (cancelado) return;
        urlCriada = URL.createObjectURL(resposta.data);
        setEstado({ fotoId, url: urlCriada, erro: null });
      })
      .catch((erro) => {
        if (!cancelado) setEstado({ fotoId, url: null, erro });
      });
    return () => {
      cancelado = true;
      if (urlCriada) URL.revokeObjectURL(urlCriada);
    };
  }, [fotoId]);

  // Enquanto a foto nova não chega, não devolve a URL da anterior.
  if (estado.fotoId !== fotoId) return { url: null, erro: null };
  return { url: estado.url, erro: estado.erro };
}
