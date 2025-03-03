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
import { downloadTemplate, exportProducts, parseCSV } from "@/utils/csvUtils";
import { useQuery } from "@tanstack/react-query";
import { ProductDialog } from "./product-table/ProductDialog";

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
  const [uploadingMedia, setUploadingMedia] = useState<{[key: string]: { isUploading: boolean; status: string }}>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addValues, setAddValues] = useState<Partial<Product>>({
    stock: 0,
    regular_price: 0,
    shipping_price: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

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
      setIsSaving(true);
      const { error: updateError } = await supabase
        .from('products')
        .update(editValues)
        .eq('id', editingProduct);

      if (updateError) throw updateError;

      // Set loading state for this product while we refresh
      setUploadingMedia(prev => ({ 
        ...prev, 
        [editingProduct]: { isUploading: true, status: 'Saving changes...' }
      }));

      // Wait for the query to be invalidated and refetched
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Add a small delay to ensure the new data is displayed
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Product updated successfully');
    } catch (error) {
      console.error('ProductManagement: Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      // Clear all states
      setIsSaving(false);
      setEditingProduct(null);
      setEditValues({});
      setIsAddDialogOpen(false);
      // Clear loading state
      setUploadingMedia(prev => {
        const newState = { ...prev };
        delete newState[editingProduct];
        return newState;
      });
    }
  };

  const handleEditCancel = () => {
    console.log('ProductManagement: Canceling edit');
    setEditingProduct(null);
    setEditValues({});
    setIsAddDialogOpen(false);
  };

  const handleEditChange = (values: Partial<Product>) => {
    console.log('ProductManagement: Edit values changed:', values);
    setEditValues(values);
  };

  const handleDelete = async (id: string) => {
    console.log('ProductManagement: Deleting product:', id);
    try {
      // Set loading state for this product while we delete
      setUploadingMedia(prev => ({ 
        ...prev, 
        [id]: { isUploading: true, status: 'Deleting...' }
      }));

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Wait for the query to be invalidated and refetched
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Add a small delay to ensure the UI updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('ProductManagement: Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      // Clear loading state
      setUploadingMedia(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleMediaUpload = async (productId: string, file: File) => {
    console.log('ProductManagement: Uploading media for product:', productId);
    setUploadingMedia(prev => ({ 
      ...prev, 
      [productId]: { isUploading: true, status: 'Starting upload...' }
    }));

    try {
      const isImage = file.type.startsWith('image/');
      const extension = isImage ? 'webp' : file.name.split('.').pop() || 'mp4';
      const fileName = `products/${productId}/${Date.now()}.${extension}`;

      // If it's a video, generate thumbnail first
      let thumbnailUrl = null;
      if (!isImage) {
        try {
          setUploadingMedia(prev => ({ 
            ...prev, 
            [productId]: { isUploading: true, status: 'Generating thumbnail...' }
          }));

          const thumbnailBlob = await generateThumbnail(file);
          
          setUploadingMedia(prev => ({ 
            ...prev, 
            [productId]: { isUploading: true, status: 'Uploading thumbnail...' }
          }));

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
      setUploadingMedia(prev => ({ 
        ...prev, 
        [productId]: { isUploading: true, status: isImage ? 'Uploading image...' : 'Uploading video...' }
      }));

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (error) throw error;

      const mediaUrl = supabase.storage
        .from('media')
        .getPublicUrl(data.path).data.publicUrl;

      setUploadingMedia(prev => ({ 
        ...prev, 
        [productId]: { isUploading: true, status: 'Saving changes...' }
      }));

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

      setUploadingMedia(prev => ({ 
        ...prev, 
        [productId]: { isUploading: true, status: 'Refreshing display...' }
      }));

      // Wait for the query to be invalidated and refetched
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Add a small delay to ensure the new data is displayed
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(isImage ? 'Image uploaded successfully' : 'Video uploaded successfully');
    } catch (error) {
      console.error('ProductManagement: Error uploading media:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploadingMedia(prev => ({ ...prev, [productId]: { isUploading: false, status: '' } }));
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
      // Set loading state for this product while we delete media
      setUploadingMedia(prev => ({ 
        ...prev, 
        [productId]: { isUploading: true, status: 'Removing media...' }
      }));

      const mediaType = type === 'image' ? 'image_url' : 'video_url';
      const { error: updateError } = await supabase
        .from('products')
        .update({ [mediaType]: null })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Wait for the query to be invalidated and refetched
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Add a small delay to ensure the UI updates
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('ProductManagement: Error deleting media:', error);
      toast.error('Failed to delete media');
    } finally {
      // Clear loading state
      setUploadingMedia(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
    }
  };

  const handleMediaClick = (type: "image" | "video", url: string) => {
    console.log("ProductManagement: Media clicked:", type, url);
    window.open(url, "_blank");
  };

  const handleAddProduct = async () => {
    setIsAddDialogOpen(true);
    setAddValues({
      stock: 0,
      regular_price: 0,
      shipping_price: 0,
    });
  };

  const handleAddSave = async () => {
    try {
      // Validate required fields
      if (!addValues.name?.trim()) {
        toast.error("Product name is required");
        return;
      }

      setIsSaving(true);
      const productToAdd = {
        ...addValues,
        name: addValues.name,
        stock: addValues.stock || 0,
        regular_price: addValues.regular_price || 0,
        shipping_price: addValues.shipping_price || 0,
        primary_media_type: "image",
        media: [],
      };

      const { data: newProduct, error } = await supabase
        .from("products")
        .insert([productToAdd])
        .select()
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setIsSaving(false);
      setIsAddDialogOpen(false);
      setAddValues({
        stock: 0,
        regular_price: 0,
        shipping_price: 0,
      });
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
        onAddProduct={handleAddProduct}
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
          uploadingMedia={uploadingMedia}
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

      <ProductDialog
        open={isAddDialogOpen || !!editingProduct}
        onOpenChange={(open) => {
          if (!open) {
            if (isAddDialogOpen) {
              setIsAddDialogOpen(false);
              setAddValues({
                stock: 0,
                regular_price: 0,
                shipping_price: 0,
              });
            }
            setEditingProduct(null);
            setEditValues({});
          }
        }}
        mode={isAddDialogOpen ? "add" : "edit"}
        product={editingProduct ? products?.find(p => p.id === editingProduct) : undefined}
        editValues={isAddDialogOpen ? addValues : editValues}
        onEditChange={isAddDialogOpen ? setAddValues : handleEditChange}
        onSave={isAddDialogOpen ? handleAddSave : handleEditSave}
        onCancel={isAddDialogOpen ? () => {
          setIsAddDialogOpen(false);
          setAddValues({
            stock: 0,
            regular_price: 0,
            shipping_price: 0,
          });
        } : handleEditCancel}
        onMediaUpload={handleMediaUpload}
        onDeleteMedia={handleDeleteMedia}
        onMediaClick={handleMediaClick}
        isSaving={isSaving}
      />
    </div>
  );
}
