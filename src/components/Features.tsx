import { Card, CardContent } from "@/components/ui/card";
import donateIcon from "@/assets/icon-donate.png";
import deliverIcon from "@/assets/icon-deliver.png";
import receiveIcon from "@/assets/icon-receive.png";

const features = [
  {
    icon: donateIcon,
    title: "Donate Surplus Food",
    description: "Restaurants and individuals can easily post available food for donation through our platform.",
  },
  {
    icon: deliverIcon,
    title: "Fast Delivery",
    description: "Integrated with local delivery services to ensure quick and efficient food distribution.",
  },
  {
    icon: receiveIcon,
    title: "Request & Receive",
    description: "Families and food banks can browse and request food donations based on their needs.",
  },
];

const Features = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            How FoodShare Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A simple, efficient platform connecting surplus food with those in need
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="border-border shadow-card hover:shadow-soft transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur"
            >
              <CardContent className="pt-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-hero p-4 shadow-soft">
                  <img 
                    src={feature.icon} 
                    alt={feature.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
