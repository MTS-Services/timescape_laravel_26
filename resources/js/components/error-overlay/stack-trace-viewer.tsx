/**
 * Stack Trace Viewer - Collapsible stack frame explorer
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { StackFrame } from '@/lib/errors/types';

interface StackTraceViewerProps {
    frames: StackFrame[];
}

export function StackTraceViewer({ frames }: StackTraceViewerProps) {
    const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set([0]));

    const toggleFrame = (index: number) => {
        const newExpanded = new Set(expandedFrames);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedFrames(newExpanded);
    };

    if (!frames || frames.length === 0) {
        return (
            <div className="text-sm text-muted-foreground">No stack trace available</div>
        );
    }

    return (
        <div className="space-y-1">
            {frames.map((frame, index) => {
                const isExpanded = expandedFrames.has(index);
                const fileName = frame.fileName?.split('/').pop() || 'unknown';

                return (
                    <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleFrame(index)}>
                        <CollapsibleTrigger className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent">
                            {isExpanded ? (
                                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="font-mono text-xs">
                                    <span className="text-muted-foreground">at </span>
                                    <span className="font-semibold text-foreground">
                                        {frame.functionName}
                                    </span>
                                </div>
                                <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                                    {fileName}
                                    {frame.lineNumber && `:${frame.lineNumber}`}
                                    {frame.columnNumber && `:${frame.columnNumber}`}
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-2">
                            <div className="ml-6 rounded-md bg-muted p-3">
                                <div className="font-mono text-xs text-muted-foreground">
                                    <div className="mb-1 font-semibold text-foreground">Location:</div>
                                    <div className="break-all">{frame.fileName || 'unknown'}</div>
                                    {frame.source && (
                                        <>
                                            <div className="mb-1 mt-2 font-semibold text-foreground">
                                                Source:
                                            </div>
                                            <div className="break-all">{frame.source}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                );
            })}
        </div>
    );
}
