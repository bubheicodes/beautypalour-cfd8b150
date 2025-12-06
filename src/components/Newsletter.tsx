import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Newsletter = () => {
  return (
    <section className="py-20 bg-gradient-luxury">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center text-primary-foreground">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Join Our Beauty Club
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Subscribe to get exclusive offers, beauty tips, and early access to new collections
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email"
              className="bg-white/90 border-white/20 text-foreground placeholder:text-muted-foreground flex-1"
            />
            <Button 
              type="submit"
              variant="secondary"
              size="lg"
              className="font-semibold"
            >
              Subscribe
            </Button>
          </form>
          
          <p className="text-sm mt-4 opacity-75">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
