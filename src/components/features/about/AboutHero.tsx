import { Rocket } from 'lucide-react';

export const AboutHero = () => {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-card border border-border/50 p-8 md:p-16 text-center space-y-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-linear-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold animate-pulse">
          <Rocket size={16} />
          <span>Powering your gaming journey</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black tracking-tightest text-foreground">
          Level Up Your <span className="text-primary">Digital Experience</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Gimxa is your ultimate destination for instant game top up, digital gift cards, and
          premium software keys. We bridge the gap between gamers and their favorite experiences.
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute -left-20 -top-20 size-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute -right-20 -bottom-20 size-64 bg-primary/20 rounded-full blur-[100px]" />
    </section>
  );
};
