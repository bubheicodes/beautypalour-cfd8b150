import { Button } from "@/components/ui/button";

export function Hero({ data }: { readonly data: any }) {
  if (!data) return null;
  
  // Log the full data structure to understand the correct path
  console.dir(data, { depth: null });
  
  // Try different possible paths for the hero section block
  let heroBlock = null;
  
  // Path 1: data.attributes.blocks (most common Strapi structure)
  if (data?.attributes?.blocks) {
    heroBlock = data.attributes.blocks.find((block: any) => 
      block.__component === 'blocks.hero-section'
    );
  }
  
  // Path 2: data.blocks (direct blocks property)
  if (!heroBlock && data?.blocks) {
    heroBlock = data.blocks.find((block: any) => 
      block.__component === 'blocks.hero-section'
    );
  }
  
  // Path 3: Check if blocks is nested differently
  if (!heroBlock && data?.data?.attributes?.blocks) {
    heroBlock = data.data.attributes.blocks.find((block: any) => 
      block.__component === 'blocks.hero-section'
    );
  }
  
  if (!heroBlock) {
    console.log('No hero section block found. Available data structure:');
    console.log('data:', data);
    console.log('data.attributes:', data?.attributes);
    console.log('data.blocks:', data?.blocks);
    console.log('data.data:', data?.data);
    return null;
  }
  
  const { heading, text, image, cta } = heroBlock;
  const { url, alternativeText } = image || {};
  const { text: ctaText, href, isExternal } = cta?.[0] || {}; // cta is an array, get first item
  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(http://localhost:1337${url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/40" />
      </div>
      
      <div className="relative container mx-auto px-4 h-full flex items-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
            {heading || "Elevate Your Natural Beauty"}
            <span className="block text-gradient">Natural Beauty</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
            {text || "Discover our collection of premium beauty products"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="text-lg px-8">
              {ctaText || "Shop Now"}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Explore Collections
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};