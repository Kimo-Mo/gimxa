'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useAuthModal } from '@/providers/AuthModalProvider';
import { couponService } from '@/services/coupon.service';
import { cartService } from '@/services/cart.service';
import { Button } from '@/components/ui';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Separator } from '@/components/ui';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/types';

interface CouponSummary {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string | number;
  scope?: string;
}

interface ValidateCouponResponse {
  coupon: CouponSummary;
  discount: {
    total_discount: string;
    cart_subtotal: string;
    cart_total_after_discount: string;
    applicable_items_count: number;
  };
  currency: string;
}

interface ApplyCouponResponse {
  coupon: CouponSummary;
  subtotal: string;
  discount: string;
  total_after_discount: string;
  applicable_items_count: number;
  currency: string;
}

interface CartSummaryResponse {
  coupon: CouponSummary | null;
  subtotal: string;
  discount: string;
  total_after_discount: string;
}

const extractResponseData = <T,>(response: T | ApiResponse<T>): T =>
  typeof response === 'object' && response !== null && 'status' in response
    ? ((response as ApiResponse<T>).data as T)
    : (response as T);

const toNumber = (value: string | number | null | undefined) => Number(value ?? 0);

export default function CartSummary() {
  const items = useCartStore((state) => state.items);
  const localTotal = useCartStore((state) => state.getTotal());
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModal();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponSummary | null>(null);
  const [subtotal, setSubtotal] = useState(localTotal);
  const [discount, setDiscount] = useState(0);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(localTotal);
  const [isFetchingSummary, setIsFetchingSummary] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isRemovingCoupon, setIsRemovingCoupon] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currency = items[0]?.product?.currency === 'USD' ? '$' : items[0]?.product?.currency;
  const isCouponDisabled = !isAuthenticated || isApplyingCoupon || isRemovingCoupon;

  const applyLocalSummary = useCallback(() => {
    setSubtotal(localTotal);
    setDiscount(0);
    setTotalAfterDiscount(localTotal);
    setAppliedCoupon(null);
  }, [localTotal]);

  const couponDescription = useMemo(() => {
    if (!appliedCoupon) return null;
    if (appliedCoupon.discount_type === 'percent') {
      return `${toNumber(appliedCoupon.discount_value).toFixed(2)}% off`;
    }
    return `${currency}${toNumber(appliedCoupon.discount_value).toFixed(2)} off`;
  }, [currency, appliedCoupon]);

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated) {
      applyLocalSummary();
      return;
    }

    setIsFetchingSummary(true);
    setError(null);
    try {
      const response = await cartService.getCart();
      const data = extractResponseData<CartSummaryResponse>(
        response as CartSummaryResponse | ApiResponse<CartSummaryResponse>
      );

      const serverSubtotal = toNumber(data.subtotal);
      const serverDiscount = toNumber(data.discount);
      const serverTotal = toNumber(data.total_after_discount);
      const shouldFallbackToLocal = serverSubtotal <= 0 && serverTotal <= 0 && localTotal > 0;

      if (shouldFallbackToLocal) {
        applyLocalSummary();
        return;
      }

      setAppliedCoupon(data.coupon);
      setCouponCode(data.coupon?.code || '');
      setSubtotal(serverSubtotal);
      setDiscount(serverDiscount);
      setTotalAfterDiscount(serverTotal);
    } catch (err: unknown) {
      applyLocalSummary();
      if (!isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError('Failed to load cart summary');
      }
    } finally {
      setIsFetchingSummary(false);
    }
  }, [applyLocalSummary, isAuthenticated, localTotal]);

  useEffect(() => {
    // Instant local total reaction while remote coupon summary refreshes.
    setSubtotal(localTotal);
    if (!appliedCoupon || !isAuthenticated) {
      setTotalAfterDiscount(localTotal);
    }
  }, [appliedCoupon, isAuthenticated, localTotal]);

  useEffect(() => {
    fetchSummary();
  }, [localTotal, isAuthenticated, fetchSummary]);

  const applyCoupon = async () => {
    if (!isAuthenticated) {
      openModal('login');
      return;
    }

    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setError(null);
    setFeedback(null);
    try {
      const validateResponse = await couponService.validateCoupon({
        code: couponCode.trim().toLowerCase(),
      });
      extractResponseData<ValidateCouponResponse>(
        validateResponse as ValidateCouponResponse | ApiResponse<ValidateCouponResponse>
      );

      const applyResponse = await couponService.applyCoupon({
        code: couponCode.trim().toLowerCase(),
      });
      const appliedData = extractResponseData<ApplyCouponResponse>(
        applyResponse as ApplyCouponResponse | ApiResponse<ApplyCouponResponse>
      );

      setAppliedCoupon(appliedData.coupon);
      setSubtotal(toNumber(appliedData.subtotal));
      setDiscount(toNumber(appliedData.discount));
      setTotalAfterDiscount(toNumber(appliedData.total_after_discount));
      setFeedback('Coupon applied successfully');
    } catch {
      setError('Invalid coupon or not applicable to your cart');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = async () => {
    if (!isAuthenticated) {
      openModal('login');
      return;
    }

    setIsRemovingCoupon(true);
    setError(null);
    setFeedback(null);
    try {
      await couponService.removeCoupon({ code: appliedCoupon?.code || couponCode || 'REMOVE' });
      setAppliedCoupon(null);
      setCouponCode('');
      await fetchSummary();
      setFeedback('Coupon removed successfully');
    } catch {
      setError('Failed to remove coupon');
    } finally {
      setIsRemovingCoupon(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (isAuthenticated) {
      router.push('/checkout');
      return;
    }
    openModal('login');
  };

  if (items.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>
            {currency} {subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span>
            - {currency} {discount.toFixed(2)}
          </span>
        </div>
        {appliedCoupon && couponDescription && (
          <div className="rounded-md bg-primary/10 text-primary text-xs px-3 py-2 uppercase">
            {appliedCoupon.code} • {couponDescription}
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>
            {currency} {totalAfterDiscount.toFixed(2)}
          </span>
        </div>
        {isFetchingSummary && <p className="text-xs text-muted-foreground">Updating summary...</p>}
        {!isAuthenticated && (
          <p className="text-xs text-muted-foreground">Please log in to apply coupons.</p>
        )}
        {feedback && <p className="text-xs text-green-600">{feedback}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <div className="w-full space-y-2">
          <Input
            placeholder="Enter coupon code"
            className="uppercase"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.trim().toUpperCase())}
            disabled={isCouponDisabled}
          />
          {appliedCoupon ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={removeCoupon}
              disabled={isCouponDisabled}>
              {isRemovingCoupon ? 'Removing...' : 'Remove Coupon'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={applyCoupon}
              disabled={isCouponDisabled}>
              {isApplyingCoupon ? 'Applying...' : 'Apply Coupon'}
            </Button>
          )}
        </div>
        <Button className="w-full h-12 text-base" onClick={handleProceedToCheckout}>
          Proceed to Checkout
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/store">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
