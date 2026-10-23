const variantes = {
  primario: "bg-primary text-texto hover:bg-primary-hover",
  secundario: "border border-base-4 text-texto hover:bg-hover-surface",
  fantasma: "text-texto-mute hover:bg-hover-surface hover:text-texto",
};

export default function Button({ variante = "primario", className = "", ...props }) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-fast ease-reveal disabled:cursor-not-allowed disabled:opacity-50",
        variantes[variante],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
