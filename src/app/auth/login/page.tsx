'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, Mail } from 'lucide-react';
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
  getSuggestedEmail,
  loginFormSchema,
  type LoginFormValues,
} from '@/lib/security/form-validation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [hasFailedSubmit, setHasFailedSubmit] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const watchedEmail = form.watch('email');
  const emailSuggestion = getSuggestedEmail(watchedEmail);
  const formErrors = Object.values(form.formState.errors)
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message));

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setHasFailedSubmit(false);
      toast({
        title: 'Success!',
        description: 'You have been logged in successfully.',
      });

      router.push('/the-lab');
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
    <AuthLayout title="Welcome Back" description="Sign in to your Wander Labs account">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleLogin, () => setHasFailedSubmit(true))}
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
                      Did you mean{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() =>
                          form.setValue('email', emailSuggestion, {
                            shouldValidate: true,
                            shouldTouch: true,
                          })
                        }
                      >
                        {emailSuggestion}
                      </button>
                      ?
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
                        placeholder="Your password"
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

          <Button
            type="submit"
            disabled={loading || (hasFailedSubmit && !form.formState.isValid)}
            className="group w-full glass-button border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? 'Signing in...' : 'Sign In'}
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
            <span className="bg-background/50 px-2 text-muted-foreground">Don't have an account?</span>
          </div>
        </div>

        <Link href="/auth/signup">
          <Button variant="outline" className="w-full glass-button border-white/20">
            Create Account
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
