import { Form, Head, Link } from '@inertiajs/react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <AuthLayout
            title="Create an account"
            description="Join thousands of teams shipping faster today."
        >
            <Head title="Register" />

            <div className="mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                <Form
                    {...store.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    disableWhileProcessing
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" type="text" required autoFocus name="name" placeholder="John Doe" className="bg-background/50" />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input id="email" type="email" required name="email" placeholder="name@company.com" className="bg-background/50" />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" type="password" required name="password" placeholder="••••••••" className="bg-background/50" />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="password_confirmation">Confirm</Label>
                                        <Input id="password_confirmation" type="password" required name="password_confirmation" placeholder="••••••••" className="bg-background/50" />
                                    </div>
                                </div>
                                <InputError message={errors.password} />

                                <Button type="submit" className="w-full bg-violet-600 font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-violet-500/20 active:scale-[0.98]" disabled={processing}>
                                    {processing && <Spinner className="mr-2 h-4 w-4" />}
                                    Create Account
                                </Button>
                            </div>

                            <div className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href={login()} className="font-medium text-violet-600 hover:text-violet-500 transition-colors">
                                    Log in
                                </Link>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}