import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Coins, Gamepad2 } from 'lucide-react';
import { DigitalProducts, TopUps } from '@/components/features/home';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <Tabs defaultValue="digital-products" className="w-full">
        <div className="flex justify-center mb-10">
          <TabsList className="bg-card/50 backdrop-blur-sm rounded-4xl gap-2 shadow-sm">
            <TabsTrigger value="digital-products" className="cursor-pointer">
              <Gamepad2 className="hidden sm:block size-5 mr-2" />
              Digital Products
            </TabsTrigger>
            <TabsTrigger value="direct-top-ups" className="cursor-pointer">
              <Coins className="hidden sm:block size-5 mr-2" />
              Direct Top-Ups
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="digital-products" className="mt-0 focus-visible:outline-hidden">
          <DigitalProducts />
        </TabsContent>
        <TabsContent value="direct-top-ups" className="mt-0 focus-visible:outline-hidden">
          <TopUps />
        </TabsContent>
      </Tabs>
    </div>
  );
}
