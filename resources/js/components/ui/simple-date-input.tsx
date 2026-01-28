import { Calendar } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface SimpleDateInputProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    className?: string;
    placeholder?: string;
}

export function SimpleDateInput({
    date,
    setDate,
    className,
    placeholder = "Select date"
}: SimpleDateInputProps) {
    // Helper to format date as yyyy-MM-dd
    const formatDateForInput = React.useCallback((date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const [dateString, setDateString] = React.useState(() => {
        return date ? formatDateForInput(date) : '';
    });

    // Update local string when date prop changes
    React.useEffect(() => {
        setDateString(date ? formatDateForInput(date) : '');
    }, [date, formatDateForInput]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDateString(value);

        // Try to parse as date if value is not empty
        if (value) {
            try {
                const newDate = new Date(value);
                if (!isNaN(newDate.getTime())) {
                    setDate(newDate);
                }
            } catch {
                // Invalid date, don't update the date prop
            }
        } else {
            setDate(undefined);
        }
    };

    return (
        <div className={cn("relative flex w-full items-center", className)}>
            <Calendar className="absolute left-3 size-4 text-muted-foreground" />
            <input
                type="date"
                value={dateString}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                    "placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                )}
            />
        </div>
    );
}
