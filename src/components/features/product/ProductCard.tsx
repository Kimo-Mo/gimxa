'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductImage } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui';
import { Badge } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';
interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority }: ProductCardProps) {
  const category = product.categories?.[0]?.name ?? '';
  const typeLabel = product.is_topup ? 'Top-up' : 'Key';

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <Card className="h-full bg-card/50 border-border overflow-hidden hover:border-primary/50 transition-colors duration-300 py-0">
        <div className="relative aspect-16/12 overflow-hidden">
          {product.main_image ? (
            <Image
              src={getImageUrl((product.main_image as ProductImage).image)}
              alt={product.name}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}

          {!product.is_available && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Out of Stock
              </span>
            </div>
          )}

          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-[10px] h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {typeLabel}
          </Badge>
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors capitalize">
            {product.name}
          </h3>

          {category && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
              {category}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 pt-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">
              {product.currency === 'USD' ? '$' : product.currency}{' '}
              {Number(product.price ?? 0).toFixed(2)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
