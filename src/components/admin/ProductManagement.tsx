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
import { extractVideoFrame } from "@/utils/imageUtils";

type Product = Tables<"products">;

export function ProductManagement() {
  const { data: products, isLoading, error } = useProducts();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "strain",
    "description",
    "image",
    "video_url",
    "stock",
    "regular_price",
    "shipping_price",
  ]);

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
    console.log("ProductManagement: Starting edit for product:", product.id);
    setEditingProduct(product.id);
    setEditValues(product);
  };

  const handleEditSave = async () => {
    console.log("ProductManagement: Saving product:", editingProduct);
    try {
      if (!editingProduct || !editValues.name) {
        toast.error("Product name is required");
        return;
      }

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: editValues.name,
          description: editValues.description,
          strain: editValues.strain,
          stock: editValues.stock,
          regular_price: editValues.regular_price,
          shipping_price: editValues.shipping_price,
          primary_media_type: "image",
          media: [],
        })
        .eq("id", editingProduct);

      if (updateError) throw updateError;

      // Invalidate and refetch products after successful save
      await queryClient.invalidateQueries({ queryKey: ["products"] });

      setEditingProduct(null);
      setEditValues({});
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    }
  };

  const handleEditCancel = () => {
    console.log("ProductManagement: Canceling edit");
    setEditingProduct(null);
    setEditValues({});
  };

  const handleEditChange = (values: Partial<Product>) => {
    console.log("ProductManagement: Updating edit values:", values);
    setEditValues(values);
  };

  const handleDelete = async (id: string) => {
    console.log("ProductManagement: Deleting product:", id);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Invalidate and refetch products after successful delete
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleImageUpload = async (productId: string, url: string) => {
    console.log("ProductManagement: Uploading image for product:", productId);
    try {
      const { error } = await supabase
        .from("products")
        .update({ image_url: url })
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      if (products) {
        const updatedProducts = products.map(p => 
          p.id === productId 
            ? { ...p, image_url: url }
            : p
        );
        queryClient.setQueryData(["products"], updatedProducts);
      }

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    }
  };

  const handleVideoUpload = async (productId: string, url: string) => {
    console.log("ProductManagement: Uploading video for product:", productId);
    try {
      // First get the product name
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("name")
        .eq("id", productId)
        .single();

      if (productError) throw productError;
      if (!product?.name) throw new Error("Product name not found");

      // Create a URL-safe filename from the product name
      const safeFileName = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Fetch the video file
      const response = await fetch(url);
      const videoBlob = await response.blob();
      const videoFile = new File([videoBlob], `${safeFileName}.mp4`, { type: videoBlob.type });

      // Extract the first frame
      const { webpBlob } = await extractVideoFrame(videoFile);

      // Upload the frame as WebP
      const webpFile = new File([webpBlob], `${safeFileName}.webp`, { type: 'image/webp' });
      const { error: webpError } = await supabase.storage
        .from("media")
        .upload(`products/${productId}/${safeFileName}.webp`, webpFile, {
          contentType: 'image/webp',
          upsert: true
        });

      if (webpError) throw webpError;

      // Get public URL
      const { data: { publicUrl: webpUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(`products/${productId}/${safeFileName}.webp`);

      // Upload the video with the same name pattern
      const { error: videoError } = await supabase.storage
        .from("media")
        .upload(`products/${productId}/${safeFileName}.mp4`, videoFile, {
          contentType: videoBlob.type,
          upsert: true
        });

      if (videoError) throw videoError;

      // Get video public URL
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(`products/${productId}/${safeFileName}.mp4`);

      // Update product with both video and image URLs
      const { error } = await supabase
        .from("products")
        .update({ 
          video_url: videoUrl,
          image_url: webpUrl,
          media: {
            original: webpUrl,
            webp: webpUrl
          }
        })
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      if (products) {
        const updatedProducts = products.map(p => 
          p.id === productId 
            ? { 
                ...p, 
                video_url: videoUrl, 
                image_url: webpUrl,
                media: {
                  original: webpUrl,
                  webp: webpUrl
                }
              }
            : p
        );
        queryClient.setQueryData(["products"], updatedProducts);
      }

      toast.success("Video uploaded and thumbnail generated successfully");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    }
  };

  const handleDeleteMedia = async (productId: string, type: "image" | "video") => {
    console.log("ProductManagement: Deleting media for product:", productId, type);
    try {
      const updateData = type === "image" ? { image_url: null } : { video_url: null };
      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (error) throw error;
      toast.success(`${type} deleted successfully`);
    } catch (error) {
      console.error("Error deleting media:", error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleMediaClick = (type: "image" | "video", url: string) => {
    console.log("ProductManagement: Media clicked:", type, url);
    window.open(url, "_blank");
  };

  const handleAddProduct = async (product: Partial<Product>) => {
    try {
      // Validate required fields
      if (!product.name) {
        toast.error("Product name is required");
        return;
      }

      if (!product.video_url) {
        toast.error("Video is required");
        return;
      }

      // Extract frame from video
      const videoResponse = await fetch(product.video_url);
      const videoBlob = await videoResponse.blob();
      const videoFile = new File([videoBlob], 'video.mp4', { type: 'video/mp4' });
      
      // Extract the first frame as WebP
      const { webpBlob } = await extractVideoFrame(videoFile);

      // Create a new product
      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert([
          {
            name: product.name as string,
            description: product.description,
            strain: product.strain,
            stock: product.stock,
            regular_price: product.regular_price,
            shipping_price: product.shipping_price,
            video_url: product.video_url,
            primary_media_type: "video",
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload the extracted frame
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(`products/${newProduct.id}/thumbnail.webp`, webpBlob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded image
      const { data: { publicUrl: imageUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(`products/${newProduct.id}/thumbnail.webp`);

      // Update the product with the image URL
      const { error: updateError } = await supabase
        .from("products")
        .update({
          image_url: imageUrl,
          media: {
            webp: imageUrl
          }
        })
        .eq("id", newProduct.id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAddDialog(false);
      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
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

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "name",
    direction: "asc",
  });

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

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
          products={products}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onEditChange={handleEditChange}
          editingProduct={editingProduct}
          editValues={editValues}
          onDelete={handleDelete}
          onImageUpload={handleImageUpload}
          onVideoUpload={handleVideoUpload}
          onDeleteMedia={handleDeleteMedia}
          onMediaClick={handleMediaClick}
        />
      ) : (
        <ProductTable
          products={products}
          editingProduct={editingProduct}
          editValues={editValues}
          visibleColumns={visibleColumns}
          onEditStart={handleEditStart}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onEditChange={handleEditChange}
          onDelete={handleDelete}
          onImageUpload={handleImageUpload}
          onVideoUpload={handleVideoUpload}
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
      />
    </div>
  );
}
