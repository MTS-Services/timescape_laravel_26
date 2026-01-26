import { MinusCircle } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AVAILABILITY_OPTIONS, parseLocalDate } from '@/lib/date-helpers';

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

    const hasData = !!selectedOption;
    const selectedOptionData = AVAILABILITY_OPTIONS.find(
        (opt) => opt.id === selectedOption
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {formattedDate}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    {hasData && selectedOptionData ? (
                        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                            <Checkbox
                                checked={true}
                                disabled={true}
                                className="h-5 w-5"
                            />
                            <Label className="text-sm font-medium text-secondary">
                                {selectedOptionData.label}
                            </Label>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                                <MinusCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">
                                Unavailable All Day
                            </span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
