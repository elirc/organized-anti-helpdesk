# Systematic Debugging: The Socratic Method

A junior developer debugs by changing random lines of code, hoping the bug disappears (and introducing three new ones). A senior developer works systematically: they reproduce the error in isolation, form hypotheses, inspect boundary metrics, and fix the underlying root cause.

---

## 1. The Five-Step Debugging Protocol

When a bug occurs in production or staging, follow this sequence:
1. **Reproduce:** Establish a deterministic, isolated reproduction script or test case.
2. **Narrow:** Inspect the perimeter. Determine if the error occurs in the user interface (UI render), the wire transport layer (HTTP responses), the backend service logic, or PostgreSQL.
3. **Hypothesize:** Formulate 2-3 logical hypotheses explaining *why* the system is behaving this way under these constraints.
4. **Test:** Validate your hypotheses systematically by logging values or inspecting debug trace variables.
5. **Fix & Verify:** Repair the root cause and ensure your integration tests assert against future regressions.

---

## 2. Debugging Case Study: Client Expiry Interception

Let's study how the frontend HTTP client intercepts authorization expiration errors:
[frontend/src/api/client.ts:25-38](frontend/src/api/client.ts#L25-L38)

```typescript
  let response = await fetch(`${BASE_URL}${endpoint}`, config);

  // If 401, attempt refresh token flow (Wait, for now we will just log out or handle refresh if available)
  if (response.status === 401 && accessToken && !options.skipAuth) {
    // Attempting refresh token flow could go here.
    // For MVP, we will trigger logout on authorization expiry.
    logout();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
```

### Diagnosing a Silent Token Crash
- **Symptom:** The user navigates to the dashboard, but the UI goes completely blank, and no error message is visible.
- **Systematic Diagnostic Pipeline:**
  1. **Browser Console:** Open Chrome DevTools. Inspect the **Network Panel**.
  2. **HTTP Wire verification:** Trace the `/dashboard/summary` network request. Note that the request returns `401 Unauthorized`.
  3. **Code Inspection:** Walk through `apiFetch`. When it receives a 401, it calls `logout()` and throws an `Error('Unauthorized')`.
  4. **The Root Cause:** The calling component does not wrap `apiFetch` in a TanStack Query error boundary, causing the unhandled exception to bubble up and crash the local React tree.
  5. **The Fix:** Add a React ErrorBoundary at the route layout layer to catch authorization expiration errors and cleanly redirect users back to `/login`.

> **Senior aside:** *Always use your browser's Network and Performance tabs to inspect before changing any code. A single look at the HTTP status codes or DB query logs will save you hours of guesswork.*

---

## Pitfall Checklist

1. **Debugging by random trial-and-error:** Changing code blocks blindly without understanding the error stack trace.
2. **Ignoring error logs:** Writing empty try-catch blocks that swallow exceptions silently.
3. **Not inspecting the Network panel first:** Guessing what an API returns instead of looking at the JSON response payload.
4. **Incorrect environment variables:** Debugging a local system while pointing to a staging or production database.
5. **Swallowing stack traces:** Throwing generic errors (`throw new Error('Something went wrong')`) that strip out database diagnostic traces.
6. **No client error boundaries:** Letting single component failures crash the entire React application page.
7. **Relying on console.log in production:** Leaving verbose logging scripts active on production build setups.
8. **Under-utilizing breakpoints:** Writing nested prints instead of setting breakpoints in your editor.

---

## Drills

1. **Trace Auth Refreshes:** Open [frontend/src/api/client.ts:27-33](frontend/src/api/client.ts#L27-L33) and explain how you would modify this block to attempt a refresh token flow before logging the user out.
2. **Simulate Network Failure:** In your browser devtools, set the network speed to "Offline" or "Slow 3G" and trace how the loading cards of your application behave.
3. **Analyze Database Error Trace:** Purposely inject a syntax error into a Prisma model query and verify how the Express global error middleware logs it to the server console.
