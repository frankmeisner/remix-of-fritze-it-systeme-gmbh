import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="py-20">
        <div className="container max-w-3xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            Impressum
          </h1>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-xl font-bold mb-4">Angaben gemäß § 5 TMG</h2>
              <p className="text-muted-foreground">
                Fritze IT GmbH<br />
                Willi-Eichler-Straße 26<br />
                37079 Göttingen<br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Handelsregister</h2>
              <p className="text-muted-foreground">
                Fritze Consulting & IT GmbH<br />
                Registergericht: Amtsgericht Rostock<br />
                Registernummer: HRB 11858<br />
                GLN: DEN1206V.HRB11858
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Umsatzsteuer-Identifikationsnummer</h2>
              <p className="text-muted-foreground">
                gemäß § 27a Umsatzsteuergesetz:<br />
                DE904735435
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Kontakt</h2>
              <p className="text-muted-foreground">
                E-Mail: info@fritze-it.solutions
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Rechtliche Hinweise</h2>
              <h3 className="text-lg font-semibold mb-2">Verantwortlich für den Inhalt</h3>
              <p className="text-muted-foreground">
                Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV (Medienstaatsvertrag):<br /><br />
                Dr. Jens Fritze<br />
                Willi-Eichler-Straße 26<br />
                37079 Göttingen
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Haftungsausschluss</h2>
              
              <h3 className="text-lg font-semibold mb-2">Haftung für Inhalte</h3>
              <p className="text-muted-foreground mb-4">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit 
                und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir 
                gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              </p>

              <h3 className="text-lg font-semibold mb-2">Haftung für Links</h3>
              <p className="text-muted-foreground mb-4">
                Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
                verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>

              <h3 className="text-lg font-semibold mb-2">Urheberrecht</h3>
              <p className="text-muted-foreground">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem 
                deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung 
                außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen 
                Autors bzw. Erstellers.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Impressum;
