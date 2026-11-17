import { TAMANHOS_FONTE } from "../../config/preferenciasConfig";
import { usePreferencias } from "../../hooks/usePreferencias";
import Card from "../ui/Card";

export default function PreferenciasAcessibilidade() {
  const { tamanhoFonte, definirTamanhoFonte } = usePreferencias();

  return (
    <Card>
      <h2 className="text-lg font-semibold text-texto">Acessibilidade</h2>
      <p className="mt-1 text-sm text-texto-mute">
        A preferência fica salva neste navegador e vale para todas as telas.
      </p>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold uppercase tracking-wide text-texto-mute">Tamanho do texto</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAMANHOS_FONTE.map(({ valor, rotulo }) => (
            <label
              key={valor}
              className={[
                "cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors duration-fast ease-reveal",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                tamanhoFonte === valor
                  ? "border-primary-light bg-primary-light/10 text-primary-light"
                  : "border-base-4 text-texto hover:bg-hover-surface",
              ].join(" ")}
            >
              <input
                type="radio"
                name="tamanho-fonte"
                value={valor}
                checked={tamanhoFonte === valor}
                onChange={() => definirTamanhoFonte(valor)}
                className="sr-only"
              />
              {rotulo}
            </label>
          ))}
        </div>
      </fieldset>
    </Card>
  );
}
