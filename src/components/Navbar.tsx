import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <HeartHandshake className="h-8 w-8" />
          <span>FoodShare</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/#how-it-works" className="text-foreground hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link to="/#impact" className="text-foreground hover:text-primary transition-colors">
            Our Impact
          </Link>
          <Link to="/#about" className="text-foreground hover:text-primary transition-colors">
            About
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-hero">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
