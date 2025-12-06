import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingCart, Heart, X } from "lucide-react";

interface ProductCardProps {
  image: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
}

const ProductCard = ({ image, name, category, price, originalPrice }: ProductCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <>
      <Card 
        className="group overflow-hidden border-border hover-lift cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative overflow-hidden aspect-square">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {discount > 0 && (
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </div>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            {category}
          </p>
          <h3 className="text-lg font-display font-semibold mt-2 mb-3">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">
                ${price.toFixed(2)}
              </span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <Button 
              size="icon" 
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{name}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <img 
                src={image} 
                alt={name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  -{discount}%
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">
                  {category}
                </p>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl font-bold text-primary">
                    ${price.toFixed(2)}
                  </span>
                  {originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Experience luxury with our premium {category.toLowerCase()} product. 
                  Carefully crafted with the finest ingredients to enhance your natural beauty.
                </p>
                
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold">Key Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Premium quality ingredients</li>
                    <li>Long-lasting formula</li>
                    <li>Dermatologically tested</li>
                    <li>Cruelty-free</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button className="flex-1" size="lg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
