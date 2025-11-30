import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Heart, Leaf } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "Families Supported",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    value: "2.5K+",
    label: "Meals Donated",
    color: "text-secondary",
  },
  {
    icon: Heart,
    value: "150+",
    label: "Active Donors",
    color: "text-accent",
  },
  {
    icon: Leaf,
    value: "1.2 Tons",
    label: "Food Waste Reduced",
    color: "text-primary",
  },
];

const Impact = () => {
  return (
    <section id="impact" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Our Growing Impact
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Together, we're making a real difference in fighting hunger across Kenya
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index}
                className="border-border shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="pt-8 text-center">
                  <Icon className={`h-12 w-12 mx-auto mb-4 ${stat.color}`} />
                  <div className="text-4xl font-bold mb-2 text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Impact;
