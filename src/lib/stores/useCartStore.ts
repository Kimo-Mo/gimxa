import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, CartResponse, Product, TopUpPackage } from '@/types';
import { catalogService } from '@/services/catalog.service';
import { topupService } from '@/services/topup.service';
import { cartService } from '@/services/cart.service';
import type { ApiResponse } from '@/types';

type CartAction = 'idle' | 'sync' | 'add' | 'remove' | 'update' | 'clear' | 'refresh';

interface ServerCartItem {
  product: {
    id: number;
    name: string;
    slug: string;
    is_topup: boolean;
  };
  topup_package?: number;
  quantity: number;
  unit_price: string;
  topup_data?: Record<string, string | number> | null;
}

interface CartState {
  items: CartItem[];
  _hasHydrated: boolean;
  isLoading: boolean;
  status: CartAction;
  successMessage: string | null;
  error: string | null;
  setHasHydrated: (state: boolean) => void;
  addItem: (
    product: Product,
    quantity?: number,
    formData?: Record<string, string>
  ) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  syncWithServer: () => Promise<void>;
  refreshCartPrices: () => Promise<void>;
  clearMessages: () => void;
  resetCartState: () => void;
}

const isApiEnvelope = <T>(value: T | ApiResponse<T>): value is ApiResponse<T> =>
  typeof value === 'object' && value !== null && 'status' in value;

const normalizeFormData = (
  formData?: Record<string, string> | Record<string, string | number> | null
): Record<string, string> => {
  if (!formData) return {};
  return Object.entries(formData).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
};

const buildCartItemId = (productId: number, formData?: Record<string, string>) => {
  let cartItemId = `${productId}`;
  if (formData && Object.keys(formData).length > 0) {
    const formSignature = Object.keys(formData)
      .sort()
      .map((key) => `${key}=${formData[key]}`)
      .join('&');
    cartItemId += `-${encodeURIComponent(formSignature)}`;
  }
  return cartItemId;
};

const getTopupPackageId = (formData?: Record<string, string>) => Number(formData?.package_id);

const getTopupDataForApi = (
  formData?: Record<string, string>
): Record<string, string> | undefined => {
  if (!formData) return undefined;
  const filteredEntries = Object.entries(formData).filter(
    ([key]) => !key.toLowerCase().startsWith('package_')
  );
  if (filteredEntries.length === 0) return undefined;
  return Object.fromEntries(filteredEntries);
};

