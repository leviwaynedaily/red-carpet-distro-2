import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";
import { Check, X, Trash2, Edit } from "lucide-react";

interface ProductTableActionsProps {
  productId: string;
  isEditing: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export function ProductTableActions({
  productId,
  isEditing,
  onSave,
  onCancel,
  onDelete,
  onEdit,
}: ProductTableActionsProps) {
  return (
    <TableCell className="text-right">
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={async (e) => {
                e.stopPropagation();
                await onSave();
              }}
              aria-label="Save changes"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit product"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(productId);
              }}
              aria-label="Delete product"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </TableCell>
  );
}