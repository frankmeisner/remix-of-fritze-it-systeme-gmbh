import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Building2, Calendar, Clock, Mail, MapPin, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";

const UeberUns = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container max-w-4xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Über uns
          </h1>

          <div className="space-y-8">
            {/* Company Introduction */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Fritze IT GmbH</h2>
                  <p className="text-muted-foreground">
                    Ihr Partner für Prozessoptimierung seit 2011
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Die Fritze IT GmbH ist ein innovatives IT-Unternehmen mit Fokus auf <strong>Prozessoptimierung</strong>. 
                Seit unserer Gründung im Jahr 2011 unterstützen wir Unternehmen dabei, ihre Geschäftsprozesse 
                effizienter zu gestalten und die digitale Transformation erfolgreich zu meistern.
              </p>
            </section>

            {/* What we do */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Unsere Expertise</h2>
                  <p className="text-muted-foreground">
                    Prozessoptimierung ist unser Kerngeschäft
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Wir analysieren bestehende Abläufe, identifizieren Verbesserungspotenziale und implementieren 
                maßgeschneiderte Lösungen, die Ihrem Unternehmen helfen, Zeit und Ressourcen zu sparen.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Analyse und Bewertung von Geschäftsprozessen
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Entwicklung von Optimierungsstrategien
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Implementierung effizienter Workflows
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Begleitung bei der digitalen Transformation
                </li>
              </ul>
            </section>

            {/* Remote First */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Remote First</h2>
                  <p className="text-muted-foreground">
                    Modernes Arbeiten ist bei uns Standard
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Wir leben die Zukunft der Arbeit: 100% Remote. Unsere Mitarbeiter arbeiten von überall aus 
                und genießen maximale Flexibilität bei voller Produktivität. Diese Erfahrung geben wir 
                auch an unsere Kunden weiter.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <h2 className="text-xl font-bold mb-6">Kontaktinformationen</h2>
              
              <div className="grid md:grid-cols-4 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Adresse</p>
                    <p className="text-muted-foreground text-sm">
                      Willi-Eichler-Straße 26<br />
                      37079 Göttingen<br />
                      Deutschland
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">E-Mail</p>
                    <p className="text-muted-foreground text-sm">info@fritze-it.solutions</p>
                    <p className="text-muted-foreground text-sm">bewerbung@fritze-it.solutions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Bürozeiten</p>
                    <p className="text-muted-foreground text-sm">
                      Mo-Fr: 8:00 - 17:00 Uhr<br />
                      Sa: 9:00 - 12:00 Uhr
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Gegründet</p>
                    <p className="text-muted-foreground text-sm">2011</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UeberUns;
