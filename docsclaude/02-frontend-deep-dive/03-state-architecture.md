# Global State Architecture with Zustand

A senior engineer separates global client state (user sessions, application preferences) from server-cached state (tickets, comments, database entries). Storing database entities in a global client state manager introduces massive sync bugs and caching issues.

---

## 1. Store Design and Selector Optimization

We use **Zustand** to manage client credentials, tokens, and active session boundaries. It is lightweight, does not require Context Providers, and updates components efficiently via **Selectors**.

Let's study the store declaration:
[frontend/src/auth/auth.store.ts:20-35](frontend/src/auth/auth.store.ts#L20-L35)

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      login: (user, accessToken) => set({ user, accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'helpdesk-auth',
    }
  )
);
```

### The Power of Selectors
When you consume global state inside a component, always extract properties using a selector function:
```typescript
// Good selector usage:
const user = useAuthStore((state) => state.user);
```
If you import the hook broad-style:
```typescript
// Bad selector usage:
const { user, accessToken } = useAuthStore();
```
The component will re-render every time *any* property inside the store changes (such as refreshing the `accessToken`), even if `user` remains identical. Using specific selectors isolates components from unrelated state updates.

---

## 2. LocalStorage Persistence Middleware

The `persist` middleware automatically intercept state modifications and mirrors the updated JSON structure inside browser storage (localStorage). When the user opens the application, Zustand automatically hydrates the store before rendering, preserving the login session.

> **Senior aside:** *Never store raw unencrypted sensitive information like banking details or plain passwords in state persistence middleware. Browser local storage is highly vulnerable to Cross-Site Scripting (XSS) extraction attacks. Keep tokens short-lived and secure.*

---

## Pitfall Checklist

1. **Broad store imports:** Using `const state = useStore()` which triggers re-renders on every change.
2. **Mixing server and client state:** Storing fetched tickets inside Zustand instead of relying on TanStack Query.
3. **Persisting heavy objects:** Storing DOM nodes, class instances, or complex files in local storage.
4. **Missing shallow comparisons:** Forgetting to use `shallow` middleware when selecting array structures.
5. **No hydration boundary management:** Triggering server-side errors (in SSR frameworks) because of initial local storage reading mismatch.
6. **Mutating Zustand state inline:** Attempting to alter properties within the selected object instead of using the `set()` helper.
7. **Multiple bloated stores:** Creating one giant store for everything rather than small modular slices.
8. **Inconsistent keys in persist config:** Changing the `name` key across versions, wiping out prior client sessions.

---

## Drills

1. **Optimize Selectors:** Open [frontend/src/auth/RequireAuth.tsx:4-12](frontend/src/auth/RequireAuth.tsx#L4-L12) and explain why the selector choice there protects the route guard from infinite rendering loop checks.
2. **Shallow Matching Experiment:** Create a mock store holding an array of filters and write a component that renders them utilizing Zustand's `useStore(selector, shallow)` to verify re-render counts.
3. **Trace Storage Hydration:** Clear your local browser storage and trace how the app layout changes between anonymous and authenticated sessions.
