import { Briefcase } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow duration-200">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Karriereportal
          </span>
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Stellenangebote
          </a>
          <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Benefits
          </a>
          <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Kontakt
          </a>
        </nav>
      </div>
    </header>
  );
};
