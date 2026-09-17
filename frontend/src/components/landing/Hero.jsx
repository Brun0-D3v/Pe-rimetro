import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import TextoRevelado from "../ui/TextoRevelado";

export default function Hero() {
  return (
    <section className="relative flex h-screen w-full items-end overflow-hidden bg-gradient-to-b from-primary-surface to-base-1">
      <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />

      <div className="relative z-10 flex w-full flex-col gap-6 px-4 pb-16 sm:px-6 md:px-10 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-display-lg font-semibold leading-[0.9] tracking-tight text-white">
          <TextoRevelado texto="Pé-rímetro" />
        </h1>

        <div className="flex max-w-md flex-col gap-5 lg:pb-4">
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm text-texto-mute md:text-base"
          >
            O Pé-rímetro transforma a experiência de quem caminha pela cidade
            em dados estruturados: um mapa colaborativo do índice de
            caminhabilidade urbana.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              to="/app"
              className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-sm font-medium text-white transition-colors duration-base ease-reveal hover:bg-primary-hover"
            >
              Acessar o mapa
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-base-1 transition-transform duration-base ease-reveal group-hover:scale-110">
                <ArrowRight className="h-4 w-4 text-white" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
