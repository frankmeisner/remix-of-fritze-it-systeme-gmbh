import { Mail, Phone, MapPin, Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Create mailto link with form data
    const subject = encodeURIComponent(`Bewerbung: ${formData.position || "Initiativbewerbung"}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nE-Mail: ${formData.email}\nTelefon: ${formData.phone}\n\nGewünschte Position: ${formData.position || "Initiativbewerbung"}\n\nNachricht:\n${formData.message}`
    );
    
    window.location.href = `mailto:karriere@beispiel-it.de?subject=${subject}&body=${body}`;
    
    toast.success("E-Mail-Programm wird geöffnet...");
    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-up">
            <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              Jetzt bewerben
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Bereit für den nächsten Schritt?
            </h2>
            <p className="text-muted-foreground">
              Sende uns deine Bewerbung – wir freuen uns darauf, dich kennenzulernen
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6 animate-fade-up">
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <h3 className="font-bold text-foreground mb-4">Kontaktinformationen</h3>
                
                <div className="space-y-4">
                  <a
                    href="mailto:karriere@beispiel-it.de"
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">E-Mail</p>
                      <p className="text-muted-foreground text-sm">karriere@beispiel-it.de</p>
                    </div>
                  </a>

                  <a
                    href="tel:+4912345678900"
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Telefon</p>
                      <p className="text-muted-foreground text-sm">+49 123 456789-00</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Standort</p>
                      <p className="text-muted-foreground text-sm">Deutschland (Remote möglich)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="relative h-48 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                  alt="Team bei der Arbeit"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-primary-foreground text-sm font-medium">
                    Werde Teil unseres Teams
                  </p>
                </div>
              </div>
            </div>

            {/* Application Form */}
            <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 shadow-soft">
                <h3 className="font-bold text-foreground mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Bewerbungsformular
                </h3>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Max Mustermann"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      E-Mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="max@beispiel.de"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="+49 123 456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Gewünschte Position
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="">Position auswählen</option>
                      <option value="Consultant Geschäftsoptimierung">Consultant Geschäftsoptimierung</option>
                      <option value="Assistenz der Geschäftsführung">Assistenz der Geschäftsführung</option>
                      <option value="Softwareentwickler">Softwareentwickler</option>
                      <option value="Initiativbewerbung">Initiativbewerbung</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nachricht / Anschreiben *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    placeholder="Erzählen Sie uns von sich und warum Sie Teil unseres Teams werden möchten..."
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Upload className="w-5 h-5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Hinweis zu Unterlagen</p>
                      <p>Bitte fügen Sie Ihren Lebenslauf und Zeugnisse als Anhang in der E-Mail hinzu.</p>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Wird gesendet..." : "Bewerbung per E-Mail senden"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
