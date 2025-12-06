import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import productLipstick from "@/assets/product-lipstick.jpg";
import productCream from "@/assets/product-cream.jpg";
import productPalette from "@/assets/product-palette.jpg";

const offerProducts = [
  {
    id: 1,
    image: productLipstick,
    name: "Rose Gold Matte Lipstick",
    category: "Lips",
    price: 28.99,
    originalPrice: 35.99,
  },
  {
    id: 2,
    image: productCream,
    name: "Radiant Face Cream",
    category: "Skincare",
    price: 52.00,
    originalPrice: 65.00,
  },
  {
    id: 3,
    image: productPalette,
    name: "Nude Luxury Palette",
    category: "Eyes",
    price: 41.60,
    originalPrice: 52.00,
  },
];

const Offers = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Special Offers
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Limited time deals on your favorite luxury products. Save up to 30% off!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {offerProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="mt-16 text-center">
              <div className="inline-block bg-secondary/20 backdrop-blur-sm rounded-lg p-8 border border-border">
                <h3 className="text-2xl font-display font-bold mb-4">
                  Sign Up for Exclusive Deals
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join our newsletter and get 15% off your first order
                </p>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background"
                  />
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Offers;
