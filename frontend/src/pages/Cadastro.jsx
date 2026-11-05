import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import CampoTexto from "../components/ui/CampoTexto";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { LIMITES_CONTA } from "../config/authConfig";
import { useAuth } from "../hooks/useAuth";
import { retornoSeguro } from "../utils/rotas";
import { validarCadastro } from "../utils/validacaoAuth";

const MENSAGEM_SEM_CONEXAO = "Não foi possível criar a conta. Verifique a conexão e tente novamente.";
const CAMPOS = ["nome", "email", "senha"];

export default function Cadastro() {
  const { autenticado, cadastrar } = useAuth();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const retorno = retornoSeguro(parametros.get("retorno"));

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [erroServidor, setErroServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado && !enviando) {
    return <Navigate to={retorno} replace />;
  }

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validarCadastro({ nome, email, senha });
    setErros(encontrados);
    setErroServidor(null);
    const primeiroInvalido = CAMPOS.find((campo) => encontrados[campo]);
    if (primeiroInvalido) {
      document.getElementById(`cadastro-${primeiroInvalido}`)?.focus();
      return;
    }

    setEnviando(true);
    try {
      await cadastrar({ nome: nome.trim(), email: email.trim(), senha });
      navegar(retorno, { replace: true });
    } catch (falha) {
      setErroServidor(falha.response?.data?.mensagem ?? MENSAGEM_SEM_CONEXAO);
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <h1 className="text-xl font-semibold text-texto">Criar conta</h1>
        <p className="mt-1 text-sm text-texto-mute">Leva um minuto e você já pode avaliar e cadastrar trechos.</p>

        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <CampoTexto
            id="cadastro-nome"
            rotulo="Nome"
            type="text"
            autoComplete="name"
            maxLength={LIMITES_CONTA.nomeMax}
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            erro={erros.nome}
          />
          <CampoTexto
            id="cadastro-email"
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            erro={erros.email}
          />
          <CampoTexto
            id="cadastro-senha"
            rotulo="Senha"
            type="password"
            autoComplete="new-password"
            maxLength={LIMITES_CONTA.senhaMax}
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            ajuda={`Mínimo de ${LIMITES_CONTA.senhaMin} caracteres.`}
            erro={erros.senha}
          />

          <div aria-live="polite">
            {erroServidor && (
              <p role="alert" className="text-sm text-indice-ruim">
                {erroServidor}
              </p>
            )}
          </div>

          <Button type="submit" disabled={enviando}>
            {enviando ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-texto-mute">
          Já tem conta?{" "}
          <Link
            to={`/entrar?retorno=${encodeURIComponent(retorno)}`}
            className="font-medium text-primary-light hover:underline"
          >
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
