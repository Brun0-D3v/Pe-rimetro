import { useEffect, useRef, useState } from "react";
import { urlDaFoto } from "../../services/ocorrenciaService";

// Miniatura pública da foto; ao clicar abre a imagem maior num <dialog> nativo.
export default function FotoOcorrencia({ fotoId, categoria }) {
  const dialogo = useRef(null);
  const [aberta, setAberta] = useState(false);
  const alt = `Foto do problema reportado: ${categoria}`;

  useEffect(() => {
    if (aberta) dialogo.current?.showModal?.();
  }, [aberta]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-label={`Ampliar foto: ${categoria}`}
        className="overflow-hidden rounded-lg border border-base-4"
      >
        <img src={urlDaFoto(fotoId)} loading="lazy" alt={alt} className="h-16 w-16 object-cover" />
      </button>
      {aberta && (
        <dialog
          ref={dialogo}
          onClose={() => setAberta(false)}
          onClick={(evento) => {
            if (evento.target === dialogo.current) dialogo.current.close();
          }}
          className="m-auto max-h-[90vh] max-w-[90vw] rounded-xl bg-base-3 p-2"
        >
          <img src={urlDaFoto(fotoId)} alt={alt} className="max-h-[80vh] max-w-full object-contain" />
          <form method="dialog" className="mt-2 text-right">
            <button type="submit" className="text-sm text-texto underline">
              Fechar
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
