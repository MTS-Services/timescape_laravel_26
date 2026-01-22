import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { SharedData } from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

interface WhenIWorkLoginProps {
    status?: string;
}

export default function WhenIWorkLogin({ status }: WhenIWorkLoginProps) {
    const { features } = usePage<SharedData>().props;
    const form = useForm({
        email: '',
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('wheniwork.login.post'));
    };

    return (
        <AuthLayout
            title="When I Work Login"
            description="Enter your When I Work credentials to access your account"
        >
            <Head title="When I Work Login" />

            <div className="mx-auto w-full max-w-md rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                <div className="mb-6 text-center">
                    <img
                        src="/assets/images/when-i-work-logo.png"
                        alt="When I Work Logo"
                        className="h-8 mx-auto mb-4"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h2 className="text-2xl font-bold text-foreground">Sign in with When I Work</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your When I Work email and password to continue
                    </p>
                </div>

                <Form
                    onSubmit={submit}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={form.data.email}
                                onChange={e => form.setData('email', e.target.value)}
                                required
                                autoFocus
                                placeholder="name@company.com"
                                className="bg-background/50"
                            />
                            {form.errors.email && <InputError message={form.errors.email} />}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={form.data.password}
                                onChange={e => form.setData('password', e.target.value)}
                                required
                                className="bg-background/50"
                            />
                            {form.errors.password && <InputError message={form.errors.password} />}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-[0.98]"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner className="mr-2 h-4 w-4" />}
                        Sign In with When I Work
                    </Button>

                    {status && (
                        <div className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-center text-sm font-medium text-emerald-600">
                            {status}
                        </div>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
