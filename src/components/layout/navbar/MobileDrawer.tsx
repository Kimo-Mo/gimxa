'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { User, LogOut, X } from 'lucide-react';
import { Button, Sheet, SheetContent, SheetClose, SheetTitle } from '@/components/ui';
import { NAV_LINKS } from './navLinks';
interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function MobileDrawer({
  open,
  onClose,
  isAuthenticated,
  onLogin,
  onLogout,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-75 p-0 flex flex-col bg-background border-border"
        aria-describedby={undefined}>
        {/* ── Header ── */}
        <SheetTitle>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Link href="/" className="font-bold text-2xl text-primary">
              Gimxa
            </Link>
            <SheetClose asChild>
              <button className="rounded-lg p-1.5 bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </SheetClose>
          </div>
        </SheetTitle>

        {/* ── Navigation Links ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label, icon, description }) => {
            const isActive = pathname === href;
            const isCategoryActive = href.includes('category') && params.get('category') === href.split('category=')[1];
            return (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                    isActive || isCategoryActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary'
                      : 'hover:bg-muted text-foreground/80 hover:text-foreground'
                  }`}>
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive || isCategoryActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{description}</p>
                  </div>
                  {(isActive || isCategoryActive) && <div className="size-1.5 rounded-full bg-primary shrink-0" />}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="px-4 py-4 border-t border-border">
          {isAuthenticated ? (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
              <div className="size-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <LogOut size={18} className="text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Sign Out</p>
                <p className="text-xs text-destructive/70">End your session</p>
              </div>
            </button>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={() => {
                onLogin();
                onClose();
              }}>
              <User size={16} />
              Sign In
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
