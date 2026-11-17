import { Link } from "react-router-dom";
import Card from "../ui/Card";

export default function AtalhosAdmin() {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-texto">Administração</h2>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        <li>
          <Link to="/app/dashboard" className="font-medium text-primary-light hover:underline">
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/app/moderacao" className="font-medium text-primary-light hover:underline">
            Fila de moderação
          </Link>
        </li>
      </ul>
    </Card>
  );
}
