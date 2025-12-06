import ProductCard from "./ProductCard";

export function OurBestSellers({ data }: { readonly data: any }) {
  // Try different possible paths for the our-bestsellers block
  let bestsellersBlock = null;
  
  // Path 1: data.blocks (direct blocks property - most likely based on Index.tsx)
  if (data?.blocks) {
    bestsellersBlock = data.blocks.find((block: any) => 
      block.__component === 'blocks.our-bestsellers'
    );
  }
  
  // Path 2: data.attributes.blocks (alternative Strapi structure)
  if (!bestsellersBlock && data?.attributes?.blocks) {
    bestsellersBlock = data.attributes.blocks.find((block: any) => 
      block.__component === 'blocks.our-bestsellers'
    );
  }
  
  // Path 3: Check if blocks is nested differently
  if (!bestsellersBlock && data?.data?.attributes?.blocks) {
    bestsellersBlock = data.data.attributes.blocks.find((block: any) => 
      block.__component === 'blocks.our-bestsellers'
    );
  }
  
  // Debug logging
  console.log('=== OurBestSellers Debug ===');
  console.log('Raw data received:', data);
  console.log('Found bestsellers block:', bestsellersBlock);
  
  if (!bestsellersBlock) {
    console.log('No our-bestsellers block found in data.');
    console.log('Available blocks:', data?.blocks?.map((b: any) => b.__component));
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Our Bestsellers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No products available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }
  
  // Extract data from Strapi block
  const title = bestsellersBlock?.title || "Our Bestsellers";
  const text = bestsellersBlock?.text || "Discover our most-loved products, carefully crafted to enhance your natural beauty";
  const strapiProducts = bestsellersBlock?.product || [];
  
  console.log('Products from backend:', strapiProducts);
  console.log('Number of products:', strapiProducts.length);
  
  // Transform Strapi products to match our ProductCard interface
  const products = strapiProducts.map((product: any, index: number) => {
    console.log(`Processing product ${index + 1}:`, {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image
    });
    
    // Handle different image formats from Strapi
    let imageUrl = ""; // Will be set from Strapi data
    
    if (product.image) {
      // Handle array of images (since image field is multiple: true)
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
      id: product.id || `product-${index}`,
      image: imageUrl,
      name: product.name || "Product",
      category: product.category || "General",
      price: product.price || 0,
    };
    
    console.log(`Transformed product ${index + 1}:`, transformedProduct);
    return transformedProduct;
  });

  console.log('Final products array:', products);
  console.log('Total products to display:', products.length);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {text}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OurBestSellers;
