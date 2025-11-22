'use client';

import dynamic from 'next/dynamic';
import ButtonGradient from "@/landing/assets/svg/ButtonGradient";
import Header from "@/landing/components/Header";
import Hero from "@/landing/components/Hero";

// Lazy load below-the-fold components
const Benefits = dynamic(() => import("@/landing/components/Benefits"), {
  loading: () => <div className="min-h-[500px]" />,
});

const Collaboration = dynamic(() => import("@/landing/components/Collaboration"), {
  loading: () => <div className="min-h-[400px]" />,
});

const Services = dynamic(() => import("@/landing/components/Services"), {
  loading: () => <div className="min-h-[600px]" />,
});

const Pricing = dynamic(() => import("@/landing/components/Pricing"), {
  loading: () => <div className="min-h-[500px]" />,
});

const Roadmap = dynamic(() => import("@/landing/components/Roadmap"), {
  loading: () => <div className="min-h-[500px]" />,
});

const AgentsCarousel = dynamic(() => import("@/landing/components/AgentsCarousel"), {
  loading: () => <div className="min-h-[600px]" />,
});

const Footer = dynamic(() => import("@/landing/components/Footer"), {
  loading: () => <div className="min-h-[200px]" />,
});

const LandingPage = () => {
  return (
    <div className="landing-page relative bg-n-8 text-n-1">
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Header />
        <Hero />
        <Benefits />
        <AgentsCarousel />
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

