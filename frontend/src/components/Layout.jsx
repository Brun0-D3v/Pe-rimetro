import { Outlet } from "react-router-dom";
import AppNavbar from "./AppNavbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-base-2">
      <AppNavbar />
      <main className="px-4 pb-8 pt-24 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
