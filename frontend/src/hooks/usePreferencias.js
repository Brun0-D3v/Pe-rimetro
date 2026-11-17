import { useContext } from "react";
import { PreferenciasContext } from "../context/preferenciasContexto";

export function usePreferencias() {
  const contexto = useContext(PreferenciasContext);
  if (!contexto) {
    throw new Error("usePreferencias precisa ser usado dentro de um PreferenciasProvider");
  }
  return contexto;
}
