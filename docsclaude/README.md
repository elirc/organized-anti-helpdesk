# AntiHelpdesk Engineering Upskilling Curriculum

> Snapshot note: this repo is an organized snapshot of `elirc/antihelpdesk`. Its code and `docsclaude/` pages matched that repo (which also adds an `astraupskill/` course and `tests/*.mjs` files not present here), so the `docsclaude/` refinements made there are carried over here.

This repository serves as a real-world sandbox for modern, multi-tenant SaaS engineering. The curriculum inside this directory is designed to take an engineer with basic JavaScript/TypeScript knowledge and upskill them into a senior-level engineer capable of writing, maintaining, and reviewing production-grade enterprise software.

Unlike generic tutorials, every concept here is anchored directly in the production codebase of this multi-tenant helpdesk portal. You will see why specific design patterns were chosen, identify where the code has trade-offs or fragilities, and practice through real drills and mock tickets.

---

## The Journey Arc: 8-Week Syllabus

| Week | Module | Focus Area |
| --- | --- | --- |
| Week 1 | [01-language-and-runtime-core/](01-language-and-runtime-core/README.md) | V8, event-loop microtasks, Promise safety, and advanced TS types |
| Week 2 | [02-frontend-deep-dive/](02-frontend-deep-dive/README.md) | React commit phases, custom Zustand stores, and Query caching |
| Week 3 | [03-server-mastery/](03-server-mastery/README.md) | Node.js lifecycle, Prisma query batching, and tenant middle-layers |
| Week 4 | [04-architecture-and-patterns/](04-architecture-and-patterns/README.md) | Pure layer architectures, validation contracts, and audit trails |
| Week 5 | [05-quality-engineering/](05-quality-engineering/README.md) | Query plan analyzing, OWASP security threats, and test mock isolation |
| Week 6 | [06-practice-tracks/](06-practice-tracks/README.md) | Codebase-guided reading katas and Easy-to-Expert ticketing tracks |
| Week 7 | [07-career-skills/](07-career-skills/README.md) | Engineering leadership, RFC writing, and technical interviews |
| Week 8 | [CRITIQUE.md](CRITIQUE.md) | Structural self-evaluation of design choices and curriculum gaps |

---

## Architectural Ground Rules

Every engineering design is defined by its invariants. Within the AntiHelpdesk codebase, you must respect the following core tenants:
1. **Multi-Tenant Scoping:** All operations on tickets, comments, or activities must explicitly isolate database queries using `organizationId`. A failure here is a catastrophic data breach.
2. **RBAC Isolation:** Requesters are blocked from writing or reading internal notes, and cannot alter ticket assignees.
3. **Workflow Control:** Ticket status changes must follow the strict path enforced by the workflow machine.

---

## Pedagogical Conventions

To get the most out of these materials, pay close attention to:
- **Citations:** Every single architectural claim links to exact file locations and line ranges. You must open these links in your IDE to cross-reference as you read.
- **Senior Asides:** Callouts that explain the "taste" or downstream maintenance consequences of a chosen design.
- **Drills & Pitfalls:** Actionable micro-exercises and code-review checklists at the end of every document.
