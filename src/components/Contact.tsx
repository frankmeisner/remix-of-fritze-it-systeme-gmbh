import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-up">
            <div className="gradient-hero p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                Bereit für den nächsten Schritt?
              </h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto">
                Wir freuen uns darauf, dich kennenzulernen. Kontaktiere uns für Fragen 
                oder sende uns direkt deine Bewerbung.
              </p>
            </div>

            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <a
                  href="mailto:karriere@beispiel.de"
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">E-Mail</p>
                  <p className="text-sm text-muted-foreground">karriere@beispiel.de</p>
                </a>

                <a
                  href="tel:+4912345678900"
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">Telefon</p>
                  <p className="text-sm text-muted-foreground">+49 123 456789-00</p>
                </a>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-foreground">Standorte</p>
                  <p className="text-sm text-muted-foreground">Deutschland</p>
                </div>
              </div>

              <div className="text-center">
                <Button variant="hero" size="xl">
                  Jetzt bewerben
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
