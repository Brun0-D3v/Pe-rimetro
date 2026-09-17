import TextoRevelado from "../ui/TextoRevelado";

export default function Sobre() {
  return (
    <section id="sobre" className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h2 className="text-display-md font-semibold text-white">
        <TextoRevelado texto="Caminhabilidade, medida de verdade" className="justify-center" />
      </h2>
      <p className="mt-6 text-base text-texto-mute md:text-lg">
        Informações sobre calçadas, obstáculos e iluminação estão dispersas e
        não são comparáveis. O Pé-rímetro reúne avaliações colaborativas de
        quem caminha pela cidade num único índice, visualizável num mapa —
        parte da ODS 11, Cidades e Comunidades Sustentáveis.
      </p>
    </section>
  );
}
