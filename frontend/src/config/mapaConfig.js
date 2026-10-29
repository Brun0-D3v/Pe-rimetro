export const TEMA_ESCURO = "escuro";
export const TEMA_CLARO = "claro";

// Em localhost o Stadia dispensa chave; em produção defina VITE_STADIA_API_KEY.
const chaveStadia = import.meta.env.VITE_STADIA_API_KEY;
const sufixoChave = chaveStadia ? `?api_key=${chaveStadia}` : "";

const ATRIBUICAO_STADIA =
  '&copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const TILES_POR_TEMA = {
  [TEMA_ESCURO]: {
    url: `https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png${sufixoChave}`,
    atribuicao: ATRIBUICAO_STADIA,
  },
  [TEMA_CLARO]: {
    url: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png${sufixoChave}`,
    atribuicao: ATRIBUICAO_STADIA,
  },
};

export const CENTRO_PADRAO = [-8.0631, -34.8711]; // Recife, Marco Zero
export const ZOOM_PADRAO = 14;
