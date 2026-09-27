import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductSpecificationsProps {
  product: Product;
  className?: string;
}

export const ProductSpecifications = ({ product, className }: ProductSpecificationsProps) => {
  const hasSpecifics = product.platform || product.region || product.type || (product.attributes && product.attributes.length > 0);
  if (!hasSpecifics) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-extrabold text-foreground tracking-tight">Specifications</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {product.platform && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
            {product.platform.logo ? (
              <img src={product.platform.logo} alt={product.platform.name} className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{product.platform.name.charAt(0)}</div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Platform</span>
              <span className="text-sm font-semibold">{product.platform.name}</span>
            </div>
          </div>
        )}
        
        {product.region && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
             {product.region.logo ? (
              <img src={product.region.logo} alt={product.region.name} className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{product.region.name.charAt(0)}</div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Region</span>
              <span className="text-sm font-semibold">{product.region.name}</span>
            </div>
          </div>
        )}

        {product.type && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
             {product.type.logo ? (
              <img src={product.type.logo} alt={product.type.name} className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-xs">{product.type.name.charAt(0)}</div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Type</span>
              <span className="text-sm font-semibold">{product.type.name}</span>
            </div>
          </div>
        )}

        {product.attributes?.map((attr) => (
          <div key={attr.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{attr.name}</span>
              <span className="text-sm font-semibold">{attr.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

