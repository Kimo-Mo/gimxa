'use client';

import Link from 'next/link';
import { Search, ShoppingCart, User, Loader2, Menu } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { Badge, Button, Input } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useAuthModal } from '@/providers/AuthModalProvider';
import { Logo } from './Logo';
import { NotificationBell } from '@/components/features/notifications';
import { MobileDrawer } from './navbar/MobileDrawer';
import { UserDropdown } from './navbar/UserDropdown';
import { usePathname, useRouter } from 'next/navigation';
import { MainNavItems } from './navbar/MainNavItems';
import { catalogService } from '@/services/catalog.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/types';
import Image from 'next/image';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { getImageUrl } from '@/lib/utils';

export const Navbar = () => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useAuthModal();
  const { isAuthenticated, logout, user, isLoading, validateSession } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state._hasHydrated);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['simpleSearch', debouncedSearch],
    queryFn: () => catalogService.simpleSearch(debouncedSearch),
    enabled: debouncedSearch.length > 1,
  });
  useEffect(() => {
    if (isAuthenticated) {
      validateSession();
    }
  }, [isAuthenticated, validateSession]);

  const handleSearch = () => {
    if (search.trim()) {
      // Check if we have search results and if any are topup products
      if (searchResults?.products && searchResults.products.length > 0) {
        const hasTopupProducts = searchResults.products.some(
          (product: Product) => product.product_type === 'topup'
        );

        if (hasTopupProducts) {
          router.push(`/topups?search=${encodeURIComponent(search.trim())}`);
        } else {
          router.push(`/store?search=${encodeURIComponent(search.trim())}`);
        }
      } else {
        // Default to store if no results or no products
        router.push(`/store?search=${encodeURIComponent(search.trim())}`);
      }
      setIsSearchFocused(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
    }
  };

  const totalItems = items.length;
  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur supports-backdrop-filter:bg-black/80 flex justify-center shadow-sm text-white">
        <div className="main_container py-2">
          <div className="flex items-center justify-between gap-4">
            {/* ── Left: Menu (mobile) + Logo ── */}
            <div className="flex items-center gap-2">
              <button
                className="block md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu">
                <Menu size={20} />
              </button>
              <Logo />
            </div>
            {pathname !== '/store' && pathname !== '/' ? (
              <MainNavItems />
            ) : (
              <div className="hidden md:flex items-center w-full max-w-md lg:max-w-xl relative">
                <div className="relative w-full">
                  <Input
                    id="search"
                    name="search"
                    type="search"
                    placeholder="Search for games, gift cards and more..."
                    className="pr-10 bg-input text-foreground w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    name="search"
                    variant="secondary"
                    size="icon"
                    className="h-[calc(100%-2px)] absolute right-px top-1/2 -translate-y-1/2 cursor-pointer transition-all hover:bg-muted-foreground/10"
                    onClick={handleSearch}>
                    {isSearchLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Search size={20} />
                    )}
                  </Button>
                </div>
                {/* Search Dropdown */}
                {isSearchFocused && debouncedSearch.length > 1 && searchResults?.products && (
                  <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-md shadow-lg flex flex-col max-h-80 overflow-y-auto z-99">
                    {searchResults.products.slice(0, 5).map((product: Product, idx: number) => (
                      <Link
                        key={idx}
                        href={
                          product.product_type === 'topup'
                            ? `/topup/${product.slug}`
                            : `/product/${product.slug}`
                        }
                        className="flex items-center gap-3 p-3 hover:bg-muted transition-colors border-b border-border last:border-0">
                        {product.main_image ? (
                          <div className="w-10 h-10 relative shrink-0 bg-muted rounded overflow-hidden">
                            <Image
                              src={getImageUrl(product.main_image as string)}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 relative shrink-0 bg-muted rounded flex items-center justify-center">
                            <Search size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <span className="text-sm font-medium text-foreground truncate">
                            {product.name}
                          </span>
                          {product.price !== null && (
                            <span className="text-xs text-primary font-bold">
                              {product.currency === 'USD' ? '$' : product.currency}{' '}
                              {Number(product.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                    {searchResults.products.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No results found for &quot;{debouncedSearch}&quot;
                      </div>
                    )}
                    {searchResults.products.length > 5 && (
                      <div
                        className="p-2 text-center text-primary text-sm font-medium hover:bg-muted cursor-pointer transition-colors"
                        onMouseDown={() => handleSearch()}>
                        View all results
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Right Actions ── */}
            <nav className="flex items-center gap-2 md:gap-3">
              {/* Cart */}
              <Button variant="secondary" size="icon" className="relative">
                <Link href="/cart" className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="size-5" />
                  {hydrated && totalItems > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                      variant="default">
                      {totalItems}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Notification Bell */}
              {isAuthenticated && user && <NotificationBell />}

              {/* Auth Area */}
              {isAuthenticated && user ? (
                <UserDropdown user={user} isAdmin={isAdmin} onLogout={handleLogout} />
              ) : isLoading ? (
                <Button variant="secondary" disabled className="gap-2 opacity-70">
                  <Loader2 size={15} className="animate-spin" />
                  <span className="hidden lg:block text-sm">Loading…</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => openModal()}>
                  <User className="size-5" />
                  <span className="hidden lg:block">Login</span>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isAuthenticated={isAuthenticated}
        onLogin={() => openModal()}
        onLogout={handleLogout}
      />
    </>
  );
};
