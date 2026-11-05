import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AlterarSenha from "../components/perfil/AlterarSenha";
import AtalhosAdmin from "../components/perfil/AtalhosAdmin";
import DadosConta from "../components/perfil/DadosConta";
import MinhasAvaliacoes from "../components/perfil/MinhasAvaliacoes";
import ResumoAtividade from "../components/perfil/ResumoAtividade";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export default function Perfil() {
  const { usuario, ehAdmin, sair } = useAuth();
  const navegar = useNavigate();

  if (!usuario) return null;

  function sairDaConta() {
    sair();
    navegar("/", { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-texto">Meu perfil</h1>
      <ResumoAtividade />
      <DadosConta />
      <MinhasAvaliacoes />
      <AlterarSenha />
      {ehAdmin && <AtalhosAdmin />}
      <div>
        <Button variante="secundario" onClick={sairDaConta}>
          <LogOut size={16} />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
