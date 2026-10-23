const CATEGORIAS = [
  { tom: "bg-indice-bom", rotulo: "Bom" },
  { tom: "bg-indice-medio", rotulo: "Médio" },
  { tom: "bg-indice-ruim", rotulo: "Ruim" },
];

export default function LegendaMapa({ className = "" }) {
  return (
    <div
      className={[
        "w-fit rounded-2xl border border-base-4 bg-base-3 p-4 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-mute">Caminhabilidade (demonstração)</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {CATEGORIAS.map(({ tom, rotulo }) => (
          <li key={rotulo} className="flex items-center gap-2 text-sm text-texto">
            <span className={["h-3 w-3 rounded-full", tom].join(" ")} aria-hidden="true" />
            {rotulo}
          </li>
        ))}
      </ul>
    </div>
  );
}
