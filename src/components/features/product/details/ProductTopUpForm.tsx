'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface TopupField {
  id?: number;
  key: string;
  title: string;
  placeholder?: string;
  is_required?: boolean;
  field_type?: string;
  helps?: {
    id?: number;
    description?: string;
    image?: string | null;
  }[];
}

interface ProductTopUpFormProps {
  fields: TopupField[];
  formData: Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  errors?: Record<string, string>;
}

export const ProductTopUpForm = ({
  fields,
  formData,
  setFormData,
  errors = {},
}: ProductTopUpFormProps) => {
  const [openHelpForKey, setOpenHelpForKey] = useState<string | null>(null);

  if (!fields || fields.length === 0) return null;

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const currentHelpField = fields.find((field) => field.key === openHelpForKey) ?? null;
  const currentHelps = (currentHelpField?.helps ?? []).filter((item) => item.description?.trim());

  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border-2 border-border shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-6 bg-primary rounded-full" />
        <h3 className="font-bold text-lg">Account Information</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={field.key} className="text-sm font-semibold text-muted-foreground">
                {field.title}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </label>
              {(field.helps ?? []).some((item) => item.description?.trim()) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 min-w-7 px-2 rounded-full"
                  onClick={() => setOpenHelpForKey(field.key)}>
                  !
                </Button>
              )}
            </div>
            <Input
              id={field.key}
              name={field.key}
              type={field.field_type === 'number' ? 'number' : 'text'}
              placeholder={
                field.placeholder?.length && field.placeholder?.length > 0
                  ? field.placeholder
                  : `Enter your ${field.title.toLowerCase()}`
              }
              value={formData[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className={`bg-background/50 h-12 rounded-xl ${
                errors[field.key]
                  ? 'border-destructive focus-visible:ring-destructive'
                  : 'border-border focus:ring-primary'
              }`}
            />
            {errors[field.key] && (
              <p className="text-xs text-destructive mt-1">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic mt-2">
        * Please make sure the information is correct. We are not responsible for errors in the
        information provided.
      </p>
      <Dialog
        open={Boolean(openHelpForKey)}
        onOpenChange={(open) => !open && setOpenHelpForKey(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{currentHelpField?.title ?? 'Field Help'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto max-h-80">
            {currentHelps.length > 0 ? (
              currentHelps.map((help, idx) => (
                <div key={`${help.id ?? 'help'}-${idx}`}>
                  <p className="text-sm text-muted-foreground mb-2">{help.description}</p>
                  <Image
                    src={getImageUrl(help.image) ?? ''}
                    alt={help.description ?? ''}
                    width={400}
                    height={400}
                    className="object-contain w-full"
                    unoptimized
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No help content available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
