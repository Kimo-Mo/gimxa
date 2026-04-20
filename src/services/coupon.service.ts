import api from '../lib/api/axios';
import {
  CouponValidatePayload,
  CouponApplyPayload,
  CouponRemovePayload,
} from '@/types';
import {
  AdminCouponPayload,
  AdminAddResourceToCouponPayload,
} from '@/types/admin/coupons';

export const couponService = {
  // Public
  getCouponDetail: async (code: string) => {
    const { data } = await api.get(`/coupons/${code}/`);
    return data;
  },
  validateCoupon: async (payload: CouponValidatePayload) => {
    const { data } = await api.post('/coupons/validate/', payload);
    return data;
  },
  applyCoupon: async (payload: CouponApplyPayload) => {
    const { data } = await api.post('/coupons/apply/', payload);
    return data;
  },
  removeCoupon: async (payload: CouponRemovePayload) => {
    const { data } = await api.post('/coupons/remove/', payload);
    return data;
  },

  // Admin
  adminCouponsList: async () => {
    const { data } = await api.get('/coupons/admin/all/');
    return data;
  },
  adminAddCoupon: async (payload: AdminCouponPayload) => {
    const { data } = await api.post('/coupons/admin/all/', payload);
    return data;
  },
  adminUpdateCoupon: async (id: string | number, payload: AdminCouponPayload) => {
    const { data } = await api.put(`/coupons/admin/coupon/${id}/`, payload);
    return data;
  },
  adminGetCouponDetail: async (id: string | number) => {
    const { data } = await api.get(`/coupons/admin/coupon/${id}/`);
    return data;
  },
  adminAddProductsToCoupon: async (
    id: string | number,
    payload: AdminAddResourceToCouponPayload
  ) => {
    const { data } = await api.post(`/coupons/admin/coupon/${id}/products/`, payload);
    return data;
  },
  adminDeleteProductFromCoupon: async (id: string | number, productId: string | number) => {
    const { data } = await api.delete(`/coupons/admin/coupon/${id}/products/${productId}/`);
    return data;
  },
  adminAddCategoryToCoupon: async (
    id: string | number,
    payload: AdminAddResourceToCouponPayload
  ) => {
    const { data } = await api.post(`/coupons/admin/coupon/${id}/categories/`, payload);
    return data;
  },
  adminDeleteCategoryFromCoupon: async (id: string | number, categoryId: string | number) => {
    const { data } = await api.delete(`/coupons/admin/coupon/${id}/categories/${categoryId}/`);
    return data;
  },
  adminAddPackageToCoupon: async (
    id: string | number,
    payload: AdminAddResourceToCouponPayload
  ) => {
    const { data } = await api.post(`/coupons/admin/coupon/${id}/packages/`, payload);
    return data;
  },
  adminDeletePackageFromCoupon: async (id: string | number, packageId: string | number) => {
    const { data } = await api.delete(`/coupons/admin/coupon/${id}/packages/${packageId}/`);
    return data;
  },
  adminCouponUsages: async (id: string | number) => {
    const { data } = await api.get(`/coupons/admin/coupon/${id}/usages/`);
    return data;
  },
  adminDeleteCoupon: async (id: string | number) => {
    const { data } = await api.delete(`/coupons/admin/coupon/${id}/`);
    return data;
  },
};
