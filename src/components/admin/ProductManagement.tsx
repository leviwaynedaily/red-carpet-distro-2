import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { ProductTable } from "./ProductTable";
import { ProductTableFilters } from "./ProductTableFilters";
import { Tables } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductMobileGrid } from "./product-table/ProductMobileGrid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AddProductDialog } from "./product-table/AddProductDialog";
import { downloadTemplate, exportProducts, parseCSV } from "@/utils/csvUtils";
import { useQuery } from "@tanstack/react-query";

type Product = Tables<"products">;

export function ProductManagement() {
  const { data: products, isLoading, error } = useProducts();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAddingSaving, setIsAddingSaving] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "strain",
    "image",
    "video_url",
    "regular_price",
    "shipping_price",
  ]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const columns = [
    { key: "name", label: "Name" },
    { key: "strain", label: "Strain" },
    { key: "description", label: "Description" },
    { key: "image", label: "Image" },
    { key: "video_url", label: "Video" },
    { key: "stock", label: "Stock" },
    { key: "regular_price", label: "Price" },
    { key: "shipping_price", label: "Shipping" },
  ];

  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns((current) =>
      current.includes(columnKey)
        ? current.filter((key) => key !== columnKey)
        : [...current, columnKey]
    );
  };

  const handleEditStart = async (product: Product) => {
    console.log('ProductManagement: Starting edit for product:', product.id);
    setEditingProduct(product.id);
    setEditValues(product);
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    console.log('ProductManagement: Saving product:', editingProduct);
    console.log('ProductManagement: New values:', editValues);

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update(editValues)
        .eq('id', editingProduct);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      setEditValues({});
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('ProductManagement: Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleEditCancel = () => {
    console.log('ProductManagement: Canceling edit');
    setEditingProduct(null);
    setEditValues({});
  };

  const handleEditChange = (values: Partial<Product>) => {
    console.log('ProductManagement: Edit values changed:', values);
    setEditValues(values);
  };

  const handleDelete = async (id: string) => {
    console.log('ProductManagement: Deleting product:', id);
    try {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('ProductManagement: Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleMediaUpload = async (productId: string, file: File) => {
    console.log('ProductManagement: Uploading media for product:', productId);
    try {
      // Get file extension and ensure it's webp for images
      const isImage = file.type.startsWith('image/');
      const extension = isImage ? 'webp' : file.name.split('.').pop() || 'mp4';
      const fileName = `products/${productId}/${Date.now()}.${extension}`;

      // If it's a video, generate thumbnail first
      let thumbnailUrl = null;
      if (!isImage) {
        try {
          const thumbnailBlob = await generateThumbnail(file);
          const thumbnailPath = `products/${productId}/thumbnail.webp`;
          const { data: thumbnailData, error: thumbnailError } = await supabase.storage
            .from('media')
            .upload(thumbnailPath, thumbnailBlob);

          if (thumbnailError) throw thumbnailError;

          thumbnailUrl = supabase.storage
            .from('media')
            .getPublicUrl(thumbnailData.path).data.publicUrl;
        } catch (thumbnailError) {
          console.error('Failed to generate thumbnail:', thumbnailError);
          toast.error('Failed to generate video thumbnail, but will continue with video upload');
        }
      }

      // Upload the main media file
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) throw error;

      const mediaUrl = supabase.storage
        .from('media')
        .getPublicUrl(data.path).data.publicUrl;

      // Update the product with both URLs if we have a thumbnail
      const updateData: any = {
        video_url: !isImage ? mediaUrl : undefined,
        image_url: isImage ? mediaUrl : thumbnailUrl
      };

      // Only include defined values
      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      );

      const { error: updateError } = await supabase
        .from('products')
        .update(cleanUpdateData)
        .eq('id', productId);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(isImage ? 'Image uploaded successfully' : 'Video uploaded successfully');
    } catch (error) {
      console.error('ProductManagement: Error uploading media:', error);
      toast.error('Failed to upload media');
    }
  };

  const generateThumbnail = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        video.currentTime = 0;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');

          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                URL.revokeObjectURL(url);
                video.remove();
                resolve(blob);
              } else {
                reject(new Error('Failed to create thumbnail blob'));
              }
            },
            'image/webp',
            0.8
          );
        } catch (error) {
          URL.revokeObjectURL(url);
          video.remove();
          reject(error);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        video.remove();
        reject(new Error('Error loading video'));
      };

      video.src = url;
    });
  };

  const handleDeleteMedia = async (productId: string, type: 'image' | 'video') => {
    console.log('ProductManagement: Deleting media for product:', productId, type);
    try {
      const mediaType = type === 'image' ? 'image_url' : 'video_url';
      const { error: updateError } = await supabase
        .from('products')
        .update({ [mediaType]: null })
        .eq('id', productId);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('ProductManagement: Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  };

  const handleMediaClick = (type: "image" | "video", url: string) => {
    console.log("ProductManagement: Media clicked:", type, url);
    window.open(url, "_blank");
  };

  const handleAddProduct = async (product: Partial<Product>): Promise<boolean> => {
    console.log("Starting product add:", product);
    setIsAddingSaving(true);
    try {
      // Validate required fields
      if (!product.name) {
        toast.error("Product name is required");
        return false;
      }

      // Force TS to see `name` as a string
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: product.name as string,
            description: product.description,
            strain: product.strain,
            stock: product.stock || 0,
            regular_price: product.regular_price || 0,
            shipping_price: product.shipping_price || 0,
            image_url: product.image_url,
            video_url: product.video_url,
            primary_media_type: "image",
            media: [],
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Product added successfully:", data);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      
      // Only close dialog and show success after everything is complete
      setShowAddDialog(false);
      toast.success("Product added successfully");
      return true;
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
      return false;
    } finally {
      setIsAddingSaving(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const importedProducts = await parseCSV(file);
        console.log("Importing products:", importedProducts);

        for (const product of importedProducts) {
          // Skip if there's no name
          if (!product.name) {
            console.error("Skipping product without name:", product);
            continue;
          }

          const { error } = await supabase.from("products").insert([
            {
              name: product.name as string,
              description: product.description,
              strain: product.strain,
              stock: product.stock,
              regular_price: product.regular_price,
              shipping_price: product.shipping_price,
              primary_media_type: "image",
              media: [],
            },
          ]);

          if (error) {
            console.error("Error importing product:", error);
            throw error;
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["products"] });
        toast.success("Products imported successfully");
      } catch (error) {
        console.error("Error importing products:", error);
        toast.error("Failed to import products");
      }
    };
    input.click();
  };

  const handleExport = () => {
    if (!products) return;
    exportProducts(products);
    toast.success("Products exported successfully");
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast.success("Template downloaded successfully");
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedProducts = [...(products || [])].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aValue = a[key as keyof Product];
    const bValue = b[key as keyof Product];
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products: {error.message}</div>;
  if (!products) return <div>No products found</div>;

  return (
    <div className="space-y-4">
      <ProductTableFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnToggle={handleColumnToggle}
        showColumnToggle={!isMobile}
        onAddProduct={() => setShowAddDialog(true)}
        onImport={handleImport}
        onExport={handleExport}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {isMobile ? (
        <ProductMobileGrid
          products={sortedProducts}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onEditChange={handleEditChange}
          editingProduct={editingProduct}
          editValues={editValues}
          onDelete={handleDelete}
          onMediaUpload={handleMediaUpload}
          onDeleteMedia={handleDeleteMedia}
          onMediaClick={handleMediaClick}
        />
      ) : (
        <ProductTable
          products={sortedProducts}
          visibleColumns={visibleColumns}
          editingProduct={editingProduct}
          editValues={editValues}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onEditChange={handleEditChange}
          onDelete={handleDelete}
          onMediaUpload={handleMediaUpload}
          onDeleteMedia={handleDeleteMedia}
          onMediaClick={handleMediaClick}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      )}

      <AddProductDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSave={handleAddProduct}
        isSaving={isAddingSaving}
      />
    </div>
  );
}
