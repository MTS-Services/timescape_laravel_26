import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const content = useMemo(() => ({
        title: showRecoveryInput ? 'Recovery Code' : 'Authentication Code',
        description: showRecoveryInput
            ? 'Enter an emergency recovery code to access your account.'
            : 'Enter the 6-digit code from your authenticator app.',
        toggle: showRecoveryInput ? 'Use authenticator code' : 'Use a recovery code'
    }), [showRecoveryInput]);

    return (
        <AuthLayout title={content.title} description={content.description}>
            <Head title="Two-Factor Authentication" />

            <div className="mx-auto w-full max-w-sm rounded-2xl border border-border/50 bg-card/50 p-8 shadow-xl backdrop-blur-sm">
                <Form {...store.form()} resetOnError resetOnSuccess={!showRecoveryInput} className="space-y-6">
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <div className="space-y-2">
                                    <Input name="recovery_code" placeholder="XXXXX-XXXXX" autoFocus className="text-center font-mono uppercase tracking-widest" />
                                    <InputError message={errors.recovery_code} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <InputOTP maxLength={OTP_MAX_LENGTH} value={code} onChange={setCode} pattern={REGEXP_ONLY_DIGITS}>
                                        <InputOTPGroup className="gap-2">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <InputOTPSlot key={i} index={i} className="h-12 w-10 border-muted-foreground/30 rounded-lg bg-background" />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-violet-600" disabled={processing || (!showRecoveryInput && code.length < 6)}>
                                Verify Identity
                            </Button>

                            <button
                                type="button"
                                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => { setShowRecoveryInput(!showRecoveryInput); clearErrors(); setCode(''); }}
                            >
                                {content.toggle}
                            </button>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}