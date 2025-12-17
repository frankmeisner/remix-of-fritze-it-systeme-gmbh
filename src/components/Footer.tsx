import { Mail, Phone, MapPin, Clock, Briefcase, Shield, Cloud, Code, Headphones, Users, Twitter, Linkedin, Server, Lock, Cog } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      scrollToTop();
    }
  };

  const handleSectionClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handlePageClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-white">
      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <a href="/" onClick={handleLogoClick} className="flex items-center gap-2.5 mb-4 cursor-pointer">
              <img src={logo} alt="Fritze IT-Systeme Logo" className="h-12 w-auto dark:brightness-0 dark:invert" />
            </a>
            <p className="text-white/70 text-sm leading-relaxed">
              Fritze IT GmbH – Ihr Partner für Prozessoptimierung und digitale Transformation seit 2011.
            </p>
            <div className="mt-6 space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white/40" />
                <span>Willi-Eichler-Straße 26, 37079 Göttingen</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/40" />
                <span>info@fritze-it.solutions</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/40" />
                <span>Telefon auf Anfrage</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                <div>
                  <p>Mo-Fr: 8:00 - 17:00 Uhr</p>
                  <p>Sa: 9:00 - 12:00 Uhr</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schnellzugriff */}
          <div>
            <h4 className="font-semibold mb-5 text-primary">Schnellzugriff</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li>
                <a href="/#jobs" onClick={(e) => handleSectionClick(e, 'jobs')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <Briefcase className="w-4 h-4" />
                  Stellenangebote
                </a>
              </li>
              <li>
                <a href="/#team" onClick={(e) => handleSectionClick(e, 'team')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Unser Team
                </a>
              </li>
              <li>
                <a href="/#benefits" onClick={(e) => handleSectionClick(e, 'benefits')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <Shield className="w-4 h-4" />
                  Benefits
                </a>
              </li>
              <li>
                <a href="/#contact" onClick={(e) => handleSectionClick(e, 'contact')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Kontakt
                </a>
              </li>
              <li>
                <a href="/ueber-uns" onClick={(e) => handlePageClick(e, '/ueber-uns')} className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Über uns
                </a>
              </li>
            </ul>
          </div>

          {/* Leistungen */}
          <div>
            <h4 className="font-semibold mb-5 text-primary">Leistungen</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                IT-Infrastruktur
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                IT-Sicherheit
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                Cloud-Lösungen
              </li>
              <li className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Software-Entwicklung
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                24/7 Support
              </li>
              <li className="flex items-center gap-2">
                <Cog className="w-4 h-4" />
                Consulting
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h4 className="font-semibold mb-5 text-primary">Kontakt & Social</h4>
            <p className="text-sm text-white/70 mb-4">
              Folgen Sie uns und bleiben Sie informiert.
            </p>
            <div className="flex gap-3 mb-6">
              <span 
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-default"
                title="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </span>
              <span 
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-default"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </span>
              <a 
                href="mailto:info@fritze-it.solutions" 
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="E-Mail"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-1">Bewerbungen an:</p>
              <p className="text-sm text-white/70">bewerbung@fritze-it.solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-white/10" />

      {/* Bottom Bar */}
      <div className="container py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <a href="/" onClick={handleLogoClick} className="cursor-pointer">
              <img src={logo} alt="Fritze IT-Systeme Logo" className="h-8 w-auto dark:brightness-0 dark:invert opacity-60" />
            </a>
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} Fritze IT GmbH. Alle Rechte vorbehalten.
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="/impressum" onClick={(e) => handlePageClick(e, '/impressum')} className="text-white/50 hover:text-white transition-colors cursor-pointer">
              Impressum
            </a>
            <a href="/datenschutz" onClick={(e) => handlePageClick(e, '/datenschutz')} className="text-white/50 hover:text-white transition-colors cursor-pointer">
              Datenschutz
            </a>
            <a href="/ueber-uns" onClick={(e) => handlePageClick(e, '/ueber-uns')} className="text-white/50 hover:text-white transition-colors cursor-pointer">
              Über uns
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};