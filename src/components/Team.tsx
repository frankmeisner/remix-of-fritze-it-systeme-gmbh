import { Linkedin, Mail } from "lucide-react";

const teamMembers = [
  {
    name: "Dr. Jens Fritze",
    role: "Geschäftsführer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    description: "20+ Jahre Erfahrung in IT-Strategieberatung",
    email: "j.fritze@fritze-it.solutions",
  },
  {
    name: "Sarah Weber",
    role: "Leiterin Consulting",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop&crop=face&facepad=2",
    description: "Expertin für digitale Transformation",
    email: "s.weber@fritze-it.solutions",
  },
  {
    name: "Thomas Müller",
    role: "Lead Developer",
    image: "https://images.unsplash.com/photo-1548372290-8d01b6c8e78c?w=400&h=500&fit=crop&crop=face&facepad=2",
    description: "Full-Stack Entwicklung & Cloud-Architektur",
    email: "t.mueller@fritze-it.solutions",
  },
  {
    name: "Lisa Hoffmann",
    role: "HR & People Manager",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    description: "Ihr erster Ansprechpartner für Bewerbungen",
    email: "l.hoffmann@fritze-it.solutions",
  },
  {
    name: "Jan Becker",
    role: "Senior Consultant",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop&crop=face&facepad=2",
    description: "Prozessoptimierung & Projektmanagement",
    email: "j.becker@fritze-it.solutions",
  },
  {
    name: "Anna Fischer",
    role: "UX/UI Designerin",
    image: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=400&fit=crop&crop=face",
    description: "User Experience & Interface Design",
    email: "a.fischer@fritze-it.solutions",
  },
];

export const Team = () => {
  return (
    <section id="team" className="py-20 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-up">
          <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-4 py-1.5 rounded-full">
            Unser Team
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Die Menschen hinter dem Erfolg</h2>
          <p className="text-muted-foreground">
            Lerne unser erfahrenes Team kennen – gemeinsam gestalten wir die digitale Zukunft
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${100 + index * 100}ms` }}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="text-white/90 font-medium">{member.role}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-muted-foreground text-sm mb-4">{member.description}</p>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center cursor-default">
                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <a
                    href={`mailto:${member.email}`}
                    className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title={member.email}
                  >
                    <Mail className="w-4 h-4 text-primary" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
