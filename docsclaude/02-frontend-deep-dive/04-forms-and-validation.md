# Real-World Form Management & Validation

A junior engineer uses inline state hooks (`useState`) to manage forms, triggering re-renders on every single keystroke. A senior engineer uses uncontrolled form architectures to offload input tracking to the DOM, combining it with schema-based parsers to validate fields at boundaries.

---

## 1. Uncontrolled Forms via React Hook Form

We integrate **React Hook Form** to maximize performance. It hooks into inputs via standard DOM references (`ref`), skipping React component update cycles until submit events are fired.

Let's review the registration page form:
[frontend/src/auth/RegisterPage.tsx:21-41](frontend/src/auth/RegisterPage.tsx#L21-L41)

```typescript
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const orgName = watch('organizationName');

  // Auto-slugify organization name
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('organizationName', val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('organizationSlug', slug, { shouldValidate: true });
  };
```

### The Uncontrolled Reference Hook
By executing `{...register('email')}`, React Hook Form attaches:
- A `name` string property (`"email"`).
- An `onChange` and `onBlur` callback listener.
- A DOM `ref` pointer.

This allows us to track field changes without setting React state. If we need to read a field value in real-time (like for slug calculations), we selectively call `watch()`, keeping rendering boundaries narrow and precise.

---

## 2. Compile-Time Form Inference

By binding the Zod schema with the form typing, the compiler automatically matches schema constraints with our input tags.

[frontend/src/auth/RegisterPage.tsx:9-19](frontend/src/auth/RegisterPage.tsx#L9-L19)
```typescript
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  organizationSlug: z.string().min(1, 'Organization slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lower case, numbers or hyphens only'),
});
```
This guarantees that if the schema requirements change, the compiler immediately flags compilation warnings inside the form file if input structures mismatch.

> **Senior aside:** *Always map your Zod schemas directly to TypeScript types using `z.infer<typeof schema>`. Never write duplicate interfaces manually. A single source of truth prevents drift between validation constraints and type declarations.*

---

## Pitfall Checklist

1. **Inline onChange state tracking:** Syncing text inputs to state on every key strike, destroying mobile browser performance.
2. **Missing key error bindings:** Creating form inputs without displaying their corresponding Zod validation message.
3. **Hardcoding enums in selects:** Mismatching select values with the database's schema expectations.
4. **Skipping client-side slug validation:** Permitting characters that will trigger database slug unique violations.
5. **No submission status locking:** Permitting double-clicks on submit buttons, triggering duplicate network requests.
6. **Bypassing validation boundaries:** Direct state mutations outside handleSubmit callbacks.
7. **Unnecessary watch calls:** Watching the entire form rather than specific target fields.
8. **Loose pattern matches:** Using complex regexes that fail standard browser validation checks.

---

## Drills

1. **Analyze Forms Validation:** Open [frontend/src/features/tickets/pages/CreateTicketPage.tsx:10-25](frontend/src/features/tickets/pages/CreateTicketPage.tsx#L10-L25). Explain how the SLA limits are enforced in the priority schemas.
2. **Slugify Verification:** Inspect [frontend/src/auth/RegisterPage.tsx:28-40](frontend/src/auth/RegisterPage.tsx#L28-L40). Explain how you would extend the slugify regex to replace underscores with dashes.
3. **Double Submission Test:** Add a test loading block to a local form and verify that the submit button disables completely during active API calls.
