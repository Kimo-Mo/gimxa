import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import type { ProductTag } from '@/types/catalog';

interface ProductTagsProps {
  tags: ProductTag[];
  selectedTags: number[];
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  addingTag: boolean;
  handleAddNewTag: () => void;
  toggleTag: (id: number) => void;
}

export function ProductTags({
  tags,
  selectedTags,
  newTagInput,
  setNewTagInput,
  addingTag,
  handleAddNewTag,
  toggleTag,
}: ProductTagsProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
            placeholder="Type a tag name and press Enter…"
            className="bg-background border-border h-9 text-sm flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border h-9 gap-1 shrink-0"
            onClick={handleAddNewTag}
            disabled={addingTag || !newTagInput.trim()}>
            {addingTag ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}>
                {tag.name}
              </button>
            ))}
          </div>
        )}
        {tags.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No tags yet. Type above to create one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
