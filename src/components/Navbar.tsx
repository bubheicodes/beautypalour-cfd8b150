import { ShoppingBag, Search, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-3xl font-display font-bold text-gradient">
              Lumière
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/shop" className="text-foreground hover:text-primary transition-colors">
              Shop
            </Link>
            <Link to="/new-arrivals" className="text-foreground hover:text-primary transition-colors">
              New Arrivals
            </Link>
            <Link to="/offers" className="text-foreground hover:text-primary transition-colors">
              Offers
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                0
              </span>
            </Button>
            
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-border">
            <Link to="/shop" className="block text-foreground hover:text-primary transition-colors">
              Shop
            </Link>
            <Link to="/new-arrivals" className="block text-foreground hover:text-primary transition-colors">
              New Arrivals
            </Link>
            <Link to="/offers" className="block text-foreground hover:text-primary transition-colors">
              Offers
            </Link>
            <Link to="/about" className="block text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <div className="flex space-x-4 pt-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
