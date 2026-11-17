// Onde a sessão fica no navegador. O token é um Bearer JWT; o backend é quem decide se ele vale.
export const CHAVE_SESSAO = "perimetro-sessao";

// Disparado pelo interceptor do axios quando o backend responde 401 a uma requisição autenticada.
export const EVENTO_SESSAO_EXPIRADA = "perimetro:sessao-expirada";

// Espelha os limites de RegistroRequestDto no backend (que continua sendo a fonte da verdade).
export const LIMITES_CONTA = {
  nomeMin: 2,
  nomeMax: 120,
  emailMax: 254,
  senhaMin: 8,
  senhaMax: 72,
};
