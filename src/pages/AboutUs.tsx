import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Sparkles, Heart, Leaf, Award } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "We source only the finest ingredients from around the world to create products that truly deliver results.",
  },
  {
    icon: Heart,
    title: "Self-Love & Care",
    description: "Beauty starts from within. We believe in empowering you to feel confident and beautiful in your own skin.",
  },
  {
    icon: Leaf,
    title: "Sustainable Beauty",
    description: "Committed to eco-friendly practices and cruelty-free products that are kind to you and the planet.",
  },
  {
    icon: Award,
    title: "Expert Crafted",
    description: "Each product is developed by beauty experts and dermatologists to ensure the highest standards.",
  },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Our Story
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded with a passion for clean, effective beauty, our brand was born from the belief 
                that everyone deserves access to luxury skincare and cosmetics that actually work. 
                We've spent years perfecting our formulas, working with the world's leading dermatologists 
                and beauty experts to create products that enhance your natural beauty.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div 
                    key={index}
                    className="text-center p-6 rounded-lg bg-card border border-border hover-lift"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-semibold mb-3">
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                To revolutionize the beauty industry by creating products that are not only effective 
                but also sustainable, ethical, and accessible. We're committed to helping you discover 
                your most confident, radiant self while caring for our planet and all its inhabitants.
              </p>
            </div>

            <div className="mt-20 grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">500K+</div>
                <div className="text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Premium Products</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">15+</div>
                <div className="text-muted-foreground">Countries Worldwide</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
