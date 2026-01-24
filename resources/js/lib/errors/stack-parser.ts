/**
 * Stack Trace Parser
 * Parses and normalizes JavaScript stack traces
 */

import type { StackFrame } from './types';

const CHROME_SAFARI_STACK_REGEXP = /^\s*at (?:(.*?) )?\(?(.+?)(?::(\d+))?(?::(\d+))?\)?$/;
const FIREFOX_STACK_REGEXP = /^(?:(.*?)@)?(.+?)(?::(\d+))?(?::(\d+))?$/;

export function parseStackTrace(stack?: string): StackFrame[] {
    if (!stack) {
        return [];
    }

    const lines = stack.split('\n').filter((line) => line.trim());
    const frames: StackFrame[] = [];

    for (const line of lines) {
        const frame = parseStackFrame(line);
        if (frame) {
            frames.push(frame);
        }
    }

    return frames;
}

function parseStackFrame(line: string): StackFrame | null {
    line = line.trim();

    let match = line.match(CHROME_SAFARI_STACK_REGEXP);
    if (match) {
        return {
            functionName: match[1] || '<anonymous>',
            fileName: match[2],
            lineNumber: match[3] ? parseInt(match[3], 10) : undefined,
            columnNumber: match[4] ? parseInt(match[4], 10) : undefined,
            source: line,
        };
    }

    match = line.match(FIREFOX_STACK_REGEXP);
    if (match) {
        return {
            functionName: match[1] || '<anonymous>',
            fileName: match[2],
            lineNumber: match[3] ? parseInt(match[3], 10) : undefined,
            columnNumber: match[4] ? parseInt(match[4], 10) : undefined,
            source: line,
        };
    }

    return null;
}

export function extractComponentFromStack(stack?: string): string | undefined {
    if (!stack) {
        return undefined;
    }

    const reactFramePattern = /at ([A-Z][a-zA-Z0-9]*)/;
    const match = stack.match(reactFramePattern);
    return match ? match[1] : undefined;
}

export function sanitizeStackTrace(stack?: string, environment?: string): string | undefined {
    if (!stack) {
        return undefined;
    }

    if (environment === 'production') {
        const frames = parseStackTrace(stack);
        return frames
            .map((frame) => {
                const file = frame.fileName ? frame.fileName.split('?')[0] : 'unknown';
                return `  at ${frame.functionName} (${file}:${frame.lineNumber}:${frame.columnNumber})`;
            })
            .join('\n');
    }

    return stack;
}

export function generateStackHash(stack?: string): string {
    if (!stack) {
        return 'no-stack';
    }

    const frames = parseStackTrace(stack);
    const key = frames
        .slice(0, 5)
        .map((f) => `${f.functionName}:${f.fileName}:${f.lineNumber}`)
        .join('|');

    return simpleHash(key);
}

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
