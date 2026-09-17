import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logoPerimetro from "../../assets/logo-perimetro.png";

export default function Hero() {
  const reduzirMovimento = useReducedMotion();

  return (
    <section className="relative flex h-screen w-full items-end overflow-hidden bg-gradient-to-b from-primary-surface to-base-1">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />

      <div className="relative z-10 flex w-full flex-col gap-6 px-4 pb-16 sm:px-6 md:px-10 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="w-full">
          <motion.img
            src={logoPerimetro}
            alt="Pé-rímetro — o índice da cidade caminhável"
            initial={reduzirMovimento ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[90vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
          />
        </h1>

        <div className="flex max-w-md flex-col gap-5 lg:pb-4">
          <motion.p
            initial={reduzirMovimento ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm text-texto-mute md:text-base"
          >
            O Pé-rímetro transforma a experiência de quem caminha pela cidade
            em dados estruturados: um mapa colaborativo do índice de
            caminhabilidade urbana.
          </motion.p>

          <motion.div
            initial={reduzirMovimento ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-sm font-medium text-white transition-colors duration-fast ease-reveal hover:bg-primary-hover"
            >
              Acessar o mapa
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-base-1 transition-transform duration-fast ease-reveal group-hover:scale-110">
                <ArrowRight className="h-4 w-4 text-white" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
