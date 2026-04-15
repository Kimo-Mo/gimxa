'use client';

import { Product } from '@/types';

interface ProductInfoProps {
  product: Product;
}

export const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div className="space-y-6">
      {/* Short Description */}
      {product.short_description && (
        <p className="text-muted-foreground text-sm leading-relaxed">{product.short_description}</p>
      )}

      {/* Info / Additional Notes */}
      {product.info && (
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground">Additional Info</h3>
          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
            {product.info}
          </p>
        </div>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border uppercase">
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {product.attributes && product.attributes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground">Specifications</h3>
          <div className="rounded-xl border border-border overflow-hidden w-fit">
            {product.attributes.map((attr, i) => (
              <div
                key={attr.id}
                className={`flex items-center justify-between px-4 py-3 text-sm capitalize gap-2 ${
                  i % 2 === 0 ? 'bg-muted/30' : ''
                }`}>
                <span className="font-medium text-foreground">{attr.name}:</span>
                <span className="text-muted-foreground">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Description */}
      {product.description && (
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground">About this product</h3>
          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}
    </div>
  );
};
