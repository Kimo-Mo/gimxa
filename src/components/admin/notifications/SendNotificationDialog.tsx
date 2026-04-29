import { z } from 'zod';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send } from 'lucide-react';
import { useSendNotificationMutation } from '@/hooks/admin/useAdminNotificationMutations';

const sendSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  email_type: z.enum(
    ['default', 'code_sent', 'payment_success', 'payment_failed', 'credits_delivered'],
    { message: 'Email type is required' }
  ),
  user: z.string().min(1, 'User ID is required'),
  code: z.string().optional(),
});
type SendFormValues = z.infer<typeof sendSchema>;

interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNotificationDialog({ open, onOpenChange }: SendNotificationDialogProps) {
  const { mutate, isPending } = useSendNotificationMutation();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SendFormValues>({
    resolver: zodResolver(sendSchema),
    defaultValues: { email_type: 'default' },
  });

  const watchedEmailType = useWatch({ control, name: 'email_type' });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (values: SendFormValues) => {
    mutate(values, {
      onSuccess: () => {
        handleOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby="" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>Compose and send a notification to a user.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" {...register('subject')} placeholder="Subject" />
            {errors.subject && <p className="text-destructive text-sm">{errors.subject.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              {...register('message')}
              rows={4}
              placeholder="Type your message here."
            />
            {errors.message && <p className="text-destructive text-sm">{errors.message.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_type">Email Type</Label>
            <Controller
              name="email_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="email_type">
                    <SelectValue placeholder="Select email type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="code_sent">Code Sent</SelectItem>
                    <SelectItem value="payment_success">Payment Success</SelectItem>
                    <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    <SelectItem value="credits_delivered">Credits Delivered</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.email_type && (
              <p className="text-destructive text-sm">{errors.email_type.message}</p>
            )}
          </div>

          {watchedEmailType === 'code_sent' && (
            <div className="space-y-2">
              <Label htmlFor="code">Code (Optional)</Label>
              <Input id="code" {...register('code')} placeholder="Game key or top-up code" />
              {errors.code && <p className="text-destructive text-sm">{errors.code.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="user">User ID</Label>
            <Input id="user" {...register('user')} placeholder="User ID" />
            {errors.user && <p className="text-destructive text-sm">{errors.user.message}</p>}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              <Send className="h-4 w-4 mr-2" />
              {isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
