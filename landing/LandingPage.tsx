'use client';

import ButtonGradient from "@/landing/assets/svg/ButtonGradient";
import Benefits from "@/landing/components/Benefits";
import Collaboration from "@/landing/components/Collaboration";
import Footer from "@/landing/components/Footer";
import Header from "@/landing/components/Header";
import Hero from "@/landing/components/Hero";
import Pricing from "@/landing/components/Pricing";
import Roadmap from "@/landing/components/Roadmap";
import Services from "@/landing/components/Services";

const LandingPage = () => {
  return (
    <div className="landing-page relative bg-n-8 text-n-1">
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Header />
        <Hero />
        <Benefits />
        <Collaboration />
        <Services />
        <Pricing />
        <Roadmap />
        <Footer />
      </div>

      <ButtonGradient />
    </div>
  );
};

export default LandingPage;

