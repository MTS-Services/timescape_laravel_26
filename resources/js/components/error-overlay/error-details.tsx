/**
 * Error Details - Detailed error view with tabs
 */

import { Calendar, Clock, Code, Copy, Database, Globe, Hash, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CapturedError } from '@/lib/errors/types';
import { copyToClipboard } from '@/lib/errors/utils';

import { StackTraceViewer } from './stack-trace-viewer';

interface ErrorDetailsProps {
    error: CapturedError;
    onClose: () => void;
    onDelete: () => void;
}

export function ErrorDetails({ error, onClose, onDelete }: ErrorDetailsProps) {
    const [activeTab, setActiveTab] = useState('stack');

    const handleCopyError = async () => {
        const errorData = JSON.stringify(error, null, 2);
        await copyToClipboard(errorData);
        toast.success('Error copied to clipboard');
    };

    const handleCopyStack = async () => {
        if (error.stack) {
            await copyToClipboard(error.stack);
            toast.success('Stack trace copied to clipboard');
        }
    };

    const severityColors = {
        fatal: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };

    const typeColors = {
        react: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
        runtime: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        network: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
        promise: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
        inertia: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-start justify-between border-b p-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge className={severityColors[error.severity]}>{error.severity}</Badge>
                        <Badge className={typeColors[error.type]}>{error.type}</Badge>
                        {error.count > 1 && (
                            <Badge variant="outline">
                                {error.count} occurrence{error.count > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold">{error.name}</h3>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleCopyError} title="Copy error">
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete} title="Delete error">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <div className="border-b px-4">
                    <TabsList className="h-12">
                        <TabsTrigger value="stack" className="gap-2">
                            <Code className="h-4 w-4" />
                            Stack Trace
                        </TabsTrigger>
                        <TabsTrigger value="context" className="gap-2">
                            <Globe className="h-4 w-4" />
                            Context
                        </TabsTrigger>
                        {error.networkDetails && (
                            <TabsTrigger value="network" className="gap-2">
                                <Database className="h-4 w-4" />
                                Network
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <ScrollArea className="flex-1">
                    <TabsContent value="stack" className="m-0 p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">Stack Frames</h4>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyStack}
                                    disabled={!error.stack}
                                >
                                    <Copy className="mr-2 h-3 w-3" />
                                    Copy Stack
                                </Button>
                            </div>
                            {error.parsedStack && error.parsedStack.length > 0 ? (
                                <StackTraceViewer frames={error.parsedStack} />
                            ) : (
                                <div className="rounded-md bg-muted p-4 font-mono text-xs">
                                    {error.stack || 'No stack trace available'}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="context" className="m-0 p-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="mb-3 text-sm font-semibold">Error Information</h4>
                                <div className="space-y-2 rounded-md bg-muted p-4">
                                    <InfoRow icon={Hash} label="Error ID" value={error.id} />
                                    <InfoRow icon={Hash} label="Hash" value={error.hash} />
                                    <InfoRow icon={Calendar} label="First Seen" value={new Date(error.firstOccurrence).toLocaleString()} />
                                    <InfoRow icon={Clock} label="Last Seen" value={new Date(error.lastOccurrence).toLocaleString()} />
                                    <InfoRow icon={Code} label="Source" value={error.source} />
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="mb-3 text-sm font-semibold">Page Context</h4>
                                <div className="space-y-2 rounded-md bg-muted p-4">
                                    <InfoRow icon={Globe} label="URL" value={error.metadata.url} />
                                    <InfoRow icon={Code} label="Route" value={error.metadata.route} />
                                    <InfoRow icon={Code} label="Component" value={error.metadata.component} />
                                </div>
                            </div>

                            {error.metadata.userId && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="mb-3 text-sm font-semibold">User Context</h4>
                                        <div className="space-y-2 rounded-md bg-muted p-4">
                                            <InfoRow icon={User} label="User ID" value={error.metadata.userId} />
                                            <InfoRow icon={User} label="Name" value={error.metadata.userName} />
                                            <InfoRow icon={User} label="Email" value={error.metadata.userEmail} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <Separator />

                            <div>
                                <h4 className="mb-3 text-sm font-semibold">Environment</h4>
                                <div className="space-y-2 rounded-md bg-muted p-4">
                                    <InfoRow label="Browser" value={`${error.metadata.browserName} ${error.metadata.browserVersion}`} />
                                    <InfoRow label="OS" value={`${error.metadata.osName} ${error.metadata.osVersion}`} />
                                    <InfoRow label="Screen" value={error.metadata.screenResolution} />
                                    <InfoRow label="Viewport" value={error.metadata.viewport} />
                                    <InfoRow label="Environment" value={error.metadata.environment} />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {error.networkDetails && (
                        <TabsContent value="network" className="m-0 p-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="mb-3 text-sm font-semibold">Request Details</h4>
                                    <div className="space-y-2 rounded-md bg-muted p-4">
                                        <InfoRow label="Method" value={error.networkDetails.method} />
                                        <InfoRow label="URL" value={error.networkDetails.url} />
                                        <InfoRow label="Status" value={error.networkDetails.status} />
                                        <InfoRow label="Status Text" value={error.networkDetails.statusText} />
                                        {error.networkDetails.duration && (
                                            <InfoRow label="Duration" value={`${error.networkDetails.duration}ms`} />
                                        )}
                                    </div>
                                </div>

                                {error.networkDetails.requestBody ? (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="mb-3 text-sm font-semibold">Request Body</h4>
                                            <div className="rounded-md bg-muted p-4 font-mono text-xs">
                                                <pre>{String(JSON.stringify(error.networkDetails.requestBody, null, 2))}</pre>
                                            </div>
                                        </div>
                                    </>
                                ) : null}

                                {error.networkDetails.responseBody ? (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="mb-3 text-sm font-semibold">Response Body</h4>
                                            <div className="rounded-md bg-muted p-4 font-mono text-xs">
                                                <pre>{String(JSON.stringify(error.networkDetails.responseBody, null, 2))}</pre>
                                            </div>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </TabsContent>
                    )}
                </ScrollArea>
            </Tabs>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value?: string | number }) {
    if (!value) {
        return null;
    }

    return (
        <div className="flex items-start gap-2 text-sm">
            {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="font-medium text-muted-foreground">{label}:</span>
            <span className="break-all font-mono text-xs text-foreground">{value}</span>
        </div>
    );
}
