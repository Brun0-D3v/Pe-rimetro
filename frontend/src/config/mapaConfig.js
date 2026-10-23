export const TEMA_ESCURO = "escuro";
export const TEMA_CLARO = "claro";

export const TILES_POR_TEMA = {
  [TEMA_ESCURO]: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    atribuicao:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  [TEMA_CLARO]: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    atribuicao:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const CENTRO_PADRAO = [-8.0631, -34.8711]; // Recife, Marco Zero
export const ZOOM_PADRAO = 14;
