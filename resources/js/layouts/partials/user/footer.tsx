import * as React from 'react';

export function UserFooter() {
    return (
        <footer className="border-t bg-background py-4">
            <div className="container mx-auto text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} MTS. User Dashboard.
            </div>
        </footer>
    );
}
