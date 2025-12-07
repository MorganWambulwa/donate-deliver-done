import { HeartHandshake, Mail, MapPin, Phone } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer id="about" className="bg-muted/30 border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-primary mb-4">
              <HeartHandshake className="h-8 w-8" />
              <span>FoodShare</span>
            </Link>
            <p className="text-muted-foreground mb-4">
              Fighting hunger by connecting surplus food with those who need it most.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <button 
                  onClick={() => scrollToSection("how-it-works")} 
                  className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("impact")} 
                  className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Our Impact
                </button>
              </li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Donate Food</Link></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Request Food</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">About</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <button 
                  onClick={() => scrollToSection("about")} 
                  className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Our Mission
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("about")} 
                  className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Team
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("about")} 
                  className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Partners
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("about")} 
                  className="hover:text-primary transition-colors bg-transparent border-none cursor-pointer p-0"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">Contact Us</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <span>hello@foodshare.ke</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span>+254 700 000 000</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 FoodShare Kenya. All rights reserved. Built with ❤️ for Zero Hunger.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
