import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-28 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logo} alt="Fritze IT-Systeme Logo" className="h-24 w-auto object-contain" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Stellenangebote
          </a>
          <a href="/#team" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Team
          </a>
          <a href="/#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Benefits
          </a>
          <Link to="/ueber-uns" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Über uns
          </Link>
          <Button asChild size="sm">
            <a href="/#contact">Jetzt bewerben</a>
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            <a href="/#jobs" className="text-sm font-medium text-foreground py-2" onClick={() => setIsMenuOpen(false)}>
              Stellenangebote
            </a>
            <a href="/#team" className="text-sm font-medium text-foreground py-2" onClick={() => setIsMenuOpen(false)}>
              Team
            </a>
            <a href="/#benefits" className="text-sm font-medium text-foreground py-2" onClick={() => setIsMenuOpen(false)}>
              Benefits
            </a>
            <Link to="/ueber-uns" className="text-sm font-medium text-foreground py-2" onClick={() => setIsMenuOpen(false)}>
              Über uns
            </Link>
            <Button asChild className="w-full mt-2">
              <a href="/#contact" onClick={() => setIsMenuOpen(false)}>
                Jetzt bewerben
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
