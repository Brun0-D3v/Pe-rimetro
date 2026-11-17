export default function CampoTexto({ id, rotulo, erro, ajuda, className = "", ...props }) {
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;
  const descricao = [erro ? idErro : null, ajuda ? idAjuda : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-texto-mute">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={descricao}
        className="w-full rounded-lg border border-base-4 bg-base-2 px-3 py-2 text-sm text-texto placeholder:text-texto-mute"
        {...props}
      />
      {ajuda && (
        <p id={idAjuda} className="text-xs text-texto-mute">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs text-indice-ruim">
          {erro}
        </p>
      )}
    </div>
  );
}
