import { JobCard } from "@/components/JobCard";
import { Search } from "lucide-react";

const jobs = [
  {
    title: "Digital Transformation Consultant (w/m/d)",
    description: "Begleitung unserer Kunden bei der agilen Optimierung ihrer Geschäftsprozesse. Analyse, Konzeption und Implementierung innovativer Lösungen.",
    location: "Süddeutschland",
    type: "Festanstellung",
    workModel: "Hybrides Arbeiten",
    department: "Beratung",
  },
  {
    title: "Digital Transformation Consultant (w/m/d)",
    description: "Begleitung unserer Kunden bei der agilen Optimierung ihrer Geschäftsprozesse. Analyse, Konzeption und Implementierung innovativer Lösungen.",
    location: "Westdeutschland",
    type: "Festanstellung",
    workModel: "Hybrides Arbeiten",
    department: "Beratung",
  },
  {
    title: "Softwareentwickler (w/m/d) - Webentwicklung",
    description: "Entwicklung von Webapplikationen mit modernen Technologien. Eigenverantwortliches Arbeiten nach DevOps-Prinzipien.",
    location: "Süddeutschland",
    type: "Festanstellung",
    workModel: "Hybrides Arbeiten",
    department: "IT & Entwicklung",
  },
];

export const JobListings = () => {
  return (
    <section id="jobs" className="py-20 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-up">
          <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full">
            Offene Stellen
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Finde deinen Traumjob
          </h2>
          <p className="text-muted-foreground">
            Entdecke unsere aktuellen Stellenangebote und werde Teil unseres Teams
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12 animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suche nach Position, Standort..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Job Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, index) => (
            <JobCard
              key={index}
              {...job}
              delay={200 + index * 100}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 animate-fade-up" style={{ animationDelay: "500ms" }}>
          <p className="text-muted-foreground mb-4">
            Keine passende Stelle gefunden?
          </p>
          <a
            href="#contact"
            className="text-primary font-semibold hover:underline"
          >
            Initiativbewerbung senden →
          </a>
        </div>
      </div>
    </section>
  );
};
