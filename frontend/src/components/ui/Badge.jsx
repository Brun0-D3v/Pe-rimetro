// `tom` recebe uma classificação já decidida por quem chama o componente
// (ex.: "bom" | "medio" | "ruim" para o Índice de Caminhabilidade, "neutro"
// para status gerais). As faixas numéricas que definem essa classificação
// ainda não foram decididas — ver "Classificação do Índice" no Vault.
const tonalidades = {
  bom: "bg-indice-bom/15 text-indice-bom",
  medio: "bg-indice-medio/15 text-indice-medio",
  ruim: "bg-indice-ruim/15 text-indice-ruim",
  neutro: "bg-base-4 text-texto-mute",
};

export default function Badge({ tom = "neutro", children, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        tonalidades[tom],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
