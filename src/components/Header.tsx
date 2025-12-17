import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    }
  };

  const handleSectionClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    if (location.pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-28 items-center justify-between">
        <a href="/" onClick={handleLogoClick} className="flex items-center gap-2.5 group cursor-pointer">
          <img src={logo} alt="Fritze IT-Systeme Logo" className="h-24 w-auto object-contain" />
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/#jobs" onClick={(e) => handleSectionClick(e, "jobs")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Stellenangebote
          </a>
          <a href="/#team" onClick={(e) => handleSectionClick(e, "team")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Team
          </a>
          <a href="/#benefits" onClick={(e) => handleSectionClick(e, "benefits")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Benefits
          </a>
          <Link to="/ueber-uns" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Über uns
          </Link>
          <Button asChild size="sm">
            <a href="/#contact" onClick={(e) => handleSectionClick(e, "contact")}>Jetzt bewerben</a>
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
            <a href="/#jobs" onClick={(e) => handleSectionClick(e, "jobs")} className="text-sm font-medium text-foreground py-2">
              Stellenangebote
            </a>
            <a href="/#team" onClick={(e) => handleSectionClick(e, "team")} className="text-sm font-medium text-foreground py-2">
              Team
            </a>
            <a href="/#benefits" onClick={(e) => handleSectionClick(e, "benefits")} className="text-sm font-medium text-foreground py-2">
              Benefits
            </a>
            <Link to="/ueber-uns" className="text-sm font-medium text-foreground py-2" onClick={() => setIsMenuOpen(false)}>
              Über uns
            </Link>
            <Button asChild className="w-full mt-2">
              <a href="/#contact" onClick={(e) => handleSectionClick(e, "contact")}>
                Jetzt bewerben
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
