import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

import { Input } from './input';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...props }, ref) => {
        const [visible, setVisible] = useState(false);

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    className={cn('pr-10', className)}
                    type={visible ? 'text' : 'password'}
                    {...props}
                />

                <button
                    type="button"
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    onClick={() => setVisible((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <span className="sr-only">
                        {visible ? 'Hide password' : 'Show password'}
                    </span>
                    {visible ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                </button>
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
