import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-up">
      <div className="container max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Cookie className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Wir verwenden Cookies
              </h3>
              <p className="text-sm text-muted-foreground">
                Diese Website verwendet Cookies, um Ihnen das beste Erlebnis zu bieten. 
                Mehr Informationen finden Sie in unserer{" "}
                <Link 
                  to="/datenschutz" 
                  className="text-primary hover:underline"
                >
                  Datenschutzerklärung
                </Link>.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={handleDecline}
                className="w-full sm:w-auto"
              >
                Ablehnen
              </Button>
              <Button 
                variant="default" 
                onClick={handleAccept}
                className="w-full sm:w-auto"
              >
                Akzeptieren
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
