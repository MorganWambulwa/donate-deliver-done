import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-foodshare.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
            Fighting Hunger,
            <span className="block text-transparent bg-clip-text bg-gradient-hero">
              One Meal at a Time
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            Connect surplus food from restaurants and donors with those who need it most. 
            Together, we're building a zero hunger community across Kenya.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="bg-gradient-hero hover:opacity-90 text-lg px-8 py-6 shadow-soft group"
              >
                Start Donating
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-primary hover:bg-primary hover:text-primary-foreground"
              >
                Request Food
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex gap-8 text-sm">
            <div>
              <div className="text-3xl font-bold text-primary">2.5K+</div>
              <div className="text-muted-foreground">Meals Donated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary">150+</div>
              <div className="text-muted-foreground">Active Donors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">500+</div>
              <div className="text-muted-foreground">Families Helped</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
