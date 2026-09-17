import { motion, useInView } from "framer-motion";
import { useRef } from "react";

function prefereMovimentoReduzido() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function dividirEmPalavras(segmentos) {
  const palavras = [];
  segmentos.forEach((segmento) => {
    segmento.texto.split(" ").forEach((palavra) => {
      if (palavra) palavras.push({ palavra, className: segmento.className });
    });
  });
  return palavras;
}

export default function TextoRevelado({ texto, segmentos, className = "", style }) {
  const ref = useRef(null);
  const estaVisivel = useInView(ref, { once: true });
  const reduzirMovimento = prefereMovimentoReduzido();
  const palavras = dividirEmPalavras(segmentos ?? [{ texto }]);

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {palavras.map(({ palavra, className: classeSegmento }, indice) => (
        <motion.span
          key={`${palavra}-${indice}`}
          initial={reduzirMovimento ? false : { y: 20, opacity: 0 }}
          animate={reduzirMovimento || estaVisivel ? { y: 0, opacity: 1 } : {}}
          transition={{
            duration: 0.6,
            delay: reduzirMovimento ? 0 : indice * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`inline-block ${classeSegmento ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {palavra}
        </motion.span>
      ))}
    </div>
  );
}
