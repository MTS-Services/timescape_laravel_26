import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileMonthSwitchProps {
    currentMonth: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    isCalendarOpen?: boolean;
    onToggleCalendar?: () => void;
}

export default function MobileMonthSwitch({
    currentMonth,
    onPrevMonth,
    onNextMonth,
    isCalendarOpen = true,
    onToggleCalendar,
}: MobileMonthSwitchProps) {

    const monthName = currentMonth.split(' ')[0];
    const year = currentMonth.split(' ')[1];

    return (
        <div className="flex items-center justify-between bg-background my-1 rounded" >
            <div className="flex items-center justify-between flex-1">
                <Button
                    onClick={onPrevMonth}
                    variant="ghost"
                    size="sm"
                    aria-label="Previous month"
                    className="cursor-pointer h-auto! py-1"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                <span className="text-sm font-semibold text-foreground">
                    {monthName} – {year}
                </span>

                <Button
                    onClick={onNextMonth}
                    variant="ghost"
                    size="sm"
                    aria-label="Next month"
                    className="cursor-pointer h-auto! py-1"
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            {onToggleCalendar && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleCalendar}
                    className="flex items-center justify-center mx-auto py-0.5 cursor-pointer bg-red-50 transition-all"
                    aria-label={isCalendarOpen ? 'Collapse calendar' : 'Expand calendar'}
                >
                    <ChevronDown
                        className={cn(
                            'h-5 w-5 text-text-primary transition-transform duration-200',
                            !isCalendarOpen && 'rotate-180',
                        )}
                    />
                </Button>
            )}
        </div>
    )
}
