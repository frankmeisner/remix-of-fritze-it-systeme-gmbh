import { MapPin, Briefcase, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  title: string;
  description: string;
  location: string;
  type: string;
  workModel: string;
  department?: string;
  delay?: number;
}

export const JobCard = ({
  title,
  description,
  location,
  type,
  workModel,
  department,
  delay = 0,
}: JobCardProps) => {
  return (
    <article
      className="group relative bg-card rounded-xl border border-border p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Briefcase className="w-3.5 h-3.5" />
            {type}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {workModel}
          </span>
          {department && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
              <Building2 className="w-3.5 h-3.5" />
              {department}
            </span>
          )}
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            Details ansehen
          </Button>
        </div>
      </div>
    </article>
  );
};
