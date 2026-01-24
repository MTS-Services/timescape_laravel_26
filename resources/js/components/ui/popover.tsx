import * as React from "react"

interface PopoverProps {
    children: React.ReactNode
    className?: string
}

export function Popover({ children, className = "" }: PopoverProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const handleToggle = () => setIsOpen(!isOpen)

    return (
        <div className={`relative inline-block ${className}`}>
            <div onClick={handleToggle} className="cursor-pointer">{children}</div>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 min-w-32 overflow-hidden rounded-md border bg-white p-1 shadow-md">
                    <div className="py-1">
                        {children}
                    </div>
                </div>
            )}
        </div>
    )
}

interface PopoverContentProps {
    children: React.ReactNode
    className?: string
}

export function PopoverContent({ children, className = "" }: PopoverContentProps) {
    return (
        <div className={`py-1 ${className}`}>
            {children}
        </div>
    )
}

interface PopoverTriggerProps {
    children: React.ReactNode;
    asChild?: boolean;
}

export const PopoverTrigger = ({ children }: PopoverTriggerProps) => {
    return <>{children}</>
}
