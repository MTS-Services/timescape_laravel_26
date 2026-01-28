import { Form, Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout title="Verify your email" description="Almost there! Please check your inbox for a verification link.">
            <Head title="Email verification" />

            <div className="mx-auto w-full max-w-md text-center rounded-2xl border border-border/50 bg-card/50 p-10 shadow-xl backdrop-blur-sm">
                {status === 'verification-link-sent' && (
                    <div className="mb-6 rounded-lg bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600">
                        A fresh link has been sent to your email address.
                    </div>
                )}

                <Form {...send.form()} className="space-y-6">
                    {({ processing }) => (
                        <>
                            <Button disabled={processing} variant="default" className="w-full bg-violet-600 py-6 text-base shadow-lg hover:shadow-violet-500/20">
                                {processing && <Spinner className="mr-2" />}
                                Resend Verification Email
                            </Button>

                            <Link href={logout()} method="post" as="button" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors">
                                Log out
                            </Link>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}