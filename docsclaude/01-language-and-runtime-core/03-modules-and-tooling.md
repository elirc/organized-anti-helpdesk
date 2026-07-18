# Modules and Tooling in a Monorepo Ecosystem

A senior engineer treats their package manifests, module loaders, and compilers as critical engineering structures. A misconfigured module resolution or a loose version range inside your dependencies can introduce silent build breaks or production regressions.

---

## 1. Monorepo Architecture with Workspaces

Our codebase utilizes a native npm workspace layout:
[package.json:5-8](package.json#L5-L8)

```json
  "workspaces": [
    "frontend",
    "backend"
  ],
```

### How Workspaces Resolve Modules
1. During `npm install`, npm inspects the root `package.json` and locates directories within the `workspaces` array.
2. It resolves dependency sub-trees for both `frontend` and `backend`, hoisting matching versions to the root `node_modules` directory to avoid duplicate downloads.
3. For local workspaces, npm creates symlinks. Inside `node_modules`, symlinks point to `../frontend` and `../backend`, allowing workspaces to import from each other directly without publishing to a registry.

---

## 2. Reading package.json Like a Senior

Let's dissect the backend configuration:
[backend/package.json:11-32](backend/package.json#L11-L32)

```json
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "zod": "^3.23.8",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    ...
```

### Key Version Operators
- **Caret (`^2.8.5`):** Allows upgrades to newer minor/patch versions (compatible changes under semantic versioning). Node will pull `>=2.8.5 <3.0.0`.
- **Tilde (`~1.6.0`):** Limits updates to patches only.
- **Exact (`5.14.0`):** Locks the dependency strictly. We see this with Prisma packages to prevent version mismatches between the compiler CLI and runtime client.

> **Senior aside:** *Always use exact versions for toolchain components like compilers, prisma engines, and test frameworks. Minor differences between your local compiler and the CI build server can cause subtle compilation discrepancies.*

---

## 3. ESM vs CommonJS Boundaries

Modern JavaScript has two module systems:
1. **CommonJS (CJS):** Standard Node.js format using `require()` and `module.exports`. Synchronous loading at runtime.
2. **ES Modules (ESM):** Standardized format using `import` and `export`. Statically analyzable at compile-time, allowing tools like Vite to perform **tree-shaking** (removing unused code branches).

Our backend uses standard CommonJS target resolution via tsx watch:
[backend/package.json:6](backend/package.json#L6)
```json
    "dev": "tsx watch src/server.ts",
```
`tsx` transparently compiles ESM-style imports into CJS execution on the fly during local execution.

---

## Pitfall Checklist

1. **Hoisting conflicts:** Mismatched versions of transitive dependencies compiled differently by the bundler.
2. **Lockfile neglect:** Committing code changes without committing the accompanying `package-lock.json` file.
3. **Mismatched types:** Adding a dev-dependency for types (`@types/node`) that mismatches the actual engine target runtime version.
4. **Circular workspace imports:** Workspace A importing from B, which imports from A, causing build loops.
5. **DevDependencies in production:** Registering backend runtime libraries (like `express`) as devDependencies, resulting in runtime missing modules on deploy.
6. **Implicit imports:** Importing files from a sibling workspace package without registering it in the package manifest.
7. **Locking version ranges loosely:** Using `*` or wide ranges for critical infrastructure modules.
8. **Divergent tsconfig files:** Mismatched compilation rules between frontend and backend workspaces.

---

## Drills

1. **Dependency Audit:** Open [backend/package.json:11-18](backend/package.json#L11-L18). Identify which dependencies are runtime database connectors vs parsing validation structures.
2. **Lockfile Inspection:** Open the root `package-lock.json` and trace how many times `typescript` is registered and resolved.
3. **Compilation Config Comparison:** Compare `tsconfig.json` inside the `frontend` folder with `tsconfig.json` in the `backend` folder. Note the differences in targets and module system output rules.
