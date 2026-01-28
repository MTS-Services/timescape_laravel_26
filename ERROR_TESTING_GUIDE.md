# Error Observability System - Testing Guide

## Quick Test Scenarios

This guide provides manual test scenarios to validate the frontend error observability system.

### 1. React Render Errors

**Test A: Component Render Error**
```tsx
// Add to any page component temporarily
const TestErrorComponent = () => {
    throw new Error('Test React render error');
    return <div>This won't render</div>;
};

// In your page:
<TestErrorComponent />
```

**Expected Result:**
- ❌ Error boundary catches the error
- 🔔 Toast notification appears
- 🔴 Red error badge appears (bottom-right)
- 📊 Error appears in overlay with component stack

---

### 2. Async/Promise Errors

**Test B: Unhandled Promise Rejection**
```tsx
// Add to button onClick or useEffect
const testPromiseError = () => {
    Promise.reject(new Error('Test unhandled promise rejection'));
};

// In component:
<Button onClick={testPromiseError}>Test Promise Error</Button>
```

**Expected Result:**
- ✅ `window.onunhandledrejection` captures error
- 🔔 Toast notification with "PROMISE" type
- 📊 Error logged with type: "promise"

---

### 3. Runtime JavaScript Errors

**Test C: Undefined Variable Access**
```tsx
const testRuntimeError = () => {
    // @ts-ignore
    console.log(undefinedVariable.property);
};

<Button onClick={testRuntimeError}>Test Runtime Error</Button>
```

**Expected Result:**
- ✅ `window.onerror` captures error
- 🔔 Toast notification with "RUNTIME" type
- 📊 Stack trace shows exact line

---

### 4. Network Errors

**Test D: Failed Fetch Request**
```tsx
import { useErrorHandler } from '@/lib/errors/hooks';

const handleError = useErrorHandler();

const testNetworkError = async () => {
    try {
        await fetch('https://invalid-url-that-does-not-exist.test');
    } catch (error) {
        handleError(error as Error, {
            type: ErrorType.Network,
            networkDetails: {
                method: 'GET',
                url: 'https://invalid-url-that-does-not-exist.test',
                status: 0,
            },
        });
    }
};
```

**Expected Result:**
- ✅ Manual error capture works
- 🔔 Toast shows "NETWORK" error
- 📊 Network tab shows request details

---

### 5. Inertia Navigation Errors

**Test E: Invalid Route Navigation**
```tsx
import { router } from '@inertiajs/react';

const testInertiaError = () => {
    router.visit('/nonexistent-route-12345');
};
```

**Expected Result:**
- ✅ Inertia error listener captures 404
- 🔔 Toast shows "INERTIA" error
- 📊 Shows failed navigation details

---

## Testing the Error Overlay

### Open the Overlay
1. Trigger any error from tests above
2. Click the **red error badge** (bottom-right corner)
3. Overlay slides in from the right

### Verify Overlay Features

**Error List (Left Panel)**
- ✅ Shows all captured errors
- ✅ Grouped by stack hash
- ✅ Shows count for duplicates
- ✅ Color-coded by severity
- ✅ Click to view details

**Error Details (Right Panel)**
- ✅ **Overview Tab**: Message, type, severity, timestamp
- ✅ **Stack Trace Tab**: Collapsible frames with file/line/column
- ✅ **Context Tab**: User, route, browser, environment data
- ✅ **Network Tab** (if network error): Request/response details

**Filtering**
- ✅ Filter by type (React, Runtime, Network, etc.)
- ✅ Filter by severity (Fatal, Error, Warning, Info)
- ✅ Clear filters button appears when active

**Stats Dashboard**
- ✅ Total errors count
- ✅ Breakdown by type
- ✅ Breakdown by severity
- ✅ Most affected pages

**Actions**
- ✅ Clear all errors
- ✅ Delete individual error
- ✅ Ignore error (future occurrences)
- ✅ Copy error JSON
- ✅ Export all errors

---

## Environment-Specific Behavior

### Local/Staging Environment
- ✅ Error badge visible
- ✅ Toast notifications enabled
- ✅ Errors persisted to SessionStorage
- ✅ Full stack traces shown
- ✅ All error details available

### Production Environment
- ❌ Error badge **hidden**
- ❌ Toast notifications **disabled**
- ❌ SessionStorage **disabled**
- ✅ Errors still captured (for future backend integration)
- ✅ Stack traces sanitized (no file paths)

**Test:** Change `VITE_APP_ENV` in `.env`:
```bash
# Test production behavior
VITE_APP_ENV=production

# Test staging behavior
VITE_APP_ENV=staging

# Test local behavior (default)
VITE_APP_ENV=local
```

Then rebuild: `npm run build` or restart `npm run dev`

---

## Performance Testing

### Test Deduplication
1. Trigger the same error 5 times
2. Check overlay - should show **1 error with count: 5**
3. Verify `firstOccurrence` and `lastOccurrence` timestamps

### Test Max Errors Limit
1. Trigger 110 different errors
2. Check overlay - should show max **100 errors**
3. Oldest errors automatically pruned

### Test Memory Usage
1. Open browser DevTools → Performance/Memory
2. Trigger 50 errors
3. Check memory usage stays reasonable
4. Clear all errors
5. Verify memory is freed

---

## Integration Testing

### With Existing Error Boundary
1. The system wraps your existing `ErrorBoundary`
2. Both should work together
3. Test: Throw error in a component with nested boundaries

### With Inertia Router
1. Test navigation errors
2. Test form submission errors
3. Verify correlation with Inertia events

### With Toast System (Sonner)
1. Errors should show as toasts
2. Click "View Details" action in toast
3. Should open error overlay automatically

---

## Debugging Tips

### Check Console
```javascript
// In browser console:
window.__ERROR_STORE__ // Access error store (if exposed)
```

### Check SessionStorage
```javascript
// In browser console:
sessionStorage.getItem('frontend-errors')
```

### Enable Verbose Logging
```tsx
// In error-context.tsx, add console.log:
console.log('Error captured:', capturedError);
```

---

## Common Issues & Solutions

### Error Badge Not Appearing
- Check environment (hidden in production)
- Verify `ErrorBadge` is rendered in `app.tsx`
- Check z-index conflicts

### Toasts Not Showing
- Verify `Toaster` component is rendered
- Check environment setting
- Ensure Sonner is installed

### Errors Not Captured
- Check browser console for script errors
- Verify `ErrorObservabilityProvider` wraps app
- Check if error is being filtered out

### Stack Traces Missing
- Some minified errors lack stacks
- Production builds may obscure sources
- Enable source maps in Vite

---

## Next Steps

After validating all scenarios:

1. **Backend Integration**: Send critical errors to Laravel API
2. **Analytics**: Track error trends over time
3. **Alerting**: Set up notifications for critical errors
4. **Recovery**: Implement error recovery strategies
5. **Documentation**: Update team wiki with error handling best practices

---

## Checklist

- [ ] Test React render errors
- [ ] Test promise rejections
- [ ] Test runtime errors  
- [ ] Test network errors
- [ ] Test Inertia errors
- [ ] Test error overlay UI
- [ ] Test filtering functionality
- [ ] Test environment behavior
- [ ] Test deduplication
- [ ] Test performance with many errors
- [ ] Verify production safety
- [ ] Document any issues found
