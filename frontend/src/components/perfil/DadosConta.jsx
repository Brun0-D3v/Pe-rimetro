import { useState } from "react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import CampoTexto from "../ui/CampoTexto";
import { LIMITES_CONTA } from "../../config/authConfig";
import { useAuth } from "../../hooks/useAuth";
import { atualizarPerfil } from "../../services/authService";
import { validarPerfil } from "../../utils/validacaoAuth";

const ROTULOS_PERFIL = { CIDADAO: "Cidadão", ADMINISTRADOR: "Administrador" };
const MENSAGEM_SEM_CONEXAO = "Não foi possível salvar. Verifique a conexão e tente novamente.";

export default function DadosConta() {
  const { usuario, atualizarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [erros, setErros] = useState({});
  const [erroServidor, setErroServidor] = useState(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  if (!usuario) return null;

  const alterado = nome.trim() !== usuario.nome;

  async function enviar(evento) {
    evento.preventDefault();
    setSalvo(false);
    setErroServidor(null);
    const encontrados = validarPerfil({ nome });
    setErros(encontrados);
    if (encontrados.nome) {
      document.getElementById("perfil-nome")?.focus();
      return;
    }

    setSalvando(true);
    try {
      const atualizado = await atualizarPerfil({ nome: nome.trim() });
      atualizarUsuario(atualizado);
      setNome(atualizado.nome);
      setSalvo(true);
    } catch (falha) {
      setErroServidor(falha.response?.data?.mensagem ?? MENSAGEM_SEM_CONEXAO);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-texto">Dados da conta</h2>
        <Badge tom="neutro">{ROTULOS_PERFIL[usuario.perfil] ?? usuario.perfil}</Badge>
      </div>

      <dl className="mt-5">
        <dt className="text-xs font-semibold uppercase tracking-wide text-texto-mute">E-mail</dt>
        <dd className="mt-1 text-sm text-texto">{usuario.email}</dd>
        <dd className="mt-1 text-xs text-texto-mute">O e-mail não pode ser alterado por enquanto.</dd>
      </dl>

      <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
        <CampoTexto
          id="perfil-nome"
          rotulo="Nome"
          type="text"
          autoComplete="name"
          maxLength={LIMITES_CONTA.nomeMax}
          value={nome}
          onChange={(evento) => {
            setNome(evento.target.value);
            setSalvo(false);
          }}
          erro={erros.nome}
        />

        <div aria-live="polite">
          {salvo && (
            <p role="status" className="text-sm text-texto">
              Perfil atualizado.
            </p>
          )}
          {erroServidor && (
            <p role="alert" className="text-sm text-indice-ruim">
              {erroServidor}
            </p>
          )}
        </div>

        <Button type="submit" disabled={salvando || !alterado}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>
    </Card>
  );
}
