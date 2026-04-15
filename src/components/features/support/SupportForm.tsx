import { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import {
  Card,
  Input,
  Textarea,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
} from '@/components/ui';
import { toast } from 'sonner';

interface SupportFormProps {
  onSuccess: () => void;
}

export const SupportForm = ({ onSuccess }: SupportFormProps) => {
  const [topic, setTopic] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
      toast.success('Your ticket has been created successfully!');
    }, 1500);
  };

  return (
    <div className="lg:col-span-3">
      <Card className="p-8 md:p-10 bg-card border-border shadow-md rounded-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Create a Support Ticket</h2>
            <p className="text-muted-foreground">
              Fill in the details below and we&apos;ll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="john@example.com" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Select onValueChange={setTopic} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="order">Order Issue</SelectItem>
                <SelectItem value="payment">Payment Problem</SelectItem>
                <SelectItem value="account">Account Access</SelectItem>
                <SelectItem value="technical">Technical Issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Field */}
          {topic === 'order' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label htmlFor="orderId">Order ID (#)</Label>
              <Input id="orderId" placeholder="e.g. #ORD-123456" required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="How can we help you today?"
              required
              className="min-h-37.5 bg-transparent dark:bg-input/30"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full text-lg font-bold shadow-lg shadow-primary/20 transition-all">
            {isSubmitting ? (
              <Clock className="animate-spin mr-2" />
            ) : (
              <Send className="mr-2" size={20} />
            )}
            {isSubmitting ? 'Sending Ticket...' : 'Submit Support Request'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By submitting this form, you agree to our{' '}
            <span className="underline cursor-pointer">Privacy Policy</span> and{' '}
            <span className="underline cursor-pointer">Terms of Service</span>.
          </p>
        </form>
      </Card>
    </div>
  );
};
