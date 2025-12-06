import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import productSerum from "@/assets/product-serum.jpg";
import productBlush from "@/assets/product-blush.jpg";
import productPerfume from "@/assets/product-perfume.jpg";

const newProducts = [
  {
    id: 1,
    image: productSerum,
    name: "Vitamin C Glow Serum",
    category: "Skincare",
    price: 42.00,
  },
  {
    id: 2,
    image: productBlush,
    name: "Peachy Blush",
    category: "Face",
    price: 24.99,
  },
  {
    id: 3,
    image: productPerfume,
    name: "Lumière Eau de Parfum",
    category: "Fragrance",
    price: 89.99,
  },
];

const NewArrivals = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                New Arrivals
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover our latest collection of premium beauty products
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {newProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NewArrivals;
