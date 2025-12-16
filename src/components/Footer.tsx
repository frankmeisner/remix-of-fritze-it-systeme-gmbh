import { Briefcase } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 bg-foreground text-background">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Karriereportal</span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">
              Impressum
            </a>
            <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">
              Datenschutz
            </a>
          </nav>

          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Alle Rechte vorbehalten
          </p>
        </div>
      </div>
    </footer>
  );
};
