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

export function validarCadastro({ nome, email, senha }) {
  const erros = {};
  const nomeLimpo = (nome ?? "").trim();
  if (nomeLimpo.length < LIMITES_CONTA.nomeMin || nomeLimpo.length > LIMITES_CONTA.nomeMax) {
    erros.nome = `O nome deve ter entre ${LIMITES_CONTA.nomeMin} e ${LIMITES_CONTA.nomeMax} caracteres.`;
  }
  const erroEmail = validarEmail(email);
  if (erroEmail) erros.email = erroEmail;
  const tamanhoSenha = (senha ?? "").length;
  if (tamanhoSenha < LIMITES_CONTA.senhaMin || tamanhoSenha > LIMITES_CONTA.senhaMax) {
    erros.senha = `A senha deve ter entre ${LIMITES_CONTA.senhaMin} e ${LIMITES_CONTA.senhaMax} caracteres.`;
  }
  return erros;
}
