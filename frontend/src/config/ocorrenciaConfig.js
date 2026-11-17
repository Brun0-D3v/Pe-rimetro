export const MAX_FOTOS = 3;
export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_DESCRICAO = 500;
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];

// Espelha o backend (fonte da verdade): evita só o envio inútil.
export function validarFoto(arquivo) {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return "Use uma imagem JPEG, PNG ou WebP.";
  if (arquivo.size > MAX_BYTES) return "A foto deve ter no máximo 5 MB.";
  return null;
}
