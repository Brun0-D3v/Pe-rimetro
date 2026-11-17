import { createContext } from "react";

// Contexto separado do provider para que PreferenciasContext.jsx exporte só componentes (fast refresh).
export const PreferenciasContext = createContext(null);
