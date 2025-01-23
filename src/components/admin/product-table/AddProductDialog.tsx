import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";

type Product = Tables<"products">;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (product: Partial<Product>) => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  onSave,
}: AddProductDialogProps) {
  const [values, setValues] = useState<Partial<Product>>({
    name: "",
    description: "",
    strain: "",
    stock: 0,
    regular_price: 0,
    shipping_price: 0,
  });

  const handleSave = () => {
    if (!values.name) {
      toast.error("Product name is required");
      return;
    }
    onSave(values);
    setValues({
      name: "",
      description: "",
      strain: "",
      stock: 0,
      regular_price: 0,
      shipping_price: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="strain">Strain</Label>
            <Input
              id="strain"
              value={values.strain}
              onChange={(e) => setValues({ ...values, strain: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={values.stock?.toString()}
              onChange={(e) => setValues({ ...values, stock: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="regular_price">Regular Price</Label>
            <Input
              id="regular_price"
              type="number"
              step="0.01"
              value={values.regular_price?.toString()}
              onChange={(e) => setValues({ ...values, regular_price: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shipping_price">Shipping Price</Label>
            <Input
              id="shipping_price"
              type="number"
              step="0.01"
              value={values.shipping_price?.toString()}
              onChange={(e) => setValues({ ...values, shipping_price: parseFloat(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}