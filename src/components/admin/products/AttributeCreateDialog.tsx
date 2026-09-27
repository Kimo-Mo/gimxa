import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { useCreateAttributeMutation } from '@/hooks/admin/useCreateAttributeMutation';

interface AttributeCreateDialogProps {
  type: 'regions' | 'types' | 'platforms';
  onSuccess?: (id: string) => void;
}

export function AttributeCreateDialog({ type, onSuccess }: AttributeCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const mutation = useCreateAttributeMutation(type);

  const titleMap = {
    regions: 'Region',
    types: 'Type',
    platforms: 'Platform'
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formData = new FormData();
    formData.append('name', name);
    if (imageFile) {
      formData.append('logo', imageFile);
    }

    mutation.mutate(formData, {
      onSuccess: (data: any) => {
        setOpen(false);
        setName('');
        removeImage();
        if (onSuccess && data?.id) {
          onSuccess(String(data.id));
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0" title={`Add new ${titleMap[type]}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new {titleMap[type]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={`e.g. ${type === 'regions' ? 'Global' : type === 'types' ? 'Account' : 'Steam'}`}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Logo (Optional)</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-16 h-16 border rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0 right-0 bg-background/80 text-destructive p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div 
                  className="w-16 h-16 border border-dashed rounded-md flex items-center justify-center bg-muted/50 text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1">
                <Input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className={imagePreview ? 'hidden' : ''}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
