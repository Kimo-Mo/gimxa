import api from '../lib/api/axios';
import { AdminCodePayload, AdminCodeUpdatePayload } from '@/types';

export const codeService = {
  // Admin
  adminAddUpdateDeleteCodes: async (
    slug: string,
    payload: AdminCodePayload | AdminCodePayload[]
  ) => {
    const { data } = await api.put(`/codes/admin/product/${slug}/`, payload);
    return data;
  },
  adminCodeListForProduct: async (slug: string) => {
    const { data } = await api.get(`/codes/admin/product/${slug}/`);
    return data;
  },
  adminCodeListForProductPackage: async (slug: string, params?: { package_id?: string }) => {
    const { data } = await api.get(`/codes/admin/product/${slug}`, { params });
    return data;
  },
  adminCodeListAll: async () => {
    const { data } = await api.get('/codes/admin/all/');
    return data;
  },
  adminUpdateSingleCode: async (
    slug: string,
    id: string | number,
    payload: AdminCodeUpdatePayload
  ) => {
    const { data } = await api.patch(`/codes/admin/product/${slug}/${id}/`, payload);
    return data;
  },
  adminDeleteSingleCode: async (slug: string, id: string | number) => {
    const { data } = await api.delete(`/codes/admin/product/${slug}/${id}/`);
    return data;
  },
};
