const FAIXAS = [
  { tom: "bg-indice-bom", rotulo: "Bom", intervalo: "7,0 a 10" },
  { tom: "bg-indice-medio", rotulo: "Médio", intervalo: "4,0 a 6,9" },
  { tom: "bg-indice-ruim", rotulo: "Ruim", intervalo: "0 a 3,9" },
  { tom: "bg-primary-light", rotulo: "Sem avaliações", intervalo: null },
];

export default function LegendaMapa({ className = "" }) {
  return (
    <div
      className={[
        "w-fit rounded-2xl border border-base-4 bg-base-3 p-4 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-mute">Caminhabilidade</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {FAIXAS.map(({ tom, rotulo, intervalo }) => (
          <li key={rotulo} className="flex items-center gap-2 text-sm text-texto">
            <span className={["h-1.5 w-5 rounded-full", tom].join(" ")} aria-hidden="true" />
            {rotulo}
            {intervalo && <span className="text-texto-mute">({intervalo})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
