# Frontend Error Observability System

**Production-Grade Error Tracing & Visualization for Laravel 12 + Inertia React**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Why react-error-boundary Alone is Insufficient](#why-react-error-boundary-alone-is-insufficient)
4. [Installation](#installation)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Advanced Patterns](#advanced-patterns)
8. [Performance & Security](#performance--security)
9. [Common Pitfalls](#common-pitfalls)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This error observability system provides **comprehensive frontend error tracking** comparable to Sentry or Vercel Error Overlay, while remaining **100% frontend-scoped** and respecting Laravel's backend error handling.

### Key Features

✅ **Multi-layered error capture**
- React Error Boundaries (component tree errors)
- Global error listeners (window.onerror, unhandledrejection)
- Network interceptors (HTTP failures)
- Inertia event listeners (navigation errors)

✅ **Rich error context**
- Parsed stack traces with collapsible frames
- Component name extraction
- User, route, and environment metadata
- Network request/response details
- Browser and OS information

✅ **Production-ready UI**
- Beautiful error overlay with filtering
- Error grouping and deduplication
- Real-time error badges
- Dark/light mode support
- Toast notifications (via Sonner)

✅ **Developer experience**
- Zero configuration required
- TypeScript fully typed
- Environment-aware behavior
- SessionStorage persistence (dev only)
- Export/copy error data

---

## Architecture

### Error Capture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR CAPTURE LAYERS                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: React Error Boundaries                             │
│  └─ Catches: Component render errors, lifecycle errors       │
│                                                               │
│  Layer 2: Global Error Listeners                             │
│  ├─ window.onerror → Script errors, syntax errors           │
│  └─ window.onunhandledrejection → Promise rejections        │
│                                                               │
│  Layer 3: Inertia Event Listeners                            │
│  └─ router.on('error') → Navigation failures                │
│                                                               │
│  Layer 4: Manual Error Reporting                             │
│  └─ useErrorHandler hook → Programmatic capture             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   ERROR PROCESSING PIPELINE                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Error Normalization                                      │
│     ├─ Parse stack traces                                    │
│     ├─ Extract component names                               │
│     ├─ Classify type & severity                              │
│     └─ Generate unique hash for deduplication                │
│                                                               │
│  2. Context Enrichment                                       │
│     ├─ Attach route & component info                         │
│     ├─ Add user metadata (if authenticated)                  │
│     ├─ Include browser/OS/environment                        │
│     └─ Generate correlation ID                               │
│                                                               │
│  3. Error Store Management                                   │
│     ├─ Deduplicate by stack hash                             │
│     ├─ Increment occurrence count                            │
│     ├─ Persist to SessionStorage (dev only)                  │
│     └─ Notify UI subscribers                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    VISUALIZATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ├─ ErrorBadge (floating indicator)                          │
│  ├─ ErrorOverlay (slide-out panel)                           │
│  │   ├─ Error list (filterable, sortable)                   │
│  │   ├─ Error details (tabs: stack, context, network)       │
│  │   ├─ Stack trace viewer (collapsible frames)             │
│  │   └─ Statistics dashboard                                 │
│  └─ Toast notifications (Sonner integration)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
resources/js/
├── lib/errors/
│   ├── types.ts                  # TypeScript interfaces
│   ├── utils.ts                  # Utility functions
│   ├── stack-parser.ts           # Stack trace parsing
│   ├── error-store.ts            # Error storage & persistence
│   ├── error-context.tsx         # React Context provider
│   ├── hooks.ts                  # React hooks
│   └── index.ts                  # Public exports
│
├── components/error-overlay/
│   ├── error-badge.tsx           # Floating error indicator
│   ├── error-overlay.tsx         # Main overlay panel
│   ├── error-list.tsx            # Error list component
│   ├── error-details.tsx         # Detailed error view
│   ├── stack-trace-viewer.tsx   # Stack frame explorer
│   ├── error-stats.tsx           # Statistics dashboard
│   └── index.ts                  # Public exports
│
├── components/
│   └── enhanced-error-boundary.tsx  # Reusable error boundary
│
└── app.tsx                       # Application entry (integrated)
```

---

## Why react-error-boundary Alone is Insufficient

While `react-error-boundary` is excellent for catching React component errors, it has critical limitations:

### ❌ What react-error-boundary **CANNOT** Catch

1. **Async errors** - Promises, setTimeout, setInterval callbacks
2. **Global errors** - window.onerror, script loading failures
3. **Network errors** - HTTP failures, fetch/axios errors
4. **Event handlers** - onClick, onChange errors (unless rethrown)
5. **Non-React errors** - Vanilla JS, third-party scripts
6. **Inertia errors** - Navigation failures, page load errors

### ✅ What This System **DOES** Capture

```typescript
// ❌ react-error-boundary MISSES THIS
async function fetchData() {
  const response = await fetch('/api/data'); // Network error not caught
  throw new Error('Parsing failed'); // Async error not caught
}

// ✅ Our system CATCHES THIS via:
// 1. window.addEventListener('unhandledrejection')
// 2. Manual capture via useErrorHandler hook
```

### Enhanced Capabilities

| Feature | react-error-boundary | This System |
|---------|---------------------|-------------|
| React render errors | ✅ | ✅ |
| Async/Promise errors | ❌ | ✅ |
| Network errors | ❌ | ✅ |
| Global errors | ❌ | ✅ |
| Error deduplication | ❌ | ✅ |
| Error grouping | ❌ | ✅ |
| Stack parsing | ❌ | ✅ |
| Context enrichment | ❌ | ✅ |
| Persistence | ❌ | ✅ |
| Statistics | ❌ | ✅ |
| Visual overlay | ❌ | ✅ |

---

## Installation

### 1. Install Dependencies

```bash
npm install @radix-ui/react-tabs
```

All other dependencies are already in your project.

### 2. Environment Configuration

The system automatically detects the environment from `import.meta.env`:

```env
VITE_APP_ENV=local      # Full features enabled
VITE_APP_ENV=staging    # Full features enabled
VITE_APP_ENV=production # Error badge hidden, no persistence
```

### 3. Integration

The system is **already integrated** in `resources/js/app.tsx`:

```tsx
import { ErrorObservabilityProvider } from './lib/errors/error-context';
import { ErrorBadge, ErrorOverlay } from './components/error-overlay';

// In createInertiaApp setup:
root.render(
  <StrictMode>
    <ErrorObservabilityProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App {...props} />
        <ErrorOverlay />
        <ErrorBadge />
      </ErrorBoundary>
    </ErrorObservabilityProvider>
  </StrictMode>
);
```

---

## Usage Guide

### Basic Usage (Zero Configuration)

The system works automatically once integrated. All frontend errors are captured.

### Manual Error Capture

```typescript
import { useErrorHandler } from '@/lib/errors/hooks';

function MyComponent() {
  const handleError = useErrorHandler();

  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      handleError(error, {
        severity: ErrorSeverity.Warning,
        metadata: { context: 'User clicked submit' }
      });
    }
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Async Error Handling

```typescript
import { useAsyncErrorHandler } from '@/lib/errors/hooks';

function DataLoader() {
  const fetchData = useAsyncErrorHandler(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  });

  return <button onClick={fetchData}>Load Data</button>;
}
```

### Component-Level Error Boundaries

```typescript
import { EnhancedErrorBoundary } from '@/components/enhanced-error-boundary';
import { useErrorObservability } from '@/lib/errors/error-context';

function CriticalSection() {
  const { captureError } = useErrorObservability();

  return (
    <EnhancedErrorBoundary
      captureError={captureError}
      fallback={<div>This section failed to load</div>}
    >
      <ExpensiveComponent />
    </EnhancedErrorBoundary>
  );
}
```

### Accessing Error Stats

```typescript
import { useErrorStats } from '@/lib/errors/hooks';

function ErrorDashboard() {
  const stats = useErrorStats();

  return (
    <div>
      <p>Total Errors: {stats.total}</p>
      <p>Fatal: {stats.bySeverity.fatal}</p>
      <p>Network Errors: {stats.byType.network}</p>
    </div>
  );
}
```

### Controlling the Error Overlay

```typescript
import { useErrorOverlay } from '@/lib/errors/hooks';

function DevTools() {
  const { isOpen, setOpen } = useErrorOverlay();

  return (
    <button onClick={() => setOpen(!isOpen)}>
      Toggle Error Overlay
    </button>
  );
}
```

---

## API Reference

### Hooks

#### `useErrorObservability()`

Returns the full error context.

```typescript
const {
  errors,           // CapturedError[]
  stats,            // ErrorStats
  captureError,     // (error, options?) => void
  clearErrors,      // () => void
  clearError,       // (id: string) => void
  ignoreError,      // (hash: string) => void
  isOverlayOpen,    // boolean
  setOverlayOpen,   // (open: boolean) => void
} = useErrorObservability();
```

#### `useErrorHandler()`

Returns a function to manually capture errors.

```typescript
const handleError = useErrorHandler();
handleError(new Error('Something failed'), {
  severity: ErrorSeverity.Warning,
  metadata: { userId: 123 }
});
```

#### `useAsyncErrorHandler<T>(asyncFn, options?)`

Wraps an async function with error handling.

```typescript
const fetchData = useAsyncErrorHandler(async () => {
  return await api.getData();
}, { severity: ErrorSeverity.Error });
```

#### `useErrorStats()`

Returns error statistics.

```typescript
const stats = useErrorStats();
// { total, byType, bySeverity, byPage }
```

#### `useErrorOverlay()`

Controls the error overlay visibility.

```typescript
const { isOpen, setOpen } = useErrorOverlay();
```

### Types

#### `ErrorType`

```typescript
enum ErrorType {
  React = 'react',
  Runtime = 'runtime',
  Network = 'network',
  Promise = 'promise',
  Inertia = 'inertia',
  Unknown = 'unknown',
}
```

#### `ErrorSeverity`

```typescript
enum ErrorSeverity {
  Fatal = 'fatal',    // Critical errors that break the app
  Error = 'error',    // Standard errors
  Warning = 'warning', // Non-critical issues
  Info = 'info',      // Informational
}
```

#### `CapturedError`

```typescript
interface CapturedError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  source: ErrorSource;
  name: string;
  message: string;
  stack?: string;
  parsedStack?: StackFrame[];
  componentStack?: string;
  metadata: ErrorMetadata;
  networkDetails?: NetworkErrorDetails;
  inertiaDetails?: InertiaErrorDetails;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  hash: string;
}
```

---

## Advanced Patterns

### Network Error Interceptor (Axios)

If you use Axios, add this interceptor:

```typescript
import axios from 'axios';
import { useErrorObservability } from '@/lib/errors/error-context';

// In your app setup:
const { captureError } = useErrorObservability();

axios.interceptors.response.use(
  response => response,
  error => {
    captureError(error, {
      type: ErrorType.Network,
      source: ErrorSource.NetworkInterceptor,
      networkDetails: {
        method: error.config?.method,
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
      }
    });
    return Promise.reject(error);
  }
);
```

### Custom Error Filtering

```typescript
// In error-context.tsx, modify shouldCaptureError():
export function shouldCaptureError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Ignore known non-issues
  if (message.includes('resizeobserver loop')) return false;
  if (message.includes('script error')) return false;
  
  // Add your custom filters
  if (message.includes('analytics')) return false;
  
  return true;
}
```

### Laravel Boost Integration

Correlate frontend errors with backend logs:

```typescript
const handleError = useErrorHandler();

try {
  await router.post('/api/action', data);
} catch (error) {
  handleError(error, {
    metadata: {
      correlationId: generateUUID(), // Send to Laravel
    }
  });
}
```

---

## Performance & Security

### Performance Considerations

1. **Error Storage Limit**: Max 100 errors in memory (configurable in `error-store.ts`)
2. **Stack Parsing**: Cached and lazy-loaded
3. **SessionStorage**: Only in dev/staging (disabled in production)
4. **Toast Throttling**: Automatic deduplication prevents spam

### Security Best Practices

1. **Stack Traces**: Sanitized in production (removes file paths)
2. **User Data**: Only captured if authenticated
3. **Network Bodies**: Not logged by default (add manually if needed)
4. **Production Mode**: Error badge hidden, minimal UI exposure

### Environment-Based Behavior

| Feature | Local/Staging | Production |
|---------|---------------|------------|
| Error badge | ✅ Visible | ❌ Hidden |
| Error overlay | ✅ Full UI | ✅ Read-only |
| SessionStorage | ✅ Enabled | ❌ Disabled |
| Stack traces | ✅ Full paths | ⚠️ Sanitized |
| Toast notifications | ✅ Enabled | ❌ Silent |

---

## Common Pitfalls

### 1. ❌ Forgetting to Install Dependencies

```bash
# Don't forget!
npm install @radix-ui/react-tabs
npm install
```

### 2. ❌ Not Catching Async Errors

```typescript
// ❌ BAD - Error not caught
const onClick = async () => {
  await fetch('/api'); // If this fails, error is lost
};

// ✅ GOOD - Use useAsyncErrorHandler
const onClick = useAsyncErrorHandler(async () => {
  await fetch('/api');
});
```

### 3. ❌ Overriding Global Error Handlers

```typescript
// ❌ BAD - Breaks error observability
window.onerror = () => false;

// ✅ GOOD - Use the error context
const { captureError } = useErrorObservability();
```

### 4. ❌ Ignoring TypeScript Errors

All hooks and types are fully typed. Use TypeScript!

### 5. ❌ Forgetting Environment Variables

```env
# Required for proper environment detection
VITE_APP_ENV=local
```

---

## Troubleshooting

### Errors Not Being Captured

1. **Check if ErrorObservabilityProvider is mounted**
   ```tsx
   // Must wrap entire app
   <ErrorObservabilityProvider>
     <App />
   </ErrorObservabilityProvider>
   ```

2. **Verify global listeners are attached**
   - Open DevTools → Console
   - Type: `window.onerror`
   - Should show custom handler

3. **Check shouldCaptureError() filters**
   - Some errors are intentionally ignored
   - See `lib/errors/utils.ts`

### Error Overlay Not Appearing

1. **Environment check**
   ```typescript
   // In dev, badge should be visible
   console.log(import.meta.env.VITE_APP_ENV);
   ```

2. **Check if errors exist**
   ```typescript
   const { errors } = useErrorObservability();
   console.log(errors);
   ```

3. **Toggle manually**
   ```typescript
   const { setOverlayOpen } = useErrorOverlay();
   setOverlayOpen(true);
   ```

### TypeScript Errors

1. **Missing dependencies**
   ```bash
   npm install @radix-ui/react-tabs
   ```

2. **Path aliases**
   - Ensure `@/` alias is configured in `tsconfig.json`

### Performance Issues

1. **Too many errors stored**
   - Increase deduplication in `error-store.ts`
   - Clear errors periodically: `clearErrors()`

2. **Heavy stack parsing**
   - Stack parsing is lazy - only happens on error details view

---

## Next Steps

### Recommended Enhancements

1. **Backend Integration**
   - Send critical errors to Laravel via API
   - Use Laravel Boost correlation IDs

2. **Analytics**
   - Track error trends over time
   - Export to external monitoring tools

3. **Custom Severity Rules**
   - Define domain-specific severity classification
   - Auto-escalate certain error patterns

4. **Error Recovery Strategies**
   - Implement automatic retry logic
   - Add custom recovery actions per error type

---

## Summary

This error observability system provides:

✅ **Comprehensive error capture** across all frontend layers  
✅ **Beautiful, production-ready UI** for error visualization  
✅ **Zero-config integration** with your existing Laravel + Inertia app  
✅ **Full TypeScript support** with complete type safety  
✅ **Environment-aware behavior** for dev/staging/production  
✅ **Performance optimized** with deduplication and smart caching  

**The system is production-ready and requires no additional configuration beyond `npm install`.**

---

## Support

For issues or questions:
1. Check this documentation first
2. Review TypeScript types in `lib/errors/types.ts`
3. Examine example usage in hooks and components
4. Test in local environment before deploying to staging

**Happy debugging! 🐛✨**
