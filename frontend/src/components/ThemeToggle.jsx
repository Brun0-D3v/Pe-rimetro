import { Moon, Sun } from "lucide-react";
import { TEMA_ESCURO } from "../config/mapaConfig";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { tema, alternarTema } = useTheme();
  const ehEscuro = tema === TEMA_ESCURO;

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={ehEscuro ? "Ativar tema claro" : "Ativar tema escuro"}
      title={ehEscuro ? "Ativar tema claro" : "Ativar tema escuro"}
      className={[
        "inline-flex items-center justify-center rounded-full border border-base-4 p-2 text-texto-mute transition-colors duration-fast ease-reveal hover:bg-hover-surface hover:text-texto",
        className,
      ].join(" ")}
    >
      {ehEscuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
