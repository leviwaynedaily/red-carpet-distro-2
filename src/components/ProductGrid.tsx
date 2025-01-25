import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ProductGridProps {
  searchTerm: string;
  categoryFilter: string[];
  sortBy: string;
}

interface Media {
  webp?: string;
}

export const ProductGrid = ({
  searchTerm,
  categoryFilter,
  sortBy,
}: ProductGridProps) => {
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', 'product_categories'],
    queryFn: async () => {
      console.log('ProductGrid: Starting to fetch products with categories');
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            categories(name)
          )
        `);
      
      if (productsError) {
        console.error('ProductGrid: Error fetching products:', productsError);
        throw productsError;
      }

      console.log('ProductGrid: Raw products data:', productsData);
      
      const transformedProducts = productsData.map(product => {
        const categories = product.product_categories
          ?.map(pc => pc.categories?.name)
          .filter(Boolean) || [];
          
        console.log('ProductGrid: Transformed categories for product:', product.id, categories);
        
        return {
          ...product,
          categories
        };
      });
      
      console.log('ProductGrid: Transformed products:', transformedProducts);
      return transformedProducts;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    console.log('ProductGrid: Setting up real-time subscription');
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('ProductGrid: Received real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: ['products', 'product_categories'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_categories'
        },
        (payload) => {
          console.log('ProductGrid: Received product_categories update:', payload);
          queryClient.invalidateQueries({ queryKey: ['products', 'product_categories'] });
        }
      )
      .subscribe(status => {
        console.log('ProductGrid: Real-time subscription status:', status);
      });

    return () => {
      console.log('ProductGrid: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    console.log('ProductGrid: Loading products...');
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (error) {
    console.error('ProductGrid: Error rendering products:', error);
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-red-500">Error loading products. Please try again later.</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    console.log('ProductGrid: No products found');
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Ensure product.categories is always an array before filtering
    const productCategories = Array.isArray(product.categories) ? product.categories : [];
    
    const matchesCategory = categoryFilter.length === 0 || 
      productCategories.some(category => 
        category && categoryFilter.includes(category.toLowerCase())
      );

    console.log('ProductGrid: Filtering product:', {
      productId: product.id,
      productName: product.name,
      productCategories,
      categoryFilter,
      matchesSearch,
      matchesCategory
    });
    
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'strain-asc':
        return (a.strain || '').localeCompare(b.strain || '');
      case 'strain-desc':
        return (b.strain || '').localeCompare(a.strain || '');
      case 'price-asc':
        return (a.regular_price || 0) - (b.regular_price || 0);
      case 'price-desc':
        return (b.regular_price || 0) - (a.regular_price || 0);
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  console.log('ProductGrid: Final render state:', {
    totalProducts: products.length,
    filteredCount: filteredProducts.length,
    sortedCount: sortedProducts.length,
    searchTerm,
    categoryFilter,
    sortBy
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {sortedProducts.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          image={product.image_url || ''}
          video={product.video_url || ''}
          media={product.media as Media}
          viewMode="small"
        />
      ))}
    </div>
  );
};