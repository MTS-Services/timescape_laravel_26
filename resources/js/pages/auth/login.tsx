import { Form, Head, usePage } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
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

            <div className="w-full">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                                        Email address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        placeholder="name@company.com"
                                        className="h-11 bg-white/50 border-gray-200 focus:ring-violet-500 focus:border-violet-500 transition-all"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Password
                                        </Label>
                                        {features.canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors"
                                            >
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div> 
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        placeholder="********"
                                        className="h-11 bg-white/50 border-gray-200 focus:ring-violet-500 focus:border-violet-500 transition-all"
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className={`w-full py-6 text-lg ${processing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={processing}
                            >
                                {processing ? <Spinner className="h-4 w-4" /> : 'Login With When I Work'}
                            </Button>
                        </>
                    )}
                </Form>

                {features.canRegister && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        New here? <TextLink href={register()} className="text-violet-600 font-semibold hover:text-violet-500 underline-offset-4 hover:underline">Create an account</TextLink>
                    </p>
                )}

                {status && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center text-sm font-medium text-emerald-600 animate-in fade-in slide-in-from-top-2">
                        {status}
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}