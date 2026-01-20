import * as React from 'react';

export function AdminFooter() {
    return (
        <footer className="border-t bg-background/80 backdrop-blur-sm py-4">
            <div className="container mx-auto text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} MTS. Admin Panel.
            </div>
        </footer>
    );
}
