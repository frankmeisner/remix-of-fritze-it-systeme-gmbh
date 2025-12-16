import { Code2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center shadow-soft group-hover:shadow-card transition-shadow duration-200">
            <Code2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">
              IT Karriere
            </span>
            <span className="text-xs text-muted-foreground -mt-0.5">
              Remote Jobs
            </span>
          </div>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Stellenangebote
          </a>
          <a href="#team" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Team
          </a>
          <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Benefits
          </a>
          <Button asChild size="sm">
            <a href="#contact">Jetzt bewerben</a>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            <a 
              href="#jobs" 
              className="text-sm font-medium text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Stellenangebote
            </a>
            <a 
              href="#team" 
              className="text-sm font-medium text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Team
            </a>
            <a 
              href="#benefits" 
              className="text-sm font-medium text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Benefits
            </a>
            <Button asChild className="w-full mt-2">
              <a href="#contact" onClick={() => setIsMenuOpen(false)}>
                Jetzt bewerben
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
