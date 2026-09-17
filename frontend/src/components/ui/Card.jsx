export default function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-2xl border border-base-4 bg-base-3 p-8 shadow-sm transition-colors duration-base ease-reveal",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
