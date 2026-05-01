import { BannerCard } from '@/components/features/home/digitalProducts/BannerCard';
import { TopupFilterTypes } from './TopUps';

interface CategoryBannersProps {
  onSelectCategory: (category: TopupFilterTypes) => void;
}

export const CategoryBanners = ({ onSelectCategory }: CategoryBannersProps) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      <BannerCard
        image="/all-categories.png"
        onClick={() => onSelectCategory('all')}
      />
      <BannerCard
        image="/mobile-games.png"
        onClick={() => onSelectCategory('topup-mobile')}
      />
      <BannerCard
        image="/services.png"
        onClick={() => onSelectCategory('topup-service')}
      />
    </div>
  );
};
