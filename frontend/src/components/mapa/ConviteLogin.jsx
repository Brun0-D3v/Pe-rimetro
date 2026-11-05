import { Link } from "react-router-dom";

// Depois do login a pessoa volta ao mapa.
const RETORNO = encodeURIComponent("/app");

const classeBotao =
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-fast ease-reveal";

export default function ConviteLogin({ mensagem, aoDispensar }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <p className="text-sm text-texto">{mensagem}</p>
      <div className="flex flex-wrap gap-2">
        <Link to={`/entrar?retorno=${RETORNO}`} className={`${classeBotao} bg-primary text-texto hover:bg-primary-hover`}>
          Entrar
        </Link>
        <Link
          to={`/cadastrar?retorno=${RETORNO}`}
          className={`${classeBotao} border border-base-4 text-texto hover:bg-hover-surface`}
        >
          Criar conta
        </Link>
        {aoDispensar && (
          <button
            type="button"
            onClick={aoDispensar}
            className={`${classeBotao} text-texto-mute hover:bg-hover-surface hover:text-texto`}
          >
            Agora não
          </button>
        )}
      </div>
    </div>
  );
}
