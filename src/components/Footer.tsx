import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-display font-bold text-gradient mb-4">
              Lumière
            </h3>
            <p className="text-muted-foreground mb-6">
              Premium beauty products crafted with natural ingredients for radiant, healthy skin.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/new-arrivals" className="text-muted-foreground hover:text-primary transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/shop?category=skincare" className="text-muted-foreground hover:text-primary transition-colors">
                  Skincare
                </Link>
              </li>
              <li>
                <Link to="/shop?category=makeup" className="text-muted-foreground hover:text-primary transition-colors">
                  Makeup
                </Link>
              </li>
              <li>
                <Link to="/shop?category=fragrance" className="text-muted-foreground hover:text-primary transition-colors">
                  Fragrance
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-muted-foreground hover:text-primary transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="text-muted-foreground hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="text-muted-foreground hover:text-primary transition-colors">
                  Size Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/our-story" className="text-muted-foreground hover:text-primary transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-muted-foreground hover:text-primary transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-muted-foreground hover:text-primary transition-colors">
                  Press
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 Lumière Beauty. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
