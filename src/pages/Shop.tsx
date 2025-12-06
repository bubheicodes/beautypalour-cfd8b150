import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import productLipstick from "@/assets/product-lipstick.jpg";
import productCream from "@/assets/product-cream.jpg";
import productPalette from "@/assets/product-palette.jpg";
import productPerfume from "@/assets/product-perfume.jpg";
import productSerum from "@/assets/product-serum.jpg";
import productBlush from "@/assets/product-blush.jpg";

const allProducts = [
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
    price: 45.99,
  },
  {
    id: 4,
    image: productPerfume,
    name: "Lumière Eau de Parfum",
    category: "Fragrance",
    price: 89.99,
  },
  {
    id: 5,
    image: productSerum,
    name: "Vitamin C Glow Serum",
    category: "Skincare",
    price: 42.00,
  },
  {
    id: 6,
    image: productBlush,
    name: "Peachy Blush",
    category: "Face",
    price: 24.99,
  },
];

const Shop = () => {
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");

  const filteredProducts = category === "all" 
    ? allProducts 
    : allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                Shop All Products
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our complete collection of luxury beauty products
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
              <div className="flex gap-4 flex-wrap">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="lips">Lips</SelectItem>
                    <SelectItem value="eyes">Eyes</SelectItem>
                    <SelectItem value="skincare">Skincare</SelectItem>
                    <SelectItem value="fragrance">Fragrance</SelectItem>
                    <SelectItem value="face">Face</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-muted-foreground">
                {filteredProducts.length} products
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
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

export default Shop;
