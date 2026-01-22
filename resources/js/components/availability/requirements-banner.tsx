import { CheckCircle2, AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/calendar-utils';
import type { AvailabilityRequirements } from '@/types/availability';

interface RequirementsBannerProps {
    requirements: AvailabilityRequirements;
}

export function RequirementsBanner({ requirements }: RequirementsBannerProps) {
    return (
        <Alert className="mb-6">
            <AlertDescription>
                <h3 className="mb-2 font-semibold text-foreground">
                    Availability Requirements
                </h3>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        {requirements.weekday_requirement_met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-teal-500" />
                            <span className="text-muted-foreground">
                                Minimum 3 weekday blocks (Mon-Fri):{' '}
                                <span
                                    className={cn(
                                        'font-semibold',
                                        requirements.weekday_requirement_met
                                            ? 'text-green-600'
                                            : 'text-amber-600'
                                    )}
                                >
                                    {requirements.weekday_blocks}/3
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {requirements.weekend_requirement_met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-400" />
                            <span className="text-muted-foreground">
                                Minimum 2 weekend blocks (Sat-Sun):{' '}
                                <span
                                    className={cn(
                                        'font-semibold',
                                        requirements.weekend_requirement_met
                                            ? 'text-green-600'
                                            : 'text-amber-600'
                                    )}
                                >
                                    {requirements.weekend_blocks}/2
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </AlertDescription>
        </Alert>
    );
}