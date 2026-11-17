import { LIMITES_CONTA } from "../config/authConfig";

// Propositalmente frouxo: só barra o que claramente não é e-mail. Quem decide é o backend.
const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+$/;

function validarEmail(email) {
  const limpo = (email ?? "").trim();
  if (!limpo) return "Informe o e-mail.";
  if (limpo.length > LIMITES_CONTA.emailMax || !PADRAO_EMAIL.test(limpo)) return "Informe um e-mail válido.";
  return null;
}

/** Devolve um objeto { campo: mensagem } só com os campos inválidos; vazio quando está tudo certo. */
export function validarLogin({ email, senha }) {
  const erros = {};
  const erroEmail = validarEmail(email);
  if (erroEmail) erros.email = erroEmail;
  if (!senha) erros.senha = "Informe a senha.";
  return erros;
}

function validarNome(nome) {
  const tamanho = (nome ?? "").trim().length;
  if (tamanho < LIMITES_CONTA.nomeMin || tamanho > LIMITES_CONTA.nomeMax) {
    return `O nome deve ter entre ${LIMITES_CONTA.nomeMin} e ${LIMITES_CONTA.nomeMax} caracteres.`;
  }
  return null;
}

export function validarPerfil({ nome }) {
  const erroNome = validarNome(nome);
  return erroNome ? { nome: erroNome } : {};
}

export function validarTrocaDeSenha({ senhaAtual, novaSenha, confirmacao }) {
  const erros = {};
  if (!senhaAtual) erros.senhaAtual = "Informe a senha atual.";
  const tamanho = (novaSenha ?? "").length;
  if (tamanho < LIMITES_CONTA.senhaMin || tamanho > LIMITES_CONTA.senhaMax) {
    erros.novaSenha = `A nova senha deve ter entre ${LIMITES_CONTA.senhaMin} e ${LIMITES_CONTA.senhaMax} caracteres.`;
  } else if (novaSenha === senhaAtual) {
    erros.novaSenha = "A nova senha deve ser diferente da atual.";
  }
  if (novaSenha !== confirmacao) erros.confirmacao = "As senhas não conferem.";
  return erros;
}

export function validarCadastro({ nome, email, senha }) {
  const erros = {};
  const erroNome = validarNome(nome);
  if (erroNome) erros.nome = erroNome;
  const erroEmail = validarEmail(email);
  if (erroEmail) erros.email = erroEmail;
  const tamanhoSenha = (senha ?? "").length;
  if (tamanhoSenha < LIMITES_CONTA.senhaMin || tamanhoSenha > LIMITES_CONTA.senhaMax) {
    erros.senha = `A senha deve ter entre ${LIMITES_CONTA.senhaMin} e ${LIMITES_CONTA.senhaMax} caracteres.`;
  }
  return erros;
}
