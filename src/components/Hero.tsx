import { ArrowDown, Users, Rocket, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl space-y-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm text-primary-foreground">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            Wir suchen Verstärkung
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight">
            Gestalte mit uns die{" "}
            <span className="text-secondary">digitale Zukunft</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed">
            Werde Teil eines innovativen Teams und arbeite an spannenden Projekten 
            im Bereich der digitalen Transformation. Deine Expertise zählt bei uns.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" size="xl" asChild>
              <a href="#jobs">
                Offene Stellen entdecken
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#benefits">
                Mehr erfahren
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap gap-8 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">50+</p>
                <p className="text-sm text-primary-foreground/70">Mitarbeiter</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">100+</p>
                <p className="text-sm text-primary-foreground/70">Projekte</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">15+</p>
                <p className="text-sm text-primary-foreground/70">Jahre Erfahrung</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#jobs" className="flex flex-col items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
          <span className="text-sm font-medium">Weiter scrollen</span>
          <ArrowDown className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};
