import { z } from 'zod';

export const SCOPE_OPTIONS = ['global', 'product', 'package', 'category'] as const;
export const DISCOUNT_TYPE_OPTIONS = ['percent', 'fixed'] as const;

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Required')
      .max(50)
      .regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric only'),
    scope: z.enum(SCOPE_OPTIONS),
    discount_type: z.enum(DISCOUNT_TYPE_OPTIONS),
    discount_value: z.number().positive(),
    start_at: z.string().min(1, 'Required'),
    end_at: z.string().min(1, 'Required'),
    max_usage: z.number().int().positive().optional(),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === 'percent' && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discount_value'],
        message: 'Max 100 for percentage discounts',
      });
    }
    if (data.end_at <= data.start_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_at'],
        message: 'End date must be after start date',
      });
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;
