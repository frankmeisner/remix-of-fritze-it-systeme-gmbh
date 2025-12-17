import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Shield, Lock, FileText, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Datenschutz = () => {
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

          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Datenschutz
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground mb-8">
            Datenschutzerklärung – Informationen zum Schutz Ihrer persönlichen Daten gemäß DSGVO
          </p>

          <div className="space-y-8 text-foreground">
            {/* Einleitung */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <h2 className="text-xl font-bold mb-4">Einleitung</h2>
              <p className="text-muted-foreground leading-relaxed">
                Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Diese Datenschutzerklärung 
                informiert Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf unserer 
                Website sowie über Ihre Rechte als betroffene Person.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Diese Datenschutzerklärung basiert auf den Vorgaben der EU-Datenschutz-Grundverordnung (DSGVO) 
                und des deutschen Bundesdatenschutzgesetzes (BDSG).
              </p>
            </section>

            {/* Verantwortlicher */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <h2 className="text-xl font-bold mb-4">Verantwortlicher</h2>
              
              <h3 className="text-lg font-semibold mb-3">Kontaktdaten</h3>
              <div className="text-muted-foreground mb-6">
                <p className="font-medium text-foreground">Verantwortlicher:</p>
                <p>Fritze IT GmbH</p>
                <p>Willi-Eichler-Straße 26</p>
                <p>37079 Göttingen</p>
                <p>Deutschland</p>
              </div>

              <div className="text-muted-foreground mb-6">
                <p className="font-medium text-foreground">Geschäftsführer:</p>
                <p>Jens Fritze</p>
              </div>

              <h3 className="text-lg font-semibold mb-3">Kontaktmöglichkeiten</h3>
              <div className="text-muted-foreground">
                <p>info@fritze-it.solutions</p>
                <p>Willi-Eichler-Straße 26</p>
                <p>37079 Göttingen</p>
              </div>
            </section>

            {/* Datenerhebung */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Erhebung und Verarbeitung personenbezogener Daten</h2>
              </div>
              
              <h3 className="text-lg font-semibold mb-3">Automatisch erfasste Daten</h3>
              <p className="text-muted-foreground mb-4">
                Beim Besuch unserer Website werden automatisch folgende Informationen erfasst:
              </p>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  IP-Adresse des zugreifenden Rechners
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Datum und Uhrzeit des Zugriffs
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Name und URL der abgerufenen Datei
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Übertragene Datenmenge
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Meldung über erfolgreichen Abruf
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Browsertyp und -version
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Betriebssystem des Nutzers
                </li>
              </ul>

              <h3 className="text-lg font-semibold mb-3">Kontaktformular</h3>
              <p className="text-muted-foreground mb-4">
                Bei der Nutzung unseres Kontaktformulars werden folgende Daten verarbeitet:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Name
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  E-Mail-Adresse
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Betreff
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  Nachricht
                </li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Diese Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben.
              </p>
            </section>

            {/* Rechtsgrundlagen */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <h2 className="text-xl font-bold mb-4">Rechtsgrundlagen der Datenverarbeitung</h2>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Art. 6 Abs. 1 lit. a DSGVO</p>
                  <p>Einwilligung des Betroffenen für die Verarbeitung seiner personenbezogenen Daten</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Art. 6 Abs. 1 lit. b DSGVO</p>
                  <p>Verarbeitung ist für die Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen erforderlich</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Art. 6 Abs. 1 lit. f DSGVO</p>
                  <p>Verarbeitung ist zur Wahrung der berechtigten Interessen des Verantwortlichen oder eines Dritten erforderlich</p>
                </div>
              </div>
            </section>

            {/* Datensicherheit */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Datensicherheit</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen 
                Manipulation, Verlust, Zerstörung oder gegen den Zugriff unberechtigter Personen zu schützen.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Technische Maßnahmen</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      SSL/TLS-Verschlüsselung
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Firewall-Schutz
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Regelmäßige Sicherheitsupdates
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Organisatorische Maßnahmen</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Zugangsbeschränkungen
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Schulung der Mitarbeiter
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      Dokumentierte Prozesse
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Ihre Rechte */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold">Ihre Rechte als betroffene Person</h2>
              </div>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <p className="font-medium text-foreground">Auskunftsrecht</p>
                  <p>Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten Daten zu erhalten.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Recht auf Berichtigung</p>
                  <p>Sie können die Berichtigung unrichtiger personenbezogener Daten verlangen.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Recht auf Löschung</p>
                  <p>Sie können die Löschung Ihrer personenbezogenen Daten verlangen.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Recht auf Datenübertragbarkeit</p>
                  <p>Sie können die Übertragung Ihrer Daten in einem strukturierten Format verlangen.</p>
                </div>
              </div>
            </section>

            {/* Kontakt */}
            <section className="bg-card rounded-2xl p-8 shadow-soft">
              <h2 className="text-xl font-bold mb-4">Kontakt bei Fragen</h2>
              <p className="text-muted-foreground mb-4">
                Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich gerne an uns wenden:
              </p>
              <div className="flex gap-4">
                <Link 
                  to="/impressum" 
                  className="text-primary hover:underline font-medium"
                >
                  Impressum
                </Link>
                <Link 
                  to="/#contact" 
                  className="text-primary hover:underline font-medium"
                >
                  Kontakt aufnehmen
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Datenschutz;
