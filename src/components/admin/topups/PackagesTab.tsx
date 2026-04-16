import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PackageForm, StockMode } from './types';

interface PackagesTabProps {
  packages: PackageForm[];
  addPackage: () => void;
  updatePackage: (i: number, key: keyof PackageForm, value: unknown) => void;
  handleSavePackages?: () => void;
  savingPackages?: boolean;
  setDeleteTarget: (target: { type: 'field' | 'package'; id: number } | null) => void;
  pkgErrors: Record<number, Record<string, string>>;
  setPkgErrors: (e: (prev: Record<number, Record<string, string>>) => Record<number, Record<string, string>>) => void;
  hideSaveButton?: boolean;
  removePackageLocally?: (i: number) => void;
}

export function PackagesTab({
  packages,
  addPackage,
  updatePackage,
  handleSavePackages,
  savingPackages,
  setDeleteTarget,
  pkgErrors,
  setPkgErrors,
  hideSaveButton,
  removePackageLocally,
}: PackagesTabProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-foreground text-base">Top-Up Packages</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border gap-1"
            onClick={addPackage}>
            <Plus className="h-3 w-3" /> Add Package
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {packages.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No packages yet. Add items like &quot;100 Diamonds&quot;, &quot;500 UC&quot;, etc.
          </p>
        ) : (
          packages.map((pkg, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-foreground">Package {i + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (pkg.id) setDeleteTarget({ type: 'package', id: pkg.id });
                    else if (removePackageLocally) removePackageLocally(i);
                  }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-foreground text-xs">Package Name *</Label>
                  <input
                    value={pkg.name}
                    onChange={(e) => {
                      updatePackage(i, 'name', e.target.value);
                      setPkgErrors((prev) => {
                        const n = { ...prev };
                        if (n[i]) delete n[i].name;
                        return n;
                      });
                    }}
                    placeholder="e.g. 100 Diamonds"
                    className={`flex h-8 w-full rounded-md border px-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring ${pkgErrors[i]?.name ? 'border-destructive' : 'border-border'}`}
                  />
                  {pkgErrors[i]?.name && (
                    <p className="text-xs text-destructive">{pkgErrors[i].name}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">
                    Amount * <span className="text-muted-foreground">(e.g. 100)</span>
                  </Label>
                  <input
                    value={pkg.amount}
                    onChange={(e) => {
                      updatePackage(i, 'amount', e.target.value);
                      setPkgErrors((prev) => {
                        const n = { ...prev };
                        if (n[i]) delete n[i].amount;
                        return n;
                      });
                    }}
                    type="number"
                    placeholder="100"
                    className={`flex h-8 w-full rounded-md border px-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring ${pkgErrors[i]?.amount ? 'border-destructive' : 'border-border'}`}
                  />
                  {pkgErrors[i]?.amount && (
                    <p className="text-xs text-destructive">{pkgErrors[i].amount}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Price ($) *</Label>
                  <input
                    type="number"
                    min={0}
                    value={pkg.price}
                    onChange={(e) => {
                      updatePackage(i, 'price', e.target.value);
                      setPkgErrors((prev) => {
                        const n = { ...prev };
                        if (n[i]) delete n[i].price;
                        return n;
                      });
                    }}
                    placeholder="0.00"
                    className={`flex h-8 w-full rounded-md border px-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring ${pkgErrors[i]?.price ? 'border-destructive' : 'border-border'}`}
                  />
                  {pkgErrors[i]?.price && (
                    <p className="text-xs text-destructive">{pkgErrors[i].price}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Stock Mode</Label>
                  <Select
                    value={pkg.stock_mode}
                    onValueChange={(v) => updatePackage(i, 'stock_mode', v as StockMode)}>
                    <SelectTrigger className="bg-background border-border h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {pkg.stock_mode === 'manual' && (
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-xs">Fulfillment Time (min) *</Label>
                    <input
                      type="number"
                      min={1}
                      value={pkg.manual_fulfillment_time}
                      onChange={(e) => {
                        updatePackage(i, 'manual_fulfillment_time', e.target.value);
                        setPkgErrors((prev) => {
                          const n = { ...prev };
                          if (n[i]) delete n[i].manual_fulfillment_time;
                          return n;
                        });
                      }}
                      placeholder="e.g. 30"
                      className={`flex h-8 w-full rounded-md border px-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring ${pkgErrors[i]?.manual_fulfillment_time ? 'border-destructive' : 'border-border'}`}
                    />
                    {pkgErrors[i]?.manual_fulfillment_time && (
                      <p className="text-xs text-destructive">
                        {pkgErrors[i].manual_fulfillment_time}
                      </p>
                    )}
                  </div>
                )}
                {pkg.stock_mode === 'automatic' && (
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label className="text-foreground text-xs">
                      {pkg.id ? 'Add More Fulfillment Codes' : 'Fulfillment Codes *'}{' '}
                      <span className="text-muted-foreground font-normal">(one per line)</span>
                    </Label>
                    <textarea
                      value={pkg.codes || ''}
                      onChange={(e) => {
                        updatePackage(i, 'codes', e.target.value);
                        setPkgErrors((prev) => {
                          const n = { ...prev };
                          if (n[i]) delete n[i].codes;
                          return n;
                        });
                      }}
                      placeholder={"CODE-AAAA-1111\nCODE-BBBB-2222"}
                      rows={4}
                      className={`flex w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono ${pkgErrors[i]?.codes ? 'border-destructive' : 'border-border'}`}
                    />
                    {pkgErrors[i]?.codes && (
                      <p className="text-xs text-destructive">{pkgErrors[i].codes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {(pkg.codes || '').split('\n').filter((c) => c.trim()).length} code(s) entered
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                {(['is_active', 'is_popular'] as const).map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={pkg[key]}
                      onChange={(e) => updatePackage(i, key, e.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    {key === 'is_active' ? 'Active' : 'Popular'}
                  </label>
                ))}
              </div>
            </div>
          ))
        )}
        {!hideSaveButton && packages.length > 0 && handleSavePackages && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSavePackages}
              disabled={savingPackages}
              className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2">
              {savingPackages ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingPackages ? 'Saving…' : 'Save Packages'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
