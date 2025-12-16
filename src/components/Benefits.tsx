import { Laptop, GraduationCap, Heart, Clock, Users, Trophy } from "lucide-react";

const benefits = [
  {
    icon: Laptop,
    title: "Flexible Arbeitsmodelle",
    description: "Hybrides Arbeiten und flexible Arbeitszeiten für deine Work-Life-Balance",
  },
  {
    icon: GraduationCap,
    title: "Weiterbildung",
    description: "Individuelle Entwicklungsmöglichkeiten und gezielte Förderung",
  },
  {
    icon: Heart,
    title: "Wertschätzende Kultur",
    description: "Teamgeist, offene Kommunikation und gegenseitiger Respekt",
  },
  {
    icon: Clock,
    title: "30 Tage Urlaub",
    description: "Genug Zeit für Erholung und persönliche Projekte",
  },
  {
    icon: Users,
    title: "Starkes Team",
    description: "Kollegiales Umfeld mit flachen Hierarchien",
  },
  {
    icon: Trophy,
    title: "Spannende Projekte",
    description: "Innovative Aufgaben mit neuesten Technologien",
  },
];

export const Benefits = () => {
  return (
    <section id="benefits" className="py-20 bg-muted/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-up">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
            Warum wir?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Deine Vorteile bei uns
          </h2>
          <p className="text-muted-foreground">
            Wir bieten dir mehr als nur einen Job
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group bg-card rounded-xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${100 + index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
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
