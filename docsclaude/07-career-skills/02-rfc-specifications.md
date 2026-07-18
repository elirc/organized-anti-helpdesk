# RFC (Request for Comments) Specification Guide

A senior staff engineer leads engineering efforts through written communication. Before writing any code for major architectural changes, they document the technical design, tradeoffs, and migration plan in a **Request for Comments (RFC)** document to align the team.

---

## Why Write an RFC?

1. **Alignment:** Ensures the team agrees on the high-level architecture before time is spent writing code.
2. **Tradeoff Analysis:** Explains why a specific technology or design path was selected over alternatives.
3. **Migration Planning:** Outlines how existing data and active environments will migrate to the new structure without downtime.
4. **Documentation:** Serves as a historical reference for future developers explaining *why* the system was built this way.

---

## Standard RFC Template

Use this markdown structure when writing architectural proposals:

```markdown
# RFC [ID]: [Title of Proposal]

**Author:** [Your Name]  
**Status:** [Draft / Under Review / Approved / Rejected]  
**Created At:** [YYYY-MM-DD]  
**Target Module:** [e.g. backend/src/modules/tickets]

---

## 1. Executive Summary
Provide a brief, high-level summary of the problem, the proposed solution, and what this change will accomplish.

## 2. Background Context
Detail why this change is necessary. Explain the limitations of the current implementation, citing specific file anchors in the repository.

- **Current File Anchor:** [tickets.service.ts#L186-207](file:///c:/Users/Owner/Desktop/antihelpdesk/backend/src/modules/tickets/tickets.service.ts#L186-L207)

## 3. Proposed Architecture
Detail the core technical design of your solution.
- **Component Changes:** Group proposed modifications by file.
- **Database Schema Updates:** Include a diff of the Prisma schema files.
- **Data Flow Diagram:** Add a Mermaid chart explaining the runtime request-response lifecycle.

## 4. Technical Tradeoffs
List the architectural paths you considered and explain why you selected this solution.

| Architectural Path | Advantages | Disadvantages |
|:---|:---|:---|
| Option A: Proposed | High isolation | Added DB writes |
| Option B: Alternative| Faster responses | Security risk |

## 5. Security & Isolation Analysis
Trace how the proposed change impacts security. Detail how multi-tenant isolation, IDOR prevention, and RBAC rules are maintained.

- **Pre-merge Security Check:** Trace compliance against the 15-item security checklist.

## 6. Migration & Deployment Plan
Outlines step-by-step how to deploy this change to production without downtime.
- **Database Migrations:** Running migrations concurrently to avoid locking large live tables.
- **Feature Flags:** Deploying code behind flags to test changes in isolation.
- **Rollback Plan:** Explains how to revert the changes if deployment issues occur.
```

> **Senior aside:** *Writing is the most high-leverage skill an engineer can develop. A well-written RFC can save weeks of redundant coding and protect the system from expensive architectural mistakes.*
