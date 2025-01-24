import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, Image, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  video?: string;
  categories: string[];
  strain?: string;
  stock?: number;
  regular_price?: number;
  shipping_price?: number;
  viewMode: 'small' | 'medium' | 'large';
  primary_media_type?: string;
  media?: {
    webp?: string;
  };
}

export const ProductCard = ({
  id,
  name,
  description,
  image,
  video,
  categories,
  strain,
  stock,
  regular_price,
  shipping_price,
  viewMode,
  primary_media_type,
  media,
}: ProductCardProps) => {
  const isMobile = useIsMobile();
  const [showMedia, setShowMedia] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [webpError, setWebpError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [0, 200], [1, 0]);
  const dragScale = useTransform(dragY, [0, 200], [1, 0.95]);

  const validCategories = categories?.filter(category => category && category.trim() !== '') || [];
  const mediaItems = [];
  
  if (video) {
    mediaItems.push({ type: 'video', url: video });
  }
  
  if (image) {
    mediaItems.push({ type: 'image', url: image, webp: media?.webp });
  }

  const handleClose = () => {
    setShowMedia(false);
    setIsPlaying(false);
  };

  const handleDragEnd = () => {
    if (dragY.get() > 150) {
      handleClose();
    }
    dragY.set(0);
    setIsDragging(false);
  };

  const handleDownload = async (url: string, type: 'image' | 'video') => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name}-${type}.${type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load product image:', e);
    setImageError(true);
    e.currentTarget.src = '/placeholder.svg';
  };

  const handleWebPError = (e: React.SyntheticEvent<HTMLSourceElement, Event>) => {
    console.log('WebP image failed to load, falling back to PNG:', e);
    setWebpError(true);
  };

  const cardClasses = {
    small: "overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
    medium: "overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
    large: "overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
  };

  const imageContainerClasses = {
    small: "w-full h-48 relative overflow-hidden bg-gray-100",
    medium: "w-full h-48 relative overflow-hidden bg-gray-100",
    large: "w-full h-48 relative overflow-hidden bg-gray-100"
  };

  const imageClasses = {
    small: "w-full h-full object-cover",
    medium: "w-full h-full object-cover",
    large: "w-full h-full object-cover"
  };

  const contentClasses = {
    small: "p-2",
    medium: "p-3",
    large: "p-4"
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderPricing = () => {
    return (
      <div className="space-y-1">
        {regular_price !== undefined && regular_price > 0 && (
          <div className="text-[10px] sm:text-sm whitespace-nowrap">
            <span className="mr-1">📍</span>
            <span>In Town: {formatPrice(regular_price)}</span>
          </div>
        )}
        {shipping_price !== undefined && shipping_price > 0 && (
          <div className="text-[10px] sm:text-sm whitespace-nowrap">
            <span className="mr-1">🚚</span>
            <span>Shipping: {formatPrice(shipping_price)}</span>
          </div>
        )}
      </div>
    );
  };

  const renderImage = () => {
    if (!image && !media?.webp) {
      return (
        <div className={`${imageContainerClasses[viewMode]} flex items-center justify-center`}>
          <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center bg-gray-100">
            <Image className="h-8 w-8 mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Image coming soon</p>
          </div>
        </div>
      );
    }

    return (
      <div className={imageContainerClasses[viewMode]}>
        <picture>
          {media?.webp && !webpError && (
            <source
              srcSet={media.webp}
              type="image/webp"
              onError={handleWebPError}
            />
          )}
          <img
            src={image}
            alt={name}
            className={imageClasses[viewMode]}
            loading="lazy"
            onError={handleImageError}
          />
        </picture>
      </div>
    );
  };

  const renderMediaContent = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-none">
          <Carousel className="w-full">
            <CarouselContent>
              {mediaItems.map((item, index) => (
                <CarouselItem key={index} className="flex justify-center items-center">
                  {item.type === 'video' ? (
                    <div className="w-full flex justify-center mt-14">
                      <video
                        src={item.url}
                        controls
                        playsInline
                        muted={false}
                        autoPlay
                        className="max-h-[50vh] w-auto"
                      />
                    </div>
                  ) : (
                    <picture className="flex justify-center mt-14">
                      {item.webp && !webpError && (
                        <source
                          srcSet={item.webp}
                          type="image/webp"
                          onError={handleWebPError}
                        />
                      )}
                      <img
                        src={item.url}
                        alt={name}
                        className="max-h-[50vh] w-auto"
                        onError={handleImageError}
                      />
                    </picture>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            {mediaItems.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {validCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {validCategories.map((category) => (
                <div key={category} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  {category.trim()}
                </div>
              ))}
            </div>
          )}
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-4">{description}</p>
          )}
          {strain && (
            <div className="flex gap-2 text-sm text-gray-600 mb-4">
              <span>Strain: {strain}</span>
            </div>
          )}
          <div className="space-y-4">
            {(regular_price !== undefined || shipping_price !== undefined) && (
              <div className="space-y-2">
                {renderPricing()}
              </div>
            )}
            {stock !== undefined && stock !== null && stock > 0 && (
              <div className="text-sm text-gray-600">
                {stock} in stock
              </div>
            )}
            <div className="flex gap-2">
              {video && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 h-8"
                  onClick={() => handleDownload(video, 'video')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Video
                </Button>
              )}
              {image && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 h-8"
                  onClick={() => handleDownload(image, 'image')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Image
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card 
        className={cardClasses[viewMode]}
        onClick={() => setShowMedia(true)}
      >
        <CardHeader className="p-0 relative">
          {renderImage()}
        </CardHeader>
        <CardContent className={contentClasses[viewMode]}>
          {validCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {validCategories.map((category) => (
                <div key={category} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                  {category.trim()}
                </div>
              ))}
            </div>
          )}
          <h3 className="text-sm font-semibold mb-1 truncate">{name}</h3>
          {description && (
            <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
          )}
          {strain && (
            <div className="flex gap-2 text-xs text-gray-600 mt-2">
              <span>Strain: {strain}</span>
            </div>
          )}
          <div className="mt-2">
            {renderPricing()}
            {stock !== undefined && stock !== null && stock > 0 && (
              <div className="text-xs text-gray-600 mt-1">
                {stock} in stock
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={showMedia} onOpenChange={setShowMedia}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={isMobile ? "h-[85vh] p-0 rounded-t-[1rem] overflow-hidden" : "w-[90vw] max-w-4xl p-0"}
        >
          {isMobile && (
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDrag={(_, info) => {
                if (info.offset.y > 0) {
                  dragY.set(info.offset.y);
                  setIsDragging(true);
                }
              }}
              onDragEnd={handleDragEnd}
              style={{ 
                opacity: dragOpacity,
                scale: dragScale,
              }}
              className="w-full flex flex-col"
            >
              <div className="w-full flex justify-center pt-2 pb-1 touch-none cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-gray-300" />
              </div>
              <div className="absolute left-0 right-0 h-12 -top-8" />
            </motion.div>
          )}
          <motion.div
            style={{ 
              opacity: dragOpacity,
              scale: dragScale,
            }}
          >
            {renderMediaContent()}
          </motion.div>
        </SheetContent>
      </Sheet>
    </>
  );
};