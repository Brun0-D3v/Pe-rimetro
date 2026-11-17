const ROTA_PADRAO = "/app";

/**
 * O parâmetro `retorno` vem da URL, então qualquer um pode forjá-lo. Só aceitamos caminhos internos
 * ("/algo"), nunca endereços completos nem "//outro-site" (evita redirecionar a pessoa para fora).
 */
export function retornoSeguro(valor) {
  if (typeof valor !== "string") return ROTA_PADRAO;
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.includes("\\")) return ROTA_PADRAO;
  return valor;
}
