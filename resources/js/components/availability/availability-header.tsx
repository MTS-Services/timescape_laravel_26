import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface AvailabilityHeaderProps {
    currentMonth: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
}

export function AvailabilityHeader({
    currentMonth,
    onPrevMonth,
    onNextMonth,
    onToday,
}: AvailabilityHeaderProps) {
    return (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-muted p-4">
            <h2 className="text-lg font-semibold text-foreground">
                Availability For {currentMonth}
            </h2>

            <div className="flex items-center gap-2">
                <Button
                    onClick={onPrevMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <Button onClick={onToday} variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    TODAY
                </Button>

                <Button
                    onClick={onNextMonth}
                    variant="ghost"
                    size="icon"
                    aria-label="Next month"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}