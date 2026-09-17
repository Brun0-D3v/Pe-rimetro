import { Link } from "react-router-dom";
import logoPerimetro from "../../assets/logo-perimetro.png";

const itens = [
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#como-funciona", rotulo: "Como funciona" },
];

export default function LandingNavbar() {
  return (
    <nav aria-label="Navegação institucional" className="fixed left-1/2 top-4 z-40 -translate-x-1/2">
      <div className="flex items-center gap-4 rounded-full bg-base-1 px-4 py-2 sm:gap-6 sm:px-6">
        <img src={logoPerimetro} alt="Pé-rímetro" className="h-6 w-auto sm:h-7" />

        {itens.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="hidden text-xs text-texto-mute transition-colors duration-fast ease-reveal hover:text-white sm:inline-block sm:text-sm"
          >
            {item.rotulo}
          </a>
        ))}

        <Link
          to="/app"
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors duration-fast ease-reveal hover:bg-primary-hover sm:text-sm"
        >
          Acessar o mapa
        </Link>
      </div>
    </nav>
  );
}
