import api from '../lib/api/axios';
import {
  TopupsListParams,
  ValidateTopupPayload,
  TopupPayload,
  TopupFieldPayload,
  TopupFieldHelpPayload,
  TopupPackagePayload,
} from '@/types';

export const topupService = {
  // Public
  publicTopupsList: async (params?: TopupsListParams) => {
    const { data } = await api.get('/topup/public/topups', { params });
    return data;
  },
  publicTopupDetail: async (slug: string) => {
    const { data } = await api.get(`/topup/public/topups/${slug}`);
    return data;
  },
  publicPackagesList: async (slug: string, params?: TopupsListParams) => {
    const { data } = await api.get(`/topup/public/topups/${slug}/packages`, { params });
    return data;
  },
  validateTopupFields: async (payload: ValidateTopupPayload) => {
    const { data } = await api.post('/topup/public/validate/', payload);
    return data;
  },

  // Admin
  adminTopupsList: async (params?: TopupsListParams) => {
    const { data } = await api.get('/topup/admin/topups', { params });
    return data;
  },
  adminAddTopup: async (payload: TopupPayload | FormData) => {
    const { data } = await api.post('/topup/admin/topups/', payload);
    return data;
  },
  adminDeleteTopup: async (slug: string) => {
    const { data } = await api.delete(`/topup/admin/topups/${slug}/`);
    return data;
  },
  adminTopupDetail: async (slug: string) => {
    const { data } = await api.get(`/topup/admin/topups/${slug}`);
    return data;
  },
  adminUpdateTopup: async (slug: string, payload: Record<string, unknown> | FormData) => {
    const { data } = await api.put(`/topup/admin/topups/${slug}/`, payload);
    return data;
  },
  adminAddField: async (payload: TopupFieldPayload | TopupFieldPayload[]) => {
    const { data } = await api.post('/topup/admin/fields/', payload);
    return data;
  },
  adminUpdateField: async (fieldId: string | number, payload: TopupFieldPayload) => {
    const { data } = await api.put(`/topup/admin/fields/${fieldId}/`, payload);
    return data;
  },
  adminDeleteField: async (fieldId: string | number, payload?: { field_id?: number[] }) => {
    const { data } = await api.delete(`/topup/admin/fields/${fieldId}/`, { data: payload });
    return data;
  },
  adminDeleteMultipleFields: async (payload: number[]) => {
    const { data } = await api.delete('/topup/admin/fields/', { data: payload });
    return data;
  },
  adminAddFieldHelp: async (payload: TopupFieldHelpPayload | FormData) => {
    const { data } = await api.post('/topup/admin/fields/helps/', payload);
    return data;
  },
  adminUpdateFieldHelp: async (
    helpId: string | number,
    payload: TopupFieldHelpPayload | FormData
  ) => {
    const { data } = await api.put(`/topup/admin/fields/helps/${helpId}/`, payload);
    return data;
  },
  adminDeleteFieldHelp: async (helpId: string | number, payload?: { help_id?: number[] }) => {
    const { data } = await api.delete(`/topup/admin/fields/helps/${helpId}/`, { data: payload });
    return data;
  },
  adminAddPackage: async (payload: TopupPackagePayload | FormData) => {
    const { data } = await api.post('/topup/admin/packages/', payload);
    return data;
  },
  adminPackagesList: async (slug: string, params?: TopupsListParams) => {
    const { data } = await api.get(`/topup/admin/topups/${slug}/packages/`, { params });
    return data;
  },
  adminUpdatePackage: async (
    packageId: string | number,
    payload: TopupPackagePayload | FormData
  ) => {
    const { data } = await api.put(`/topup/admin/packages/${packageId}/`, payload);
    return data;
  },
  adminDeletePackage: async (packageId: string | number) => {
    const { data } = await api.delete(`/topup/admin/packages/${packageId}/`);
    return data;
  },
};
