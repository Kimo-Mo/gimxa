'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Loader2 } from 'lucide-react';

interface NotificationPopoverFooterProps {
  onClearAll: () => void;
  isClearingAll: boolean;
}

export function NotificationPopoverFooter({
  onClearAll,
  isClearingAll,
}: NotificationPopoverFooterProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="p-2 border-t border-border">
      {!showConfirm ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowConfirm(true)}
          aria-label="Clear all notifications"
        >
          Clear All
        </Button>
      ) : (
        <div className="flex items-center justify-between gap-2 px-2">
          <span className="text-xs text-muted-foreground">Delete all notifications?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={isClearingAll}
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              disabled={isClearingAll}
              onClick={onClearAll}
              aria-label="Confirm clear all"
            >
              {isClearingAll && <Loader2 size={12} className="animate-spin mr-1.5" />}
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
