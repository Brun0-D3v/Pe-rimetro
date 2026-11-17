import ListaModeracao from "../components/moderacao/ListaModeracao";

export default function Moderacao() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-texto">Moderação</h1>
      <ListaModeracao />
    </div>
  );
}
