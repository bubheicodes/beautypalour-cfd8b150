import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";

interface SpecialOffersProps {
  data?: any;
}

const SpecialOffers = ({ data }: SpecialOffersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Extract special offers data from Strapi response
  const specialOffersBlock = data?.blocks?.find((block: any) => block.__component === "blocks.special-offers");
  const strapiProducts = specialOffersBlock?.offerProducts || [];

  // Debug logging
  console.log('=== SpecialOffers Debug ===');
  console.log('Raw data received:', data);
  console.log('Found special offers block:', specialOffersBlock);
  console.log('Products from backend:', strapiProducts);

  // Transform Strapi data to match ProductCard interface
  const offerProducts = strapiProducts.map((product: any, index: number) => {
    console.log(`Processing special offer product ${index + 1}:`, {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image
    });
    
    // Handle different image formats from Strapi
    let imageUrl = "";
    
    if (product.image) {
      // Handle array of images (since image field might be multiple: true)
      if (Array.isArray(product.image) && product.image.length > 0) {
        const firstImage = product.image[0];
        if (firstImage.url) {
          imageUrl = firstImage.url.startsWith('http') ? firstImage.url : `http://localhost:1337${firstImage.url}`;
        } else if (firstImage.data && firstImage.data.attributes) {
          const imageData = firstImage.data.attributes;
          imageUrl = imageData.url.startsWith('http') ? imageData.url : `http://localhost:1337${imageData.url}`;
        }
      } else if (typeof product.image === 'string') {
        // If image is a direct URL string
        imageUrl = product.image.startsWith('http') ? product.image : `http://localhost:1337${product.image}`;
      } else if (product.image.url) {
        // If image is an object with url property
        imageUrl = product.image.url.startsWith('http') ? product.image.url : `http://localhost:1337${product.image.url}`;
      } else if (product.image.data && product.image.data.attributes) {
        // If image is nested in data.attributes
        const imageData = product.image.data.attributes;
        imageUrl = imageData.url.startsWith('http') ? imageData.url : `http://localhost:1337${imageData.url}`;
      }
    }
    
    const transformedProduct = {
      id: product.id || index + 1,
      image: imageUrl,
      name: product.name || "",
      category: product.category || "",
      price: product.price || 0,
      originalPrice: product.originalPrice || 0,
    };
    
    console.log(`Transformed special offer product ${index + 1}:`, transformedProduct);
    return transformedProduct;
  });

  console.log('Final special offer products array:', offerProducts);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const scrollStep = 1;
    const scrollInterval = 30;

    const autoScroll = setInterval(() => {
      if (scrollContainer && !isHovering && !isDragging) {
        scrollAmount += scrollStep;
        scrollContainer.scrollLeft = scrollAmount;

        // Reset scroll when reaching the end
        if (scrollAmount >= scrollContainer.scrollWidth / 2) {
          scrollAmount = 0;
          scrollContainer.scrollLeft = 0;
        }
      }
    }, scrollInterval);

    return () => clearInterval(autoScroll);
  }, [isHovering, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  // Duplicate products for seamless loop
  const duplicatedProducts = [...offerProducts, ...offerProducts];

  return (
    <section className="py-20 bg-gradient-to-b from-secondary/30 to-background">
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {specialOffersBlock?.title || "Special Offers FS"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {specialOffersBlock?.text || "Limited time deals on your favorite luxury products FS"}
          </p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-8 overflow-x-hidden px-4 cursor-grab select-none"
        style={{ scrollBehavior: 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {duplicatedProducts.map((product, index) => (
          <div 
            key={`${product.id}-${index}`} 
            className="flex-shrink-0 w-80"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <ProductCard {...product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpecialOffers;
