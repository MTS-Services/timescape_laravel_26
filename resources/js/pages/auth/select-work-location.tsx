import { Head, router } from '@inertiajs/react';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

interface WorkAccount {
    id: number;
    account_id: number;
    location_id: number;
    work_location_name: string | null;
    name: string;
    email: string;
}

interface SelectWorkLocationProps {
    accounts: WorkAccount[];
    email: string;
}

export default function SelectWorkLocation({ accounts, email }: SelectWorkLocationProps) {
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectLocation = (locationId: number) => {
        if (processing) return;

        setSelectedLocationId(locationId);
        setProcessing(true);
        setError(null);

        router.post(
            route('auth.select-work-location.store'),
            { location_id: locationId },
            {
                onError: (errors) => {
                    setError(errors.location_id || 'Failed to select location');
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            }
        );
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    return (
        <AuthLayout
            title="Select Work Location"
            description="Choose which work location you want to access"
        >
            <Head title="Select Work Location" />

            <div className="w-full max-w-md mx-auto">
                <div className="mb-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Logged in as <span className="font-medium text-foreground">{email}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        You have access to multiple work locations. Please select one to continue.
                    </p>
                </div>

                <div className="space-y-3">
                    {accounts.map((account) => (
                        <Card
                            key={account.id}
                            className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${selectedLocationId === account.location_id
                                ? 'border-primary ring-2 ring-primary/20'
                                : ''
                                }`}
                            onClick={() => handleSelectLocation(account.location_id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {account.work_location_name || `Work Location ${account.id}`}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {account.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {processing && selectedLocationId === account.location_id ? (
                                            <Spinner className="h-5 w-5" />
                                        ) : (
                                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {error && (
                    <div className="mt-4">
                        <InputError message={error} />
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-border">
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out and use a different account</span>
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
