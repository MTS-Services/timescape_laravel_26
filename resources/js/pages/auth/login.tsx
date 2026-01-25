import { Form, Head, Link, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login, register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { SharedData } from '@/types';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status }: LoginProps) {
    const { features } = usePage<SharedData>().props;
    return (
        <AuthLayout
            title="Welcome back"
            description="Enter your credentials to access your account"
        >
            <Head title="Log in" />

            <div className="mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" type="email" name="email" required autoFocus placeholder="name@company.com" className="bg-background/50" />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        {features.canResetPassword && (
                                            <TextLink href={request()} className="text-xs text-violet-600 hover:text-violet-500 transition-colors">Forgot?</TextLink>
                                        )}
                                    </div>
                                    <PasswordInput id="password" name="password" required className="bg-background/50" />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember" name="remember" />
                                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">Remember me for 30 days</Label>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 shadow-md transition-all active:scale-[0.98]" disabled={processing}>
                                {processing && <Spinner className="mr-2 h-4 w-4" />}
                                Sign In
                            </Button>
                        </>
                    )}
                </Form>

                {features.canRegister && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        New here? <TextLink href={register()} className="text-violet-600 font-medium hover:text-violet-500">Create an account</TextLink>
                    </p>
                )}

                {status && (
                    <div className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600">
                        {status}
                    </div>
                )}
            </div>

            <Button className="w-full py-6 text-lg" asChild>
                <Link href={login()}>
                    Login With When I Work
                </Link>
            </Button>
        </AuthLayout>
    );
}