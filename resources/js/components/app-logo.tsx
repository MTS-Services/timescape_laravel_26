import { cn } from '@/lib/utils';

interface AppLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
    isMobile?: boolean;
}


export default function AppLogo({ className, isMobile = false, ...props }: AppLogoProps) {
    return (
        <>
            <img src='/logo.png' alt="App Logo" className={cn("w-auto object-contain",
                isMobile ? 'max-w-10' : 'max-w-16',
                className)} {...props} />
        </>
    );
}