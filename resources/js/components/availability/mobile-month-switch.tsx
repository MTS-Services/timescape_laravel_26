import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MobileMonthSwitch({
    currentMonth,
    onPrevMonth,
    onNextMonth,
}: {
    currentMonth: string;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}) {

    const monthName = currentMonth.split(' ')[0];
    const year = currentMonth.split(' ')[1];

    return (
        <>
            <div className="flex items-center justify-between px-2 bg-background my-1 rounded">
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

            {/* There will be a Down/Up button here for collapsing the calendar on smaller screens */}
        </>
    )
}
