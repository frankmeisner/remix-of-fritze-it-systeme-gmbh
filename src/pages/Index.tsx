import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { JobListings } from "@/components/JobListings";
import { Team } from "@/components/Team";
import { Benefits } from "@/components/Benefits";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <JobListings />
        <Team />
        <Benefits />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
