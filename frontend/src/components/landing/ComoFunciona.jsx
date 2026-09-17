import TextoRevelado from "../ui/TextoRevelado";

const dimensoes = [
  { nome: "Calçada", peso: "25%" },
  { nome: "Acessibilidade", peso: "25%" },
  { nome: "Iluminação", peso: "15%" },
  { nome: "Arborização", peso: "15%" },
  { nome: "Travessias", peso: "10%" },
  { nome: "Mobiliário", peso: "10%" },
];

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
      <h2 className="text-center text-display-md font-semibold text-white">
        <TextoRevelado texto="Seis dimensões, um índice" className="justify-center" />
      </h2>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {dimensoes.map((dimensao) => (
          <div
            key={dimensao.nome}
            className="rounded-2xl border border-base-4 bg-base-3 p-6 text-center"
          >
            <p className="text-2xl font-semibold text-primary-light">{dimensao.peso}</p>
            <p className="mt-2 text-sm text-texto-mute">{dimensao.nome}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
