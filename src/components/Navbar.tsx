import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeartHandshake } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const scrollToSection = (sectionId: string) => {
    // If we're not on the home page, navigate there first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
          <HeartHandshake className="h-8 w-8" />
          <span>FoodShare</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => scrollToSection("how-it-works")} 
            className="text-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            How It Works
          </button>
          <button 
            onClick={() => scrollToSection("impact")} 
            className="text-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            Our Impact
          </button>
          <button 
            onClick={() => scrollToSection("about")} 
            className="text-foreground hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            About
          </button>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="bg-gradient-hero">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-hero">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
