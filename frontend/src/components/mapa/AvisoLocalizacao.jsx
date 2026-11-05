// Mostra o andamento ("buscando") ou o motivo de a localização não funcionar.
export default function AvisoLocalizacao({ estado, erro, className = "" }) {
  const texto = estado === "buscando" ? "Buscando sua localização..." : erro;
  if (!texto) return null;

  return (
    <p
      role="status"
      className={[
        "max-w-sm rounded-2xl border border-base-4 bg-base-3 px-4 py-3 text-sm text-texto shadow-sm",
        className,
      ].join(" ")}
    >
      {texto}
    </p>
  );
}
