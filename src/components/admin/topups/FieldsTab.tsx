import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldForm, FieldType } from './types';
import { getImageUrl } from '@/lib/utils';

interface FieldsTabProps {
  fields: FieldForm[];
  addField: () => void;
  updateField: (i: number, key: keyof FieldForm, value: unknown) => void;
  removeFieldLocally: (i: number) => void;
  handleDeleteHelp: (fieldIndex: number, helpIndex: number, helpId?: number) => void;
  handleSaveFields?: () => void;
  savingFields?: boolean;
  setDeleteTarget: (target: { type: 'field' | 'package'; id: number } | null) => void;
  fieldErrors: Record<number, Record<string, string>>;
  setFieldErrors: (
    e: (prev: Record<number, Record<string, string>>) => Record<number, Record<string, string>>
  ) => void;
  hideSaveButton?: boolean;
}

export function FieldsTab({
  fields,
  addField,
  updateField,
  removeFieldLocally,
  handleDeleteHelp,
  handleSaveFields,
  savingFields,
  setDeleteTarget,
  fieldErrors,
  setFieldErrors,
  hideSaveButton,
}: FieldsTabProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-foreground text-base">Player Input Fields</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border gap-1"
            onClick={addField}>
            <Plus className="h-3 w-3" /> Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No fields yet. Add fields for player information like Player ID, Server, etc.
          </p>
        ) : (
          fields.map((field, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-4 bg-muted/10">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-foreground">Field {i + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (field.id) setDeleteTarget({ type: 'field', id: field.id });
                    else removeFieldLocally(i);
                  }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Title *</Label>
                  <input
                    value={field.title}
                    onChange={(e) => {
                      updateField(i, 'title', e.target.value);
                      setFieldErrors((prev) => {
                        const n = { ...prev };
                        if (n[i]) delete n[i].title;
                        return n;
                      });
                    }}
                    placeholder="e.g. Player ID"
                    className={`flex h-8 w-full rounded-md border px-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring ${fieldErrors[i]?.title ? 'border-destructive' : 'border-border'}`}
                  />
                  {fieldErrors[i]?.title && (
                    <p className="text-xs text-destructive">{fieldErrors[i].title}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Placeholder</Label>
                  <Input
                    value={field.placeholder}
                    onChange={(e) => updateField(i, 'placeholder', e.target.value)}
                    placeholder="e.g. Enter your Player ID"
                    className="bg-background border-border h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Field Type</Label>
                  <Select
                    value={field.field_type}
                    onValueChange={(v) => updateField(i, 'field_type', v as FieldType)}>
                    <SelectTrigger className="bg-background border-border h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs">Min Length</Label>
                  <Input
                    type="number"
                    min={1}
                    value={field.min_input_length}
                    onChange={(e) =>
                      updateField(i, 'min_input_length', parseInt(e.target.value) || 1)
                    }
                    className="bg-background border-border h-8 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={field.is_required}
                  onChange={(e) => updateField(i, 'is_required', e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Required field
              </label>

              {/* ── Field Helps ── */}
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-foreground text-xs font-medium">
                    Field Helps (hints/tips)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      updateField(i, 'helps', [
                        ...(field.helps ?? []),
                        { description: '', imageFile: null, imageUrl: null },
                      ])
                    }>
                    <Plus className="h-3 w-3" /> Add Help
                  </Button>
                </div>
                {(field.helps ?? []).map((help, hi) => (
                  <div
                    key={hi}
                    className="flex gap-2 items-start border border-border/50 rounded-md p-2 bg-background">
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={help.description}
                        onChange={(e) => {
                          const updated = [...(field.helps ?? [])];
                          updated[hi] = { ...updated[hi], description: e.target.value };
                          updateField(i, 'helps', updated);
                        }}
                        placeholder="Help text / hint…"
                        className="flex h-8 w-full rounded-md border border-border px-3 py-1 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {/* Show existing image preview */}
                      {help.imageUrl && !help.imageFile && (
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={help.imageUrl ? getImageUrl(help.imageUrl) : ''}
                            alt="help"
                            className="h-10 w-10 rounded object-cover border border-border"
                          />
                          <span className="text-xs text-muted-foreground">Current image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const updated = [...(field.helps ?? [])];
                          updated[hi] = { ...updated[hi], imageFile: e.target.files?.[0] ?? null };
                          updateField(i, 'helps', updated);
                        }}
                        className="text-xs text-muted-foreground cursor-pointer"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDeleteHelp(i, hi, help.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        {!hideSaveButton && fields.length > 0 && handleSaveFields && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSaveFields}
              disabled={savingFields}
              className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2">
              {savingFields ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingFields ? 'Saving…' : 'Save Fields'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
