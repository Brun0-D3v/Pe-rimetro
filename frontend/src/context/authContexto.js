import { createContext } from "react";

// Contexto separado do provider para que AuthContext.jsx exporte só componentes (fast refresh).
export const AuthContext = createContext(null);
