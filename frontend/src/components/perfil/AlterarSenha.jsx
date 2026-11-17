import { useState } from "react";
import { LIMITES_CONTA } from "../../config/authConfig";
import { alterarSenha } from "../../services/usuarioService";
import { validarTrocaDeSenha } from "../../utils/validacaoAuth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import CampoTexto from "../ui/CampoTexto";

const MENSAGEM_SEM_CONEXAO = "Não foi possível alterar a senha. Verifique a conexão e tente novamente.";
const CAMPOS = ["senhaAtual", "novaSenha", "confirmacao"];

export default function AlterarSenha() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState({});
  const [erroServidor, setErroServidor] = useState(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setSucesso(false);
    setErroServidor(null);
    const encontrados = validarTrocaDeSenha({ senhaAtual, novaSenha, confirmacao });
    setErros(encontrados);
    const primeiroInvalido = CAMPOS.find((campo) => encontrados[campo]);
    if (primeiroInvalido) {
      document.getElementById(`senha-${primeiroInvalido}`)?.focus();
      return;
    }

    setSalvando(true);
    try {
      await alterarSenha({ senhaAtual, novaSenha });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setSucesso(true);
    } catch (falha) {
      setErroServidor(falha.response?.data?.mensagem ?? MENSAGEM_SEM_CONEXAO);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-texto">Segurança</h2>
      <p className="mt-1 text-sm text-texto-mute">Para trocar a senha, informe a atual.</p>

      <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
        <CampoTexto
          id="senha-senhaAtual"
          rotulo="Senha atual"
          type="password"
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(evento) => setSenhaAtual(evento.target.value)}
          erro={erros.senhaAtual}
        />
        <CampoTexto
          id="senha-novaSenha"
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          maxLength={LIMITES_CONTA.senhaMax}
          value={novaSenha}
          onChange={(evento) => setNovaSenha(evento.target.value)}
          ajuda={`Mínimo de ${LIMITES_CONTA.senhaMin} caracteres.`}
          erro={erros.novaSenha}
        />
        <CampoTexto
          id="senha-confirmacao"
          rotulo="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          maxLength={LIMITES_CONTA.senhaMax}
          value={confirmacao}
          onChange={(evento) => setConfirmacao(evento.target.value)}
          erro={erros.confirmacao}
        />

        <div aria-live="polite">
          {sucesso && (
            <p role="status" className="text-sm text-texto">
              Senha alterada.
            </p>
          )}
          {erroServidor && (
            <p role="alert" className="text-sm text-indice-ruim">
              {erroServidor}
            </p>
          )}
        </div>

        <Button type="submit" disabled={salvando}>
          {salvando ? "Alterando..." : "Alterar senha"}
        </Button>
      </form>
    </Card>
  );
}
