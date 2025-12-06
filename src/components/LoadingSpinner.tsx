import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  retryCount?: number;
  maxRetries?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  retryCount = 0,
  maxRetries = 10 
}) => {
  const getLoadingMessage = () => {
    const messages = [
      "Preparing your beauty experience...",
      "Loading our latest collection...",
      "Gathering product information...",
      "Setting up your personalized content...",
      "Almost ready to showcase our products...",
      "Finalizing your beauty journey...",
      "Loading exclusive offers...",
      "Preparing special recommendations...",
      "Almost there, just a moment more...",
      "Your beauty paradise is loading..."
    ];
    
    return messages[retryCount % messages.length];
  };

  const getSubMessage = () => {
    const subMessages = [
      "We're curating the perfect experience for you",
      "Our servers are preparing your personalized content",
      "Loading the latest beauty trends and products",
      "Setting up your exclusive beauty recommendations",
      "Preparing our best-selling products for you",
      "Loading special offers and beauty tips",
      "Almost ready to show you our amazing collection",
      "Your personalized beauty experience is being prepared",
      "We're making sure everything is perfect for you",
      "Just a few more moments to complete your setup"
    ];
    
    return subMessages[retryCount % subMessages.length];
  };

  return (
    <main className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
          <div className="absolute inset-0 h-12 w-12 animate-ping opacity-20">
            <Loader2 className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">{getLoadingMessage()}</h1>
        
        <div className="w-64 bg-muted rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(((retryCount + 1) / maxRetries) * 100, 95)}%` }}
          />
        </div>
        
        <p className="text-sm text-muted-foreground mt-4 max-w-md">
          {getSubMessage()}
        </p>
      </div>
    </main>
  );
};
