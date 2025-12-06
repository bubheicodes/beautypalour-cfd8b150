import Navbar from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { OurBestSellers } from "@/components/OurBestSellers";
import SpecialOffers from "@/components/SpecialOffers";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import qs from "qs";
import { useEffect, useState, useCallback } from "react";



 
const homePageQuery = qs.stringify({
  populate: {
    blocks: {
      on: {
        "blocks.hero-section": {
          populate: {
            image: true,
            cta: true
          }
        },
        "blocks.special-offers": {
          fields: ["title", "text"],
          populate: {
            offerProducts: {
              fields: ["name", "category", "price", "originalPrice"],
              populate: {
                image: {
                  fields: ["url", "alternativeText"]
                }
              }
            }
          }
        },
        "blocks.our-bestsellers": {
            fields: ["title", "text"],
            populate: {
              product: {
                fields: ["name", "category", "price"],
                populate: {
                  image: {
                    fields: ["url", "alternativeText"]
                  }
                }
              }
            }
          },
        "blocks.join-our-beauty-club": {
          populate: "*"
        }
      }
    }
  }
})

async function getStrapiData(path: string) {
  const baseUrl = "http://localhost:1337";

  const url = new URL(path, baseUrl);
  url.search = homePageQuery;

  console.log('Fetching from URL:', url.href);

  try {
    const response = await fetch(url.href);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw API response:', data);
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}

export default function Home() {
  const [strapiData, setStrapiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(10);

  const calculateDelay = useCallback((attempt: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then cap at 30s
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return delay;
  }, []);

  const fetchDataWithRetry = useCallback(async (attempt: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      setRetryCount(attempt);
      
      const data = await getStrapiData("/api/home-page");
      
      if (!data) {
        throw new Error("No data received");
      }
      
      console.log('Strapi response structure:', data);
      console.log('Home page data:', data.data);
      console.log('Blocks:', data.data?.blocks);
      setStrapiData(data);
      setLoading(false);
      
    } catch (err) {
      console.error(`Error fetching data (attempt ${attempt + 1}):`, err);
      
      if (attempt < maxRetries - 1) {
        const delay = calculateDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          fetchDataWithRetry(attempt + 1);
        }, delay);
      } else {
        // Final attempt failed
        setError("We're currently updating our beauty collection. Please refresh the page in a few moments.");
        setLoading(false);
      }
    }
  }, [maxRetries, calculateDelay]);

  useEffect(() => {
    fetchDataWithRetry();
  }, [fetchDataWithRetry]);

  if (loading) {
    return (
      <LoadingSpinner 
        retryCount={retryCount}
        maxRetries={maxRetries}
      />
    );
  }

  if (error) {
    return (
      <main className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-muted/50 border border-muted rounded-lg p-8 max-w-md">
            <h1 className="text-2xl font-bold mb-4">Beauty Collection Updating</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button 
              onClick={() => fetchDataWithRetry(0)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Refresh Collection
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero data={strapiData?.data} />
      <OurBestSellers data={strapiData?.data} />
      <SpecialOffers data={strapiData?.data} />
      <Newsletter />
      <Footer />
    </div>
  );
}