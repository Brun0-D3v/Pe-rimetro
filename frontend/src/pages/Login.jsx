import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import CampoTexto from "../components/ui/CampoTexto";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";
import { retornoSeguro } from "../utils/rotas";
import { validarLogin } from "../utils/validacaoAuth";

const MENSAGEM_SEM_CONEXAO = "Não foi possível entrar. Verifique a conexão e tente novamente.";

export default function Login() {
  const { autenticado, entrar, aviso } = useAuth();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const retorno = retornoSeguro(parametros.get("retorno"));

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
    const encontrados = validarLogin({ email, senha });
    setErros(encontrados);
    setErroServidor(null);
    const primeiroInvalido = ["email", "senha"].find((campo) => encontrados[campo]);
    if (primeiroInvalido) {
      document.getElementById(`login-${primeiroInvalido}`)?.focus();
      return;
    }

    setEnviando(true);
    try {
      await entrar({ email: email.trim(), senha });
      navegar(retorno, { replace: true });
    } catch (falha) {
      setErroServidor(falha.response?.data?.mensagem ?? MENSAGEM_SEM_CONEXAO);
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <h1 className="text-xl font-semibold text-texto">Entrar</h1>
        <p className="mt-1 text-sm text-texto-mute">Entre para avaliar trechos e cadastrar novos caminhos.</p>

        {aviso && (
          <p role="status" className="mt-4 rounded-lg bg-base-2 px-3 py-2 text-sm text-texto">
            {aviso}
          </p>
        )}

        <form onSubmit={enviar} noValidate className="mt-5 flex flex-col gap-4">
          <CampoTexto
            id="login-email"
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            erro={erros.email}
          />
          <CampoTexto
            id="login-senha"
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
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
            {enviando ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-texto-mute">
          Ainda não tem conta?{" "}
          <Link
            to={`/cadastrar?retorno=${encodeURIComponent(retorno)}`}
            className="font-medium text-primary-light hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </Card>
    </div>
  );
}
