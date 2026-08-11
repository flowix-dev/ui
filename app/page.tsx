import MarketingNavbar from "@/components/marketing/MarketingNavbar";
import Hero from "@/components/marketing/Hero";
import Features from "@/components/marketing/Features";
import CodeSection from "@/components/marketing/CodeSection";
import CtaBand from "@/components/marketing/CtaBand";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <MarketingNavbar />
      <main>
        <Hero />
        <Features />
        <CodeSection />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
