import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MAX_DESCRICAO, MAX_FOTOS, validarFoto } from "../../config/ocorrenciaConfig";
import { useCategorias } from "../../hooks/useCategorias";
import { criarOcorrencia, enviarFoto } from "../../services/ocorrenciaService";
import Button from "../ui/Button";

const classeCampo = "w-full rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto";
const classeRotulo = "text-xs font-semibold uppercase tracking-wide text-texto-mute";

function mensagemDeErro(erro) {
  return (
    erro.response?.data?.mensagem ?? "Não foi possível registrar a ocorrência. Verifique a conexão e tente novamente."
  );
}

let proximoId = 0;

// `aoConcluir(ocorrencia, { fotosPendentes })`: chamado assim que a ocorrência é criada e as fotos
// foram tentadas; se alguma falhou, o formulário continua aberto para "Tentar de novo" e
// `aoConcluir` é chamado outra vez quando as pendentes forem enviadas.
export default function FormularioOcorrencia({ trechoId, aoConcluir, aoCancelar }) {
  const { categorias, carregando: carregandoCategorias, erro: erroCategorias } = useCategorias();
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState([]);
  const [erroCategoria, setErroCategoria] = useState(null);
  const [erroFoto, setErroFoto] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [ocorrencia, setOcorrencia] = useState(null);
  const [falhas, setFalhas] = useState([]);

  const refCategoria = useRef(null);
  const refFotos = useRef(null);
  const fotosRef = useRef(fotos);

  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  // Libera as URLs de pré-visualização ao desmontar.
  useEffect(
    () => () => {
      fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.url));
    },
    []
  );

  function escolherFotos(evento) {
    const escolhidas = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    let mensagem = null;
    const aceitas = [];
    for (const arquivo of escolhidas) {
      if (fotos.length + aceitas.length >= MAX_FOTOS) {
        mensagem = `No máximo ${MAX_FOTOS} fotos`;
        break;
      }
      const invalida = validarFoto(arquivo);
      if (invalida) {
        mensagem = `${arquivo.name}: ${invalida}`;
        continue;
      }
      aceitas.push({ id: ++proximoId, arquivo, url: URL.createObjectURL(arquivo) });
    }
    setErroFoto(mensagem);
    if (mensagem) refFotos.current?.focus();
    if (aceitas.length) setFotos((atuais) => [...atuais, ...aceitas]);
  }

  function removerFoto(foto) {
    URL.revokeObjectURL(foto.url);
    setFotos((atuais) => atuais.filter((item) => item.id !== foto.id));
    setErroFoto(null);
  }

  async function enviarFotos(id, lista) {
    const pendentes = [];
    for (const foto of lista) {
      try {
        await enviarFoto(id, foto.arquivo);
      } catch {
        pendentes.push(foto);
      }
    }
    return pendentes;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro(null);
    if (!categoriaId) {
      setErroCategoria("Escolha uma categoria");
      refCategoria.current?.focus();
      return;
    }
    setErroCategoria(null);
    setEnviando(true);
    let criada;
    try {
      criada = await criarOcorrencia(trechoId, { categoriaId, descricao: descricao.trim() });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
      return;
    }
    setOcorrencia(criada);
    const pendentes = await enviarFotos(criada.id, fotos);
    setFalhas(pendentes);
    setEnviando(false);
    aoConcluir(criada, { fotosPendentes: pendentes.length });
  }

  async function tentarDeNovo() {
    setEnviando(true);
    const pendentes = await enviarFotos(ocorrencia.id, falhas);
    setFalhas(pendentes);
    setEnviando(false);
    if (pendentes.length === 0) aoConcluir(ocorrencia, { fotosPendentes: 0 });
  }

  const registrada = ocorrencia !== null;
  const bloqueado = enviando || registrada;

  return (
    <form onSubmit={enviar} noValidate className="mt-4 flex max-h-[50dvh] flex-col gap-4 overflow-y-auto pr-1">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ocorrencia-categoria" className={classeRotulo}>
          Categoria
        </label>
        <select
          id="ocorrencia-categoria"
          ref={refCategoria}
          value={categoriaId}
          disabled={bloqueado || carregandoCategorias}
          onChange={(evento) => setCategoriaId(evento.target.value)}
          aria-invalid={erroCategoria ? "true" : undefined}
          aria-describedby={erroCategoria ? "ocorrencia-categoria-erro" : undefined}
          className={classeCampo}
        >
          <option value="">{carregandoCategorias ? "Carregando..." : "Selecione uma categoria"}</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
        <div aria-live="polite">
          {erroCategoria && (
            <p id="ocorrencia-categoria-erro" className="text-xs text-indice-ruim">
              {erroCategoria}
            </p>
          )}
          {erroCategorias && <p className="text-xs text-indice-ruim">Não foi possível carregar as categorias.</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ocorrencia-descricao" className={classeRotulo}>
          Descrição (opcional)
        </label>
        <textarea
          id="ocorrencia-descricao"
          rows={3}
          maxLength={MAX_DESCRICAO}
          value={descricao}
          disabled={bloqueado}
          onChange={(evento) => setDescricao(evento.target.value)}
          className={classeCampo}
        />
        <p className="text-right text-xs text-texto-mute">
          {descricao.length}/{MAX_DESCRICAO}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ocorrencia-fotos" className={classeRotulo}>
          Fotos (opcional, até {MAX_FOTOS})
        </label>
        <input
          id="ocorrencia-fotos"
          ref={refFotos}
          type="file"
          accept="image/*"
          multiple
          disabled={bloqueado}
          onChange={escolherFotos}
          aria-describedby={erroFoto ? "ocorrencia-fotos-erro" : undefined}
          className="text-sm text-texto-mute"
        />
        <div aria-live="polite">
          {erroFoto && (
            <p id="ocorrencia-fotos-erro" className="text-xs text-indice-ruim">
              {erroFoto}
            </p>
          )}
        </div>
        {fotos.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {fotos.map((foto) => (
              <li key={foto.id} className="flex w-20 flex-col gap-1">
                <img
                  src={foto.url}
                  alt={`Prévia de ${foto.arquivo.name}`}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <span className="truncate text-xs text-texto-mute">{foto.arquivo.name}</span>
                {!registrada && (
                  <button
                    type="button"
                    onClick={() => removerFoto(foto)}
                    disabled={enviando}
                    aria-label={`Remover foto ${foto.arquivo.name}`}
                    className="inline-flex items-center justify-center rounded-lg border border-base-4 p-1 text-texto-mute hover:bg-hover-surface"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {erro && (
          <p role="alert" className="rounded-lg border border-indice-ruim/40 bg-indice-ruim/10 px-3 py-2 text-sm text-texto">
            {erro}
          </p>
        )}
        {falhas.map((foto) => (
          <div
            key={foto.id}
            className="flex flex-col gap-2 rounded-lg border border-indice-ruim/40 bg-indice-ruim/10 px-3 py-2 text-sm text-texto"
          >
            <p>Ocorrência registrada, mas a foto {foto.arquivo.name} não foi enviada.</p>
            <Button
              type="button"
              variante="secundario"
              onClick={tentarDeNovo}
              disabled={enviando}
              aria-label={`Tentar de novo: ${foto.arquivo.name}`}
            >
              Tentar de novo
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {!registrada && (
          <Button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar ocorrência"}
          </Button>
        )}
        <Button type="button" variante="secundario" onClick={aoCancelar} disabled={enviando}>
          {registrada ? "Fechar" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}
