import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle, ChevronLeft } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout title="Forgot password" description="We'll send you a link to reset your password.">
            <Head title="Forgot password" />

            <div className="mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                {status && (
                    <div className="mb-6 rounded-lg bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {status}
                    </div>
                )}

                <Form {...email.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" name="email" autoFocus placeholder="name@company.com" className="bg-background/50" />
                                <InputError message={errors.email} />
                            </div>

                            <Button className="w-full bg-violet-600" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Send Reset Link
                            </Button>

                            <Link href={login()} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                                Back to log in
                            </Link>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}