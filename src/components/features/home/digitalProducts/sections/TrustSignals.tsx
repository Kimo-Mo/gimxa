'use client';

import { ShieldCheck, Zap, Headset } from 'lucide-react';

export const TrustSignals = () => {
  return (
    <section className="w-full bg-card rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 container mx-auto">
        <div className="flex flex-col items-center text-center group">
          <div className="p-4 rounded-xl bg-primary/5 group-hover:bg-primary/20 transition-all duration-300 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-foreground font-bold text-lg">Buyer Protection</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Secure transactions and personal data
          </p>
        </div>

        <div className="flex flex-col items-center text-center group">
          <div className="p-4 rounded-xl bg-warning/5 group-hover:bg-warning/20 transition-all duration-300 mb-4">
            <Zap className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-foreground font-bold text-lg">Instant Delivery</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Get your digital codes immediately after purchase
          </p>
        </div>

        <div className="flex flex-col items-center text-center group">
          <div className="p-4 rounded-xl bg-success/5 group-hover:bg-success/20 transition-all duration-300 mb-4">
            <Headset className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-foreground font-bold text-lg">Support 24 / 7</h3>
          <p className="text-muted-foreground text-sm mt-2">
            Qualified support team ready to help
          </p>
        </div>
      </div>
    </section>
  );
};
