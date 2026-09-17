import { NavLink } from "react-router-dom";
import {
  AlertTriangle,
  ClipboardCheck,
  LayoutDashboard,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const links = [
  { to: "/", label: "Mapa", icon: Map, end: true },
  { to: "/avaliacao", label: "Avaliação", icon: ClipboardCheck },
  { to: "/ocorrencia", label: "Ocorrência", icon: AlertTriangle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function itemClasse({ isActive }) {
  return [
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary-light/10 text-primary-light"
      : "text-texto-mute hover:bg-white/5 hover:text-white",
  ].join(" ");
}

export default function Sidebar({ colapsada, aoAlternarColapso, aberta, aoFechar }) {
  return (
    <>
      {aberta && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={aoFechar} aria-hidden="true" />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-base-4 bg-primary-surface px-3 py-6 transition-transform duration-200",
          "md:static md:translate-x-0",
          colapsada ? "md:w-20" : "md:w-60",
          aberta ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-1">
          <span className={["text-lg font-semibold text-white", colapsada ? "md:hidden" : ""].join(" ")}>
            Pé-rímetro
          </span>

          <button
            type="button"
            onClick={aoFechar}
            className="rounded-lg p-1.5 text-texto-mute hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>

          <button
            type="button"
            onClick={aoAlternarColapso}
            className="hidden rounded-lg p-1.5 text-texto-mute hover:bg-white/5 hover:text-white md:flex"
            aria-label={colapsada ? "Expandir menu" : "Recolher menu"}
          >
            {colapsada ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={itemClasse} title={colapsada ? label : undefined}>
              <Icon size={18} className="shrink-0" />
              <span className={colapsada ? "md:hidden" : undefined}>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
