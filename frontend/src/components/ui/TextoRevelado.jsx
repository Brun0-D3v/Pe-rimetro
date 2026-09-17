import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

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
  const reduzirMovimento = useReducedMotion();
  const palavras = dividirEmPalavras(segmentos ?? [{ texto: texto ?? "" }]);

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
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
          style={{ marginRight: indice === palavras.length - 1 ? undefined : "0.25em" }}
        >
          {palavra}
        </motion.span>
      ))}
    </span>
  );
}
