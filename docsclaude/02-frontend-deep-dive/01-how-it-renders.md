# How React Renders under the Hood

A junior developer thinks React updates the DOM every time a variable changes; a senior developer understands the distinction between the render phase and the commit phase, the role of Fiber nodes, and how reconciliation cycles evaluate changes.

---

## 1. Render Phase vs. Commit Phase

React's execution is divided into two main parts:
1. **Render Phase:** React traverses the component tree from the root, invoking component functions to generate a new Virtual DOM representation. This phase is purely computational and can be paused or discarded by React's scheduler.
2. **Commit Phase:** React applies the computed minimal differences to the real DOM (via `react-dom`). This phase is synchronous and cannot be interrupted. After the commit, the `useLayoutEffect` and `useEffect` hooks are scheduled.

---

## 2. Reconciliation and Key Properties in Lists

When React evaluates a component returning a list of elements, it uses the `key` prop to identify which items have changed, been added, or been removed.

Let's look at the row rendering inside the ticket list:
[frontend/src/features/tickets/pages/TicketListPage.tsx:136-160](frontend/src/features/tickets/pages/TicketListPage.tsx#L136-L160)

```tsx
            <tbody className="divide-y divide-gray-800/60">
              {data?.data?.map((ticket: any) => {
                const slaBreached = new Date(ticket.slaDueAt) < new Date() && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED';
                const formattedSla = new Date(ticket.slaDueAt).toLocaleString();

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-gray-800/30 transition-colors cursor-pointer text-sm"
                  >
```

### Why ticket.id is the Only Valid Key
- **Re-ordering Safety:** If you used the array index `(ticket, index) => key={index}`, and then sorted or paginated the list, React would assume the first row represents the same Fiber node, simply with updated properties. This breaks internal input states and triggers unnecessary DOM re-paints.
- **Identity Retention:** By using `key={ticket.id}`, React tracks the literal record across sorting actions and shifts it inside the virtual tree without reconstructing the entire DOM tree node, preserving performance.

> **Senior aside:** *Never use `Math.random()` or dynamic indexes as list keys. Doing so forces React to destroy and recreate the DOM node on every single render cycle, completely wiping out reconciliation benefits and degrading system responsiveness.*

---

## Pitfall Checklist

1. **Using array index as list key:** Causing input states to mix up and triggering DOM recreation.
2. **Dynamic key generation on render:** Assigning `key={Math.random()}` which destroys the reconciliation pipeline.
3. **Inline Object Creation in Props:** Passing `{}` or `() => {}` inline down to child components, triggering unnecessary re-renders.
4. **Mutating state directly:** Doing `state.items.push(x)` and expecting React to register the reference change.
5. **Infinite render loops:** Triggering state updates directly inside the component body instead of wrapped inside handlers or effects.
6. **Excessive nesting of components:** Defining components *inside* other components, recreating their Fiber structures on every render.
7. **Over-using useEffect for synchronization:** Performing derived computations inside effects rather than inline.
8. **Ignoring hook dependencies arrays:** Bypassing warnings or leaving dependencies empty, leading to stale closures.

---

## Drills

1. **Analyze Re-renders:** Open [frontend/src/features/tickets/pages/TicketListPage.tsx:12-25](frontend/src/features/tickets/pages/TicketListPage.tsx#L12-L25). Explain how many times the list will re-render when a user types into the search input.
2. **Optimize Rendering:** Refactor a mock list item to use `React.memo` to prevent re-renders when parent states mutate independently.
3. **Inspect Fiber Nodes:** Use the React DevTools Profiler to record a search filter event and explain what components were updated and why.
