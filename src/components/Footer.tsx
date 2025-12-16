import { Code2, Linkedin, Instagram, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <a href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">IT Karriere</span>
                <span className="text-xs text-primary-foreground/60 -mt-0.5">Remote Jobs</span>
              </div>
            </a>
            <p className="text-primary-foreground/70 text-sm max-w-md">
              Wir sind ein innovatives IT-Unternehmen mit Fokus auf digitale Transformation, 
              Prozessoptimierung und moderne Softwareentwicklung. Remote Work ist unsere DNA.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Schnellzugriff</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#jobs" className="hover:text-primary-foreground transition-colors">Stellenangebote</a></li>
              <li><a href="#team" className="hover:text-primary-foreground transition-colors">Unser Team</a></li>
              <li><a href="#benefits" className="hover:text-primary-foreground transition-colors">Benefits</a></li>
              <li><a href="#contact" className="hover:text-primary-foreground transition-colors">Kontakt</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>karriere@beispiel-it.de</li>
              <li>+49 123 456789-00</li>
              <li>Deutschland</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:karriere@beispiel-it.de" className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} IT Karriereportal. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary-foreground transition-colors">Impressum</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
