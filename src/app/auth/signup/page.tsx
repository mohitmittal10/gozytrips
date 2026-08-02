'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { AuthLayout } from '@/components/auth/auth-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  getPasswordStrength,
  getSuggestedEmail,
  signupFormSchema,
  type SignupFormValues,
} from '@/lib/security/form-validation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const PASSWORD_TONE: Record<'weak' | 'fair' | 'strong' | 'very strong', string> = {
  weak: 'bg-red-500',
  fair: 'bg-amber-500',
  strong: 'bg-emerald-500',
  'very strong': 'bg-emerald-400',
};

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [hasFailedSubmit, setHasFailedSubmit] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const watchedPassword = form.watch('password');
  const watchedEmail = form.watch('email');
  const passwordStrength = useMemo(() => getPasswordStrength(watchedPassword ?? ''), [watchedPassword]);
  const emailSuggestion = getSuggestedEmail(watchedEmail);
  const formErrors = Object.values(form.formState.errors)
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message));

  const handleSignUp = async (values: SignupFormValues) => {
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      });

      if (signUpError) {
        toast({
          title: 'Sign up failed',
          description: signUpError.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('user_profiles').insert([
          {
            id: data.user.id,
            email: values.email,
            full_name: values.fullName,
          },
        ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        setHasFailedSubmit(false);
        toast({
          title: 'Success!',
          description: 'Account created successfully. Redirecting...',
        });

        router.push('/the-lab');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      description="Join Wander Labs and start planning your luxury trips"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSignUp, () => setHasFailedSubmit(true))}
          className="space-y-4"
          noValidate
        >
          {form.formState.submitCount > 0 && formErrors.length > 1 && (
            <Alert className="border-amber-500/30 bg-amber-500/10" aria-live="polite">
              <AlertCircle className="h-4 w-4 text-amber-300" />
              <AlertTitle>Please check the highlighted fields</AlertTitle>
              <AlertDescription>
                {formErrors.map((message, index) => (
                  <p key={`${message}-${index}`}>{message}</p>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => {
              const showSuccess = fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

              return (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-foreground/80">Full Name</FormLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Your full name"
                        {...field}
                        className={cn(
                          'glass-input border-white/10 pl-10 pr-10 placeholder:text-muted-foreground/50',
                          showSuccess && 'border-emerald-500/40 focus-visible:ring-emerald-500/20'
                        )}
                      />
                    </FormControl>
                    {showSuccess && (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                  <FormMessage className="text-xs" aria-live="polite" />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => {
              const showSuccess = fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

              return (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                        onChange={(event) => field.onChange(event.target.value)}
                        className={cn(
                          'glass-input border-white/10 pl-10 pr-10 placeholder:text-muted-foreground/50',
                          showSuccess && 'border-emerald-500/40 focus-visible:ring-emerald-500/20'
                        )}
                      />
                    </FormControl>
                    {showSuccess && (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                  {!fieldState.error && emailSuggestion && emailSuggestion !== field.value && (
                    <FormDescription className="text-xs text-amber-200">
                      Did you mean <button type="button" className="underline" onClick={() => form.setValue('email', emailSuggestion, { shouldValidate: true, shouldTouch: true })}>{emailSuggestion}</button>?
                    </FormDescription>
                  )}
                  <FormMessage className="text-xs" aria-live="polite" />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => {
              const showSuccess = fieldState.isTouched && !fieldState.error && field.value.length > 0;

              return (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Use at least 10 characters"
                        {...field}
                        className={cn(
                          'glass-input border-white/10 pl-10 pr-10 placeholder:text-muted-foreground/50',
                          showSuccess && 'border-emerald-500/40 focus-visible:ring-emerald-500/20'
                        )}
                      />
                    </FormControl>
                    {showSuccess && (
                      <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                  {field.value.length > 0 && (
                    <FormDescription className="space-y-2 text-xs text-foreground/70">
                      <div className="flex items-center justify-between">
                        <span>Password strength: {passwordStrength.label}</span>
                        <span>{passwordStrength.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn('h-full transition-all', PASSWORD_TONE[passwordStrength.label])}
                          style={{ width: `${passwordStrength.progress}%` }}
                        />
                      </div>
                      <p>{passwordStrength.feedback}</p>
                    </FormDescription>
                  )}
                  <FormMessage className="text-xs" aria-live="polite" />
                </FormItem>
              );
            }}
          />

          <Button
            type="submit"
            disabled={loading || (hasFailedSubmit && !form.formState.isValid)}
            className="group w-full glass-button border-0 bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:from-pink-600 hover:to-orange-500"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>
      </Form>

      <div className="mt-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background/50 px-2 text-muted-foreground">Already have an account?</span>
          </div>
        </div>

        <Link href="/auth/login">
          <Button variant="outline" className="w-full glass-button border-white/20">
            Sign In
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
