import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Calculator, IndianRupee, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface FabricEntry {
  id: string;
  name: string;
  pricePerMeter: string;
  quantity: string;
  wastePercent: number;
}

function newEntry(): FabricEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    pricePerMeter: "",
    quantity: "",
    wastePercent: 5,
  };
}

function calcRow(entry: FabricEntry) {
  const price = Number.parseFloat(entry.pricePerMeter) || 0;
  const qty = Number.parseFloat(entry.quantity) || 0;
  const totalMeters = qty * (1 + entry.wastePercent / 100);
  const cost = price * totalMeters;
  return { totalMeters, cost };
}

export function CostCalculator() {
  const [entries, setEntries] = useState<FabricEntry[]>([newEntry()]);

  const updateEntry = (
    id: string,
    field: keyof FabricEntry,
    value: string | number,
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const grandTotal = entries.reduce((sum, e) => sum + calcRow(e).cost, 0);
  const grandMeters = entries.reduce(
    (sum, e) => sum + calcRow(e).totalMeters,
    0,
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <Calculator className="w-4 h-4 text-accent-foreground" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Fabric Cost Calculator
          </h2>
          <p className="text-sm text-muted-foreground">
            Add fabric types, enter price &amp; quantity to estimate total cost
          </p>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {entries.map((entry, idx) => {
          const { totalMeters, cost } = calcRow(entry);
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Fabric #{idx + 1}
                    </CardTitle>
                    {entries.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeEntry(entry.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`name-${entry.id}`}>Fabric Name</Label>
                      <Input
                        id={`name-${entry.id}`}
                        data-ocid="cost.fabric.input"
                        placeholder="e.g. Main Fabric"
                        value={entry.name}
                        onChange={(e) =>
                          updateEntry(entry.id, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`price-${entry.id}`}>
                        Price / Meter (₹)
                      </Label>
                      <Input
                        id={`price-${entry.id}`}
                        data-ocid="cost.price.input"
                        type="number"
                        min="0"
                        placeholder="e.g. 250"
                        value={entry.pricePerMeter}
                        onChange={(e) =>
                          updateEntry(entry.id, "pricePerMeter", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`qty-${entry.id}`}>
                        Quantity (meters)
                      </Label>
                      <Input
                        id={`qty-${entry.id}`}
                        data-ocid="cost.quantity.input"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="e.g. 2.5"
                        value={entry.quantity}
                        onChange={(e) =>
                          updateEntry(entry.id, "quantity", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Waste Allowance</Label>
                      <span className="text-primary font-semibold">
                        {entry.wastePercent}%
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={30}
                      step={1}
                      value={[entry.wastePercent]}
                      onValueChange={([v]) =>
                        updateEntry(entry.id, "wastePercent", v)
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>30%</span>
                    </div>
                  </div>

                  {(Number.parseFloat(entry.quantity) > 0 ||
                    Number.parseFloat(entry.pricePerMeter) > 0) && (
                    <div className="rounded-lg bg-secondary/50 border border-border/40 px-4 py-3 flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Total with waste:{" "}
                        </span>
                        <span className="font-semibold text-foreground">
                          {totalMeters.toFixed(2)} m
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Subtotal:{" "}
                        </span>
                        <span className="font-bold text-primary">
                          ₹{cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <Button
        variant="outline"
        className="w-full border-dashed gap-2"
        data-ocid="cost.add_button"
        onClick={() => setEntries((prev) => [...prev, newEntry()])}
      >
        <Plus className="w-4 h-4" />
        Add Fabric Type
      </Button>

      {entries.some((e) => Number.parseFloat(e.quantity) > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground text-lg">
                  Summary
                </h3>
              </div>
              <Separator className="mb-4" />
              <div className="space-y-2">
                {entries.map((e, idx) => {
                  const { totalMeters, cost } = calcRow(e);
                  if (
                    !Number.parseFloat(e.quantity) &&
                    !Number.parseFloat(e.pricePerMeter)
                  )
                    return null;
                  return (
                    <div key={e.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {e.name || `Fabric #${idx + 1}`} (
                        {totalMeters.toFixed(2)} m)
                      </span>
                      <span className="font-medium">₹{cost.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Total fabric:{" "}
                  <span className="font-semibold text-foreground">
                    {grandMeters.toFixed(2)} m
                  </span>
                </div>
                <div className="text-xl font-bold text-primary">
                  ₹{grandTotal.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
