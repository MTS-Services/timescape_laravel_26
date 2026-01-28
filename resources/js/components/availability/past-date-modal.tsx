import { CheckSquare, MinusCircle } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getPastDateDisplay, parseLocalDate } from '@/lib/date-helpers';
import { cn } from '@/lib/utils';

interface PastDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    dateKey: string | null;
    selectedOption: string | null;
}

export function PastDateModal({
    isOpen,
    onClose,
    dateKey,
    selectedOption,
}: PastDateModalProps) {
    if (!dateKey) return null;

    const date = parseLocalDate(dateKey);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const pastDateDisplay = getPastDateDisplay(selectedOption);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {formattedDate}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        {pastDateDisplay.iconType === 'minus' ? (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                                <MinusCircle className="h-6 w-6 text-destructive" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10">
                                <CheckSquare className="h-6 w-6 text-secondary" />
                            </div>
                        )}
                        <span className={cn(
                            "text-sm font-medium",
                            pastDateDisplay.iconType === 'minus'
                                ? "text-muted-foreground"
                                : "text-muted-foreground"
                        )}>
                            {pastDateDisplay.label}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