const extractCartResponse = (
  response: CartResponse | ApiResponse<CartResponse>
): CartResponse | null => {
  if (isApiEnvelope<CartResponse>(response)) {
    return response.data ?? null;
  }
  return response;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _hasHydrated: false,
      isLoading: false,
      status: 'idle',
      successMessage: null,
      error: null,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      clearMessages: () => set({ successMessage: null, error: null }),
      resetCartState: () =>
        set({
          items: [],
          isLoading: false,
          status: 'idle',
          successMessage: null,
          error: null,
        }),

      addItem: async (product, quantity = 1, formData) => {
        const previousItems = get().items;
        const normalizedFormData = normalizeFormData(formData);
        const cartItemId = buildCartItemId(product.id, normalizedFormData);

        set({ isLoading: true, status: 'add', error: null, successMessage: null });
        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          }
          const newItem: CartItem = {
            id: cartItemId,
            product,
            quantity,
            formData: normalizedFormData,
          };
          return { items: [...state.items, newItem] };
        });

        try {
          await cartService.addToCart({
            product_slug: product.slug,
            quantity,
            topup_package_id: product.is_topup ? getTopupPackageId(normalizedFormData) : undefined,
            topup_data: product.is_topup ? getTopupDataForApi(normalizedFormData) : undefined,
          });
          await get().syncWithServer();
          set({
            isLoading: false,
            status: 'add',
            successMessage: 'Item added to cart successfully',
            error: null,
          });
        } catch {
          set({
            items: previousItems,
            isLoading: false,
            status: 'add',
            error: 'Failed to add item to cart',
            successMessage: null,
          });
        }
      },

      removeItem: async (cartItemId) => {
        const previousItems = get().items;
        const itemToDelete = previousItems.find((item) => item.id === cartItemId);
        if (!itemToDelete) return;

        set({ isLoading: true, status: 'remove', error: null, successMessage: null });
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
        try {
          await cartService.deleteCartItem({
            product_slug: itemToDelete.product.slug,
            quantity: itemToDelete.quantity,
            topup_package_id: itemToDelete.product.is_topup
              ? getTopupPackageId(itemToDelete.formData)
              : undefined,
            topup_data: itemToDelete.product.is_topup
              ? getTopupDataForApi(itemToDelete.formData)
              : undefined,
          });
          await get().syncWithServer();
          set({
            isLoading: false,
            status: 'remove',
            successMessage: 'Item removed successfully',
            error: null,
          });
        } catch {
          set({
            items: previousItems,
            isLoading: false,
            status: 'remove',
            error: 'Failed to remove item from cart',
            successMessage: null,
          });
        }
      },

      updateQuantity: async (cartItemId, quantity) => {
        const previousItems = get().items;
        const itemToUpdate = previousItems.find((item) => item.id === cartItemId);
        if (!itemToUpdate) return;

        set({ isLoading: true, status: 'update', error: null, successMessage: null });
        set((state) => ({
          items: state.items
            .map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        }));

        try {
          await cartService.updateCartItem({
            product_slug: itemToUpdate.product.slug,
            quantity,
            topup_package_id: itemToUpdate.product.is_topup
              ? getTopupPackageId(itemToUpdate.formData)
              : undefined,
            topup_data: itemToUpdate.product.is_topup
              ? getTopupDataForApi(itemToUpdate.formData)
              : undefined,
          });
          await get().syncWithServer();
          set({
            isLoading: false,
            status: 'update',
            successMessage: 'Cart updated successfully',
            error: null,
          });
        } catch {
          set({
            items: previousItems,
            isLoading: false,
            status: 'update',
            error: 'Failed to update cart',
            successMessage: null,
          });
        }
      },

      clearCart: async () => {
        const previousItems = get().items;
        set({ isLoading: true, status: 'clear', error: null, successMessage: null, items: [] });
        try {
          await cartService.clearCart();
          set({
            isLoading: false,
            status: 'clear',
            successMessage: 'Cart cleared successfully',
            error: null,
          });
        } catch {
          set({
            items: previousItems,
            isLoading: false,
            status: 'clear',
            error: 'Failed to clear cart',
            successMessage: null,
          });
        }
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.price || 0;
          return total + price * item.quantity;
        }, 0);
      },
      syncWithServer: async () => {
        set({ isLoading: true, status: 'sync', error: null });
        try {
          const response = await cartService.getCart();
          const cartData = extractCartResponse(
            response as CartResponse | ApiResponse<CartResponse>
          );
          const serverItems = (cartData?.items || []) as ServerCartItem[];

          const hydratedItems: CartItem[] = await Promise.all(
            serverItems.map(async (item) => {
              const product = await catalogService.publicProductDetail(item.product.slug);
              const topupPackage =
                product.is_topup &&
                (await topupService
                  .publicPackagesList(item.product.slug)
                  .then((res) => res.results)
                  .then((pkg) =>
                    pkg.find((pkg: TopUpPackage) => pkg.id === Number(item.topup_package))
                  ));
              const normalizedTopupData = normalizeFormData(
                topupPackage
                  ? {
                      ...item.topup_data,
                      package_id: topupPackage.id,
                      package_name: topupPackage.name,
                      package_price: topupPackage.price,
                      package_currency: topupPackage.currency,
                      package_amount: topupPackage.amount,
                    }
                  : item.topup_data || {}
              );
              const id = buildCartItemId(product.id, normalizedTopupData);
              return {
                id,
                product: {
                  ...product,
                  price: Number(item.unit_price),
                },
                quantity: item.quantity,
                formData: normalizedTopupData,
                topup_data: normalizedTopupData,
                unit_price: item.unit_price,
              };
            })
          );

          set({
            items: hydratedItems,
            isLoading: false,
            status: 'sync',
            error: null,
          });
        } catch {
          set({
            isLoading: false,
            status: 'sync',
            error: 'Failed to sync cart with server',
          });
        }
      },
      refreshCartPrices: async () => {
        set({ isLoading: true, status: 'refresh', error: null, successMessage: null });
        const currentItems = get().items;
        if (currentItems.length === 0) {
          set({ isLoading: false, status: 'refresh' });
          return;
        }

        try {
          const updatedItems = await Promise.all(
            currentItems.map(async (item) => {
              try {
                let freshPrice = item.product.price;
                let freshCurrency = item.product.currency;

                if (item.product.product_type === 'topup') {
                  const pkgData = await topupService
                    .publicPackagesList(item.product.slug)
                    .then((res) => res.results);
                  const topupPackage = pkgData.find(
                    (pkg: TopUpPackage) => pkg.id === Number(item.formData?.package_id)
                  );

                  if (topupPackage) {
                    freshPrice = topupPackage.price;
                    freshCurrency = topupPackage.currency;
                  }
                } else {
                  const productData = await catalogService.publicProductDetail(item.product.slug);

                  if (productData) {
                    freshPrice = productData.price;
                    freshCurrency = productData.currency;
                  }
                }

                return {
                  ...item,
                  product: {
                    ...item.product,
                    price: freshPrice ?? item.product.price,
                    currency: freshCurrency ?? item.product.currency,
                  },
                };
              } catch (err) {
                console.error(`Failed to refresh price for ${item.product.name}`, err);
                return item;
              }
            })
          );

          set({
            items: updatedItems,
            isLoading: false,
            status: 'refresh',
            successMessage: 'Cart prices refreshed',
            error: null,
          });
        } catch (error) {
          console.error('Failed to refresh cart prices', error);
          set({
            isLoading: false,
            status: 'refresh',
            successMessage: null,
            error: 'Failed to refresh cart prices',
          });
        }
      },
    }),

    {
      name: 'gimxa-cart-storage',
      // Ensure UI is only rendered after state is rehydrated to prevent hydration errors
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
    }
  )
);
