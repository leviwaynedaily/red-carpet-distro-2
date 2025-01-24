import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductTable } from "./ProductTable";
import { ProductMobileGrid } from "./ProductMobileGrid";
import { toast } from "sonner";

type Product = Tables<"products">;

interface ProductsListProps {
  searchTerm: string;
  visibleColumns: string[];
}

export function ProductsList({ searchTerm, visibleColumns }: ProductsListProps) {
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('ProductsList: Starting to fetch products');
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) {
        console.error('ProductsList: Error fetching products:', productsError);
        throw productsError;
      }

      console.log('ProductsList: Raw products data:', productsData);
      return productsData;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (error) {
    console.error('ProductsList: Error rendering products:', error);
    toast.error("Failed to load products");
  }

  // Filter products based on search term
  const filteredProducts = products?.filter(product => {
    const matches = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    console.log('ProductsList: Filtering product:', product.name, 'matches:', matches);
    return matches;
  }) || [];

  const handleEditSave = async () => {
    console.log('ProductsList: Starting to save product:', editingProduct);
    try {
      if (!editingProduct) {
        throw new Error('No product being edited');
      }

      // Update the product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: editValues.name,
          description: editValues.description,
          strain: editValues.strain,
          stock: editValues.stock,
          regular_price: editValues.regular_price,
          shipping_price: editValues.shipping_price,
        })
        .eq('id', editingProduct);

      if (updateError) throw updateError;

      // Invalidate queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('ProductsList: Error saving product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleImageUpload = async (productId: string, url: string) => {
    console.log('ProductsList: Uploading image for product:', productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ image_url: url })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleVideoUpload = async (productId: string, url: string) => {
    console.log('ProductsList: Uploading video for product:', productId);
    try {
      const { error } = await supabase
        .from('products')
        .update({ video_url: url })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    }
  };

  const handleDeleteMedia = async (productId: string, type: 'image' | 'video') => {
    console.log('ProductsList: Deleting media for product:', productId, type);
    try {
      const updateData = type === 'image' ? { image_url: null } : { video_url: null };
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);

      if (error) throw error;
      toast.success(`${type} deleted successfully`);
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleMediaClick = (type: 'image' | 'video', url: string) => {
    console.log('ProductsList: Media clicked:', type, url);
    window.open(url, '_blank');
  };

  return (
    <ProductTable
      products={filteredProducts}
      visibleColumns={visibleColumns}
      editingProduct={editingProduct}
      editValues={editValues}
      onEditStart={(product) => {
        console.log('ProductsList: Starting edit for product:', product);
        setEditingProduct(product.id);
        setEditValues(product);
      }}
      onEditSave={handleEditSave}
      onEditCancel={() => {
        console.log('ProductsList: Canceling edit');
        setEditingProduct(null);
      }}
      onEditChange={setEditValues}
      onDelete={(id) => console.log('Delete product with id:', id)}
      onImageUpload={handleImageUpload}
      onVideoUpload={handleVideoUpload}
      onDeleteMedia={handleDeleteMedia}
      onMediaClick={handleMediaClick}
      sortConfig={{ key: "name", direction: "asc" }}
      onSort={(key) => console.log('Sort by:', key)}
    />
  );
}