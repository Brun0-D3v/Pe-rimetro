import { useState } from "react";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [colapsada, setColapsada] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex min-h-screen bg-base-2">
      <Sidebar
        colapsada={colapsada}
        aoAlternarColapso={() => setColapsada((valor) => !valor)}
        aberta={menuAberto}
        aoFechar={() => setMenuAberto(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center border-b border-base-4 bg-base-2 px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="rounded-lg p-2 text-texto-mute hover:bg-white/5 hover:text-white"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 text-base font-semibold text-white">Pé-rímetro</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
