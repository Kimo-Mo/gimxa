'use client';

import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { ShoppingCart, Zap, Headphones, ShieldCheck } from 'lucide-react';
import { Product } from '@/types';

interface ProductPriceCardProps {
  product: Product;
  onAddToCart: () => void;
  onBuyNow: () => void;
  showAddToCart?: boolean;
  buyButtonText?: string;
}

export const ProductPriceCard = ({
  product,
  onAddToCart,
  onBuyNow,
  showAddToCart = true,
  buyButtonText = 'Buy Now',
}: ProductPriceCardProps) => {
  const hasPrice = product.price !== null && product.price !== undefined;
  const fulfillmentTime = product.manual_fulfillment_time ?? 'Instant';

  return (
    <div className="space-y-4 sticky top-24">
      <Card className="p-4 border-2 border-border bg-card shadow-lg">
        {/* Price */}
        <div className="mb-5">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            {product.is_topup ? 'Starting from' : 'Price'}
          </span>
          {hasPrice ? (
            <span className="font-black text-3xl text-primary">
              {product.currency === 'USD' ? '$' : product.currency}{' '}
              {Number(product.price).toFixed(2)}
            </span>
          ) : (
            <span className="font-bold text-lg text-muted-foreground">Select a package</span>
          )}
        </div>

        {/* Stock / Availability */}
        <div className="flex items-center gap-2 mb-5">
          <span
            className={`w-2 h-2 rounded-full ${product.is_available ? 'bg-green-500' : 'bg-destructive'}`}
          />
          <span className="text-xs text-muted-foreground font-medium">
            {product.is_available ? 'In Stock' : 'Out of Stock'}
          </span>
          <span className="text-xs ml-auto capitalize">
            Dilivery:{' '}
            <span className="text-primary font-bold">
              {product.stock_mode === 'manual' ? fulfillmentTime + ' minutes' : 'instant'}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          {showAddToCart && (
            <Button
              size="lg"
              variant="outline"
              className="flex-none px-4 bg-transparent border-border hover:bg-muted"
              onClick={onAddToCart}
              disabled={!product.is_available}>
              <ShoppingCart className="w-5 h-5" />
            </Button>
          )}
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90 font-bold text-lg shadow-lg shadow-primary/25"
            onClick={onBuyNow}
            disabled={!product.is_available}>
            {buyButtonText}
          </Button>
        </div>
      </Card>

      {/* Trust Signals */}
      <div className="grid grid-cols-3 border-2 border-border bg-card shadow-lg rounded-2xl gap-2 px-2 py-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
          <span className="text-[10px] font-medium leading-tight">
            Instant
            <br />
            Delivery
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Headphones className="w-5 h-5 text-green-500" />
          <span className="text-[10px] font-medium leading-tight">
            24/7
            <br />
            Support
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/20" />
          <span className="text-[10px] font-medium leading-tight">
            Verified
            <br />
            Seller
          </span>
        </div>
      </div>
    </div>
  );
};
