import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProductMedia } from "@/components/product-details/ProductMedia";
import { ProductInfo } from "@/components/product-details/ProductInfo";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      console.log('ProductDetails: Fetching product details for ID:', id);
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            category:categories(name)
          )
        `)
        .eq('id', id)
        .single();

      if (productError) {
        console.error('ProductDetails: Error fetching product:', productError);
        throw productError;
      }

      const transformedProduct = {
        ...productData,
        categories: productData.product_categories
          ?.map(pc => pc.category?.name)
          .filter(Boolean) || [],
        media: typeof productData.media === 'string' 
          ? JSON.parse(productData.media)
          : productData.media
      };

      console.log('ProductDetails: Successfully fetched product:', transformedProduct);
      return transformedProduct;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    console.error('ProductDetails: Error rendering product:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error loading product details. Please try again later.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-8'} h-full overflow-hidden`}>
      <Button 
        variant="ghost" 
        className={`${isMobile ? 'mb-2' : 'mb-6'}`}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className={`grid ${isMobile ? 'grid-rows-[auto_1fr] gap-2' : 'grid-cols-2 gap-8'} h-[calc(100vh-4rem)]`}>
        <div className={`${isMobile ? 'h-[45vh]' : 'md:sticky md:top-24'} overflow-hidden`}>
          <ProductMedia
            imageUrl={product.image_url}
            videoUrl={product.video_url}
            productName={product.name}
            webpUrl={product.media?.webp}
          />
        </div>
        <div className={`${isMobile ? 'h-[45vh]' : ''} overflow-y-auto`}>
          <ProductInfo
            name={product.name}
            description={product.description}
            categories={product.categories}
            strain={product.strain}
            regularPrice={product.regular_price}
            shippingPrice={product.shipping_price}
            stock={product.stock}
          />
        </div>
      </div>
    </div>
  );
}