import ComoFunciona from "../components/landing/ComoFunciona";
import Hero from "../components/landing/Hero";
import LandingNavbar from "../components/landing/LandingNavbar";
import Sobre from "../components/landing/Sobre";

export default function Landing() {
  return (
    <div className="min-h-screen bg-base-1">
      <LandingNavbar />
      <Hero />
      <Sobre />
      <ComoFunciona />
    </div>
  );
}
