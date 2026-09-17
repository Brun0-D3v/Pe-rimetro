import { Link } from "react-router-dom";

const itens = [
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#como-funciona", rotulo: "Como funciona" },
];

export default function LandingNavbar() {
  return (
    <nav className="fixed left-1/2 top-4 z-20 -translate-x-1/2">
      <div className="flex items-center gap-4 rounded-full bg-base-1 px-4 py-2 sm:gap-6 sm:px-6">
        <span className="text-sm font-semibold text-white">Pé-rímetro</span>

        {itens.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hidden text-xs text-texto-mute transition-colors duration-base ease-reveal hover:text-white sm:inline-block sm:text-sm"
          >
            {item.rotulo}
          </a>
        ))}

        <Link
          to="/app"
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors duration-base ease-reveal hover:bg-primary-hover sm:text-sm"
        >
          Acessar o mapa
        </Link>
      </div>
    </nav>
  );
}
