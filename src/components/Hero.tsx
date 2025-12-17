import { ArrowDown, Users, Rocket, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
export const Hero = () => {
  return <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1920&h=1080&fit=crop" alt="Modern office workspace" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse hidden lg:block" />
      <div className="absolute bottom-40 right-40 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse hidden lg:block" />

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl space-y-8 animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 text-sm text-primary-foreground">
            Fritze IT-Systeme GmbH
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight">
            Arbeite von überall.{" "}
            <span className="text-secondary">Wachse mit uns.</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed">
            Wir sind ein innovatives IT-Unternehmen mit Fokus auf Digitalisierung und 
            Prozessoptimierung. Bei uns arbeitest du flexibel im Homeoffice und gestaltest 
            die digitale Zukunft unserer Kunden.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" size="xl" asChild>
              <a href="#jobs">
                Offene Stellen entdecken
              </a>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <a href="#team">
                Team kennenlernen
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Wifi className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">100%</p>
                <p className="text-sm text-primary-foreground/70">Remote möglich</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">50+</p>
                <p className="text-sm text-primary-foreground/70">Mitarbeiter</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-foreground">15+</p>
                <p className="text-sm text-primary-foreground/70">Jahre Erfahrung</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Image Overlay */}
      <div className="absolute right-0 bottom-0 w-1/3 h-full hidden xl:block">
        <div className="absolute bottom-0 right-0 w-full h-2/3">
          <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=1000&fit=crop" alt="Team collaboration" className="w-full h-full object-cover rounded-tl-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent rounded-tl-3xl" />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#jobs" className="flex flex-col items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
          <span className="text-sm font-medium">Weiter scrollen</span>
          <ArrowDown className="w-5 h-5" />
        </a>
      </div>
    </section>;
};