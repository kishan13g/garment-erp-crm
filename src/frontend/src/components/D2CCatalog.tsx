import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateD2CProduct,
  useDeleteD2CProduct,
  useListD2CProducts,
  useUpdateD2CProduct,
} from "../hooks/useQueries";
import type { D2CProduct } from "../legacy-types";

type FormState = {
  name: string;
  description: string;
  price: string;
  fabricType: string;
  sizesInput: string;
  inStock: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  fabricType: "",
  sizesInput: "",
  inStock: true,
};

function EmptyState() {
  return (
    <div
      data-ocid="catalog.empty_state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <ShoppingBag className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
        No Products Yet
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Sell directly to consumers — no middlemen, higher margins. Add your
        first garment product to the catalog.
      </p>
    </div>
  );
}

function ProductFormDialog({
  trigger,
  product,
  onClose,
}: {
  trigger: React.ReactNode;
  product?: D2CProduct;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const create = useCreateD2CProduct();
  const update = useUpdateD2CProduct();

  const [form, setForm] = useState<FormState>(
    product
      ? {
          name: product.name,
          description: product.description,
          price: String(product.price),
          fabricType: product.fabricType,
          sizesInput: product.sizesAvailable.join(", "),
          inStock: product.inStock,
        }
      : EMPTY_FORM,
  );

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    const sizes = form.sizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      if (product) {
        await update.mutateAsync({
          id: product.id,
          name: form.name,
          description: form.description,
          price: Number(form.price),
          fabricType: form.fabricType,
          sizesAvailable: sizes,
          inStock: form.inStock,
        });
        toast.success("Product updated");
      } else {
        await create.mutateAsync({
          name: form.name,
          description: form.description,
          price: Number(form.price),
          fabricType: form.fabricType,
          sizesAvailable: sizes,
          inStock: form.inStock,
        });
        toast.success("Product added to catalog");
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      onClose?.();
    } catch {
      toast.error("Failed to save product");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        data-ocid={product ? "catalog.edit.dialog" : "catalog.new.dialog"}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Product Name *</Label>
            <Input
              id="cat-name"
              data-ocid="catalog.new.input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Anarkali Kurti"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              data-ocid="catalog.new.textarea"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Beautiful anarkali style kurti with flared hemline..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-price">Price (₹) *</Label>
              <Input
                id="cat-price"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="1299"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-fabric">Fabric Type</Label>
              <Input
                id="cat-fabric"
                value={form.fabricType}
                onChange={(e) =>
                  setForm((p) => ({ ...p, fabricType: e.target.value }))
                }
                placeholder="Cotton, Silk..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-sizes">Sizes Available (comma-separated)</Label>
            <Input
              id="cat-sizes"
              value={form.sizesInput}
              onChange={(e) =>
                setForm((p) => ({ ...p, sizesInput: e.target.value }))
              }
              placeholder="S, M, L, XL, XXL"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="cat-instock"
              data-ocid="catalog.new.checkbox"
              checked={form.inStock}
              onCheckedChange={(v) => setForm((p) => ({ ...p, inStock: !!v }))}
            />
            <Label htmlFor="cat-instock">In Stock</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="catalog.new.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            data-ocid="catalog.new.submit_button"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {product ? "Save Changes" : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductCard({
  product,
  index,
}: { product: D2CProduct; index: number }) {
  const deleteProduct = useDeleteD2CProduct();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <Card
      data-ocid={`catalog.item.${index}`}
      className={`border flex flex-col ${
        product.inStock
          ? "border-border/60 bg-card"
          : "border-border/30 bg-muted/30 opacity-70"
      }`}
    >
      <CardContent className="p-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground leading-tight">
            {product.name}
          </h3>
          <Badge
            variant="outline"
            className={`text-xs shrink-0 border ${
              product.inStock
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
          >
            {product.inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="text-lg font-semibold text-primary mb-2">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        {product.fabricType && (
          <p className="text-xs text-muted-foreground mb-2">
            Fabric: {product.fabricType}
          </p>
        )}
        {product.sizesAvailable.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.sizesAvailable.map((size) => (
              <Badge key={size} variant="secondary" className="text-xs">
                {size}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 gap-2">
        <ProductFormDialog
          product={product}
          trigger={
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1"
              data-ocid={`catalog.edit_button.${index}`}
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Button>
          }
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={deleteProduct.isPending}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          data-ocid={`catalog.delete_button.${index}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function D2CCatalog() {
  const { data: products = [], isLoading } = useListD2CProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            D2C Catalog
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Direct-to-consumer sales — higher margins, no middlemen
          </p>
        </div>
        <div className="flex items-center gap-3">
          {products.length > 0 && (
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {products.length}
              </span>{" "}
              products
            </span>
          )}
          <ProductFormDialog
            trigger={
              <Button
                data-ocid="catalog.new.open_modal_button"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div
          data-ocid="catalog.loading_state"
          className="flex items-center justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={String(p.id)} product={p} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
