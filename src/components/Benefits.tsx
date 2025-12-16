import { Home, GraduationCap, Heart, Clock, Users, Trophy, Laptop, Coffee } from "lucide-react";

const benefits = [
  {
    icon: Home,
    title: "100% Homeoffice möglich",
    description: "Arbeite von überall – ob zu Hause, im Café oder auf Reisen",
  },
  {
    icon: Laptop,
    title: "Moderne Ausstattung",
    description: "Top-Hardware und ergonomische Homeoffice-Einrichtung auf uns",
  },
  {
    icon: Clock,
    title: "Flexible Arbeitszeiten",
    description: "Vertrauensarbeitszeit und freie Zeiteinteilung für deine Balance",
  },
  {
    icon: GraduationCap,
    title: "Weiterbildungsbudget",
    description: "Individuelles Entwicklungsbudget für Kurse und Zertifizierungen",
  },
  {
    icon: Heart,
    title: "30+ Urlaubstage",
    description: "Genug Zeit für Erholung, Familie und persönliche Projekte",
  },
  {
    icon: Users,
    title: "Starkes Remote-Team",
    description: "Regelmäßige virtuelle Events und Team-Offsites",
  },
  {
    icon: Coffee,
    title: "Homeoffice-Zuschuss",
    description: "Monatlicher Zuschuss für Internet, Strom und Kaffee",
  },
  {
    icon: Trophy,
    title: "Spannende IT-Projekte",
    description: "Innovative Aufgaben bei namhaften Kunden",
  },
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-20 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-up">
          <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-4 py-1.5 rounded-full">
            Benefits
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Warum bei uns arbeiten?
          </h2>
          <p className="text-muted-foreground">
            Remote Work ist bei uns kein Trend, sondern gelebte Unternehmenskultur
          </p>
        </div>

        {/* Feature Image */}
        <div className="relative max-w-4xl mx-auto mb-16 rounded-2xl overflow-hidden shadow-elevated animate-fade-up">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=500&fit=crop"
            alt="Team Meeting"
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 md:right-auto md:max-w-lg">
            <h3 className="text-xl md:text-2xl font-bold text-primary-foreground mb-2">
              Flexibilität trifft auf Teamgeist
            </h3>
            <p className="text-primary-foreground/80 text-sm md:text-base">
              Bei uns arbeiten IT-Experten, Berater und Entwickler Hand in Hand – 
              standortunabhängig und dennoch eng vernetzt.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card rounded-xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${100 + index * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
