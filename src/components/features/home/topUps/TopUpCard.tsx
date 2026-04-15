import { TopUp} from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';

export const TopUpCard = ({ item }: { item: TopUp }) => {
  return (
    <Link href={`/topup/${item?.product.slug}`} className="group block h-full">
      <div className="relative h-full flex flex-col rounded-2xl overflow-hidden bg-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {item?.product.main_image?.image ? (
            <Image
              src={getImageUrl(item?.product.main_image.image)}
              alt={item?.product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <div className="p-4 space-y-4 flex flex-col flex-1">
          <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors capitalize">
            {item?.product.name}
          </h3>
          <div className="mt-auto">
            <Button className="w-full cursor-pointer" variant="default">
              Top Up Now
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
