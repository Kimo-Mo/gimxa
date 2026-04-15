import type { AuthModalState } from './AuthModal';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/auth.service';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirm_password: z.string().min(8, 'Password must be at least 8 characters long'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
  .refine(
    (data) => data.password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/),
    {
      message: 'Password must contain at least one letter and one number and one special character',
      path: ['password'],
    }
  );

export const RegisterForm = ({
  setCurrentState,
}: {
  setCurrentState: (state: AuthModalState) => void;
}) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitForm = async (data: z.infer<typeof registerSchema>) => {
    try {
      setLoading(true);
      await authService.register({ ...data });
      router.push(`?email=${encodeURIComponent(data.email)}&type=registration`);
      setCurrentState('verify-otp');
    } catch (error) {
      console.error(error);
      setServerError('Something went wrong try again later');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(submitForm)} className="flex flex-col gap-4 ">
        {serverError && (
          <p className="text-destructive bg-destructive/10 px-4 py-2 rounded-2xl">{serverError}</p>
        )}
        <div>
          <Input
            id="username"
            type="text"
            className="w-full h-10 px-4 border rounded-2xl"
            placeholder="Enter your Username"
            {...register('username')}
            name="username"
          />
          {errors.username && <p className="text-destructive text-sm">{errors.username.message}</p>}
        </div>
        <div>
          <Input
            id="email"
            type="email"
            className="w-full h-10 px-4 border rounded-2xl"
            placeholder="Enter your Email"
            {...register('email')}
            name="email"
          />
          {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
        </div>
        <div>
          <div className="w-full relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full h-10 px-4 pr-10 border rounded-2xl"
              placeholder="Enter your Password"
              {...register('password')}
              name="password"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="absolute top-1/2 -translate-y-1/2 right-2"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
          {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
        </div>
        <div>
          <div className="w-full relative">
            <Input
              id="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full h-10 px-4 pr-10 border rounded-2xl"
              placeholder="Confirm Password"
              {...register('confirm_password')}
              name="confirm_password"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="absolute top-1/2 -translate-y-1/2 right-2"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
          {errors.confirm_password && (
            <p className="text-destructive text-sm">{errors.confirm_password.message}</p>
          )}
        </div>
        <Button type="submit" disabled={loading} className="w-full p-2 rounded-2xl">
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>
      <p className="text-sm">
        By signing up, you to agree to Gimxa&apos;{' '}
        <Link href="/legal" className="text-accent-foreground font-bold">
          Terms and Conditions
        </Link>{' '}
        and acknowledge that Gimxa{' '}
        <Link href="/legal" className="text-accent-foreground font-bold">
          Privacy Policy
        </Link>{' '}
        applies to you.
      </p>
      <div className="border-t border-border pt-4">
        <p>
          Already have an account?{' '}
          <span
            onClick={() => setCurrentState('login')}
            className="cursor-pointer text-accent-foreground font-bold">
            Login
          </span>
        </p>
      </div>
    </>
  );
};
