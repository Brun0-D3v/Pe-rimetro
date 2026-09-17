import { Link, NavLink } from "react-router-dom";
import { AlertTriangle, ClipboardCheck, Home, LayoutDashboard, Map } from "lucide-react";

const links = [
  { to: "/app", label: "Mapa", icon: Map, end: true },
  { to: "/app/avaliacao", label: "Avaliação", icon: ClipboardCheck },
  { to: "/app/ocorrencia", label: "Ocorrência", icon: AlertTriangle },
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function itemClasse({ isActive }) {
  return [
    "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-fast ease-reveal",
    isActive
      ? "bg-primary-light/10 text-primary-light"
      : "text-texto-mute hover:bg-white/5 hover:text-white",
  ].join(" ");
}

export default function AppNavbar() {
  return (
    <nav aria-label="Navegação principal" className="fixed left-1/2 top-4 z-40 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-base-4 bg-primary-surface px-2 py-2 shadow-lg">
        <Link
          to="/"
          title="Voltar para a página inicial"
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-texto-mute transition-colors duration-fast ease-reveal hover:bg-white/5 hover:text-white"
        >
          <Home size={18} className="shrink-0" />
          <span className="hidden md:inline">Início</span>
        </Link>

        <span className="mx-1 h-5 w-px bg-base-4" aria-hidden="true" />

        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={itemClasse} title={label}>
            <Icon size={18} className="shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
