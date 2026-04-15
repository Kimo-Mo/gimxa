'use client';

import { useCartStore } from '@/lib/stores/useCartStore';
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@/components/ui';
import { orderService } from '@/services/order.service';
import { paymentService } from '@/services/payment.service';
import { cartService } from '@/services/cart.service';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useAuthModal } from '@/providers/AuthModalProvider';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Loading from '@/app/loading';
import { useRouter } from 'next/navigation';
import type { ApiResponse } from '@/types';


interface CheckoutOrderResponse {
  order_number: string;
  total_price: string;
}

interface PaymentGateway {
  id: number;
  gateway_code?: string;
  name: string;
  tax_rate: string;
  description: string;
  icon: string | null;
}

interface InitPaymentResponse {
  client_secret?: string;
  payment_intent_id?: string;
  checkout_url?: string;
  gateway_order_id?: string;
}

interface CartSummaryResponse {
  subtotal: string;
  discount: string;
  total_after_discount: string;
}

const extractResponseData = <T,>(response: T | ApiResponse<T>): T =>
  typeof response === 'object' && response !== null && 'status' in response
    ? ((response as ApiResponse<T>).data as T)
    : (response as T);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, _hasHydrated, syncWithServer } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModal();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<number | null>(null);
  const [subtotal, setSubtotal] = useState(getTotal());
  const [discount, setDiscount] = useState(0);
  const [totalAfterDiscount, setTotalAfterDiscount] = useState(getTotal());
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const autoPayTriggeredRef = useRef(false);

  const currencySymbol = useMemo(() => {
    const currency = items[0]?.product?.currency || 'USD';
    return currency === 'USD' ? '$' : currency;
  }, [items]);

  const loadCartSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    setError(null);
    try {
      await syncWithServer();
      const cartResponse = await cartService.getCart();
      const cartData = extractResponseData<CartSummaryResponse>(
        cartResponse as CartSummaryResponse | ApiResponse<CartSummaryResponse>
      );
      setSubtotal(Number(cartData.subtotal || 0));
      setDiscount(Number(cartData.discount || 0));
      setTotalAfterDiscount(Number(cartData.total_after_discount || 0));
    } catch {
      setSubtotal(getTotal());
      setDiscount(0);
      setTotalAfterDiscount(getTotal());
      setError('Failed to load latest totals');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [getTotal, syncWithServer]);

  const loadGateways = useCallback(async () => {
    try {
      const response = await paymentService.getGateways();
      const availableGateways = (response as PaymentGateway[]) || [];
      setGateways(availableGateways);
      if (availableGateways.length > 0) {
        setSelectedGatewayId(availableGateways[0].id);
      }
    } catch {
      setError('Failed to load payment gateways');
    }
  }, []);

  const processPayment = useCallback(async () => {
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('pendingCheckoutPay', '1');
      }
      openModal('login');
      setInfo('Please login to continue payment');
      return;
    }

    if (!selectedGatewayId) {
      setError('No payment gateway available');
      return;
    }

    setIsProcessingPayment(true);
    setError(null);
    setInfo(null);

    try {
      const checkoutResponse = await orderService.checkout();
      const checkoutData = extractResponseData<CheckoutOrderResponse>(
        checkoutResponse as CheckoutOrderResponse | ApiResponse<CheckoutOrderResponse>
      );
      const selectedGateway = gateways.find((gateway) => gateway.id === selectedGatewayId);
      if (!selectedGateway) {
        throw new Error('Payment gateway not found');
      }
      const gatewayCode =
        selectedGateway.gateway_code ||
        (selectedGateway.name.toLowerCase().includes('stripe')
          ? 'stripe'
          : selectedGateway.name.toLowerCase().includes('paymob')
            ? 'paymob'
            : '');
      if (!gatewayCode) {
        throw new Error('Unsupported payment gateway');
      }

      const paymentResponse = (await paymentService.initPayment({
        order_id: checkoutData.order_number,
        gateway_code: gatewayCode,
      })) as InitPaymentResponse;

      if (typeof window !== 'undefined' && paymentResponse.checkout_url) {
        window.location.href = paymentResponse.checkout_url;
        return;
      }

      if (paymentResponse.client_secret) {
        setInfo('Payment has been initialized successfully. Continue in payment gateway.');
      } else {
        setInfo('Order created successfully.');
      }
      await syncWithServer();
      router.push('/orders');
    } catch {
      setError('Payment initialization failed. Please try again.');
    } finally {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('pendingCheckoutPay');
      }
      setIsProcessingPayment(false);
    }
  }, [gateways, isAuthenticated, openModal, router, selectedGatewayId, syncWithServer]);

  useEffect(() => {
    loadCartSummary();
    loadGateways();
  }, [loadCartSummary, loadGateways]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasPendingPay = window.sessionStorage.getItem('pendingCheckoutPay') === '1';
    if (isAuthenticated && hasPendingPay && !autoPayTriggeredRef.current) {
      autoPayTriggeredRef.current = true;
      processPayment();
    }
  }, [isAuthenticated, selectedGatewayId, gateways.length, processPayment]);

  if (!_hasHydrated) return <Loading />;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground">Review total and complete payment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cart Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>
              {currencySymbol}
              {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span>
              - {currencySymbol}
              {discount.toFixed(2)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>
              {currencySymbol}
              {totalAfterDiscount.toFixed(2)}
            </span>
          </div>
          {isLoadingSummary && <p className="text-xs text-muted-foreground">Loading summary...</p>}
          {info && <p className="text-xs text-primary">{info}</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button
            onClick={processPayment}
            disabled={isProcessingPayment || gateways.length === 0}
            className="w-full h-12 text-base">
            {isProcessingPayment ? 'Processing...' : 'Pay'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
