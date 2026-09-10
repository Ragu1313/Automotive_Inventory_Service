# Automotive Service Inventory System
## Software Design & Development Specification (SDS)

**Document ID:** ASIS-SDS-001
**Version:** 1.0
**Status:** Baselined for Development
**Prepared for:** Development Team (2 Engineers)
**Architecture:** Spring Cloud Microservices
**Stack:** React + Tailwind CSS · Spring Boot · PostgreSQL

---

## Document Control

| Field | Value |
|---|---|
| Document Title | Automotive Service Inventory System — Software Design & Development Specification |
| Document ID | ASIS-SDS-001 |
| Version | 1.0 |
| Status | Baselined for Development |
| Document Type | Combined SRS + SDD (Build Specification) |
| Supersedes | None |
| Related Documents | ASIS-PLAN-001 (Master Planning Document), ASIS-SAD-001 (System Architecture & Design Document) |
| Audience | Developers, Reviewers, Evaluators |
| Review Cycle | End of each build phase |

### Revision History

| Version | Date | Author | Change Summary |
|---|---|---|---|
| 0.1 | — | Team | Initial domain selection and concept |
| 0.5 | — | Team | Monolith-to-microservices architecture revision |
| 1.0 | — | Team | Baselined build specification — requirements, data model, API contracts, standards |

---

## Table of Contents

**PART A — PROJECT DEFINITION**
1. About This Document
2. Project Overview — What Is What
3. Glossary and Domain Terminology
4. Stakeholders, Roles and Permission Matrix

**PART B — REQUIREMENTS**
5. Functional Requirements
6. Non-Functional Requirements
7. Business Rules

**PART C — ARCHITECTURE AND DESIGN**
8. System Architecture
9. Technology Stack Specification
10. Service Catalog — What Each Service Does

**PART D — DATA DESIGN**
11. Database Design Principles
12. Complete Database Schema — Tables and Fields
13. Enumerations Reference
14. Indexes, Constraints and Entity Relationships

**PART E — INTERFACE DESIGN**
15. API Design Conventions
16. Complete API Contract Specification
17. Inter-Service Communication Contracts

**PART F — BEHAVIOURAL DESIGN**
18. Use Cases and Sequence Flows
19. Reorder Intelligence Engine — Algorithm Specification

**PART G — IMPLEMENTATION STANDARDS**
20. Project Folder Structure
21. Coding Standards and Naming Conventions
22. Configuration, Ports and Environment Setup

**PART H — DELIVERY**
23. Frontend Screen Inventory
24. Build Phases and Work Allocation
25. Testing Strategy and Test Cases
26. Definition of Done
27. Risks and Out-of-Scope Declarations

---

# PART A — PROJECT DEFINITION

## 1. About This Document

### 1.1 Purpose

This is the single build specification for the Automotive Service Inventory System. It is written to be the only document a developer needs open while writing code. If a question arises during implementation — what a field is called, what an endpoint returns, which service owns a table, what happens when a rule is violated, how a folder is named — the answer is intended to be in here.

It combines what larger organisations split into two documents: a Software Requirements Specification (what the system must do, stated as numbered, testable requirements) and a Software Design Document (how it will be built — architecture, data model, interfaces, standards). They are combined here because the team is two people building against one shared plan, and a single authoritative document removes the risk of the two drifting apart.

### 1.2 How to Use This Document

- **Before writing any code**, both developers read Parts A through C end to end. The service boundaries and the permission matrix are the two things that are expensive to change later.
- **While building a feature**, work from its functional requirement ID (Part B) to its API contract (Part E) to its data model (Part D). Every requirement is traceable through all three.
- **When you disagree with something in here**, change the document first, then the code. A code change that contradicts this document without updating it is how a two-person team ends up with two different mental models of the same system.
- **Section 26 (Definition of Done)** is the checklist for calling a feature complete. Nothing merges to `main` without meeting it.

### 1.3 Traceability Convention

Every requirement carries a stable identifier so it can be referenced from code comments, commit messages, test names, and the final project report.

| Prefix | Meaning | Example |
|---|---|---|
| FR-xxx-nn | Functional requirement | FR-INV-03 |
| NFR-nn | Non-functional requirement | NFR-07 |
| BR-nn | Business rule | BR-12 |
| UC-nn | Use case / sequence flow | UC-04 |
| API-xxx-nn | API endpoint specification | API-JOB-05 |
| SCR-nn | Frontend screen | SCR-14 |
| TC-nn | Test case | TC-09 |
| RSK-nn | Risk | RSK-03 |

### 1.4 Document Conventions

- Table field types are written as PostgreSQL types. The Java/JPA equivalent is implied (`BIGINT` → `Long`, `DECIMAL` → `BigDecimal`, `TIMESTAMP` → `LocalDateTime`, `DATE` → `LocalDate`).
- `NOT NULL` is stated explicitly. Any field without it is nullable.
- An endpoint written as `/api/parts/{id}` is the **public** path the frontend calls through the gateway. An endpoint written as `/internal/...` is reachable only service-to-service and is deliberately not routed by the gateway.
- Money is always `DECIMAL(12,2)`. Never `float`, never `double`, anywhere in the system.

---

## 2. Project Overview — What Is What

### 2.1 The Business Being Modelled

A multi-brand automotive service centre. Customers bring vehicles in — a Honda City, a Maruti Swift, a Hyundai i20 — for periodic servicing, repairs, or specific jobs like a brake replacement. The workshop opens a job card for the vehicle, a technician diagnoses it, parts are pulled from the store and fitted, and the customer is invoiced for parts plus labour. Behind that counter, someone is responsible for making sure the right parts are on the shelf: ordering from suppliers, receiving deliveries, and not tying up money in stock that never moves.

### 2.2 The Problem

A generic inventory system fails this business in three specific ways:

1. **It has no concept of fitment.** A brake pad set is not simply "a part" — it fits certain vehicle models and not others. A system that lets a technician issue a Honda City brake pad against a Maruti Swift job card is not just unhelpful, it produces a real-world defect.
2. **It treats stock as a number to edit rather than a consequence of work.** In a real workshop, stock changes because a part was issued to a job, installed, returned unused, received from a supplier, or written off as damaged. Each of those is an event with a cause. A system where someone simply types a new quantity into a box loses the entire audit trail.
3. **It reorders on a flat threshold.** "Alert when quantity is below 10" ignores that the shop has serviced three times as many Honda Citys this month, that a supplier takes seven days to deliver, and that there are four Honda appointments booked for next week. The purchaser ends up either over-ordering or running dry.

### 2.3 The Solution

A purpose-built system with three defining characteristics:

**Compatibility is enforced, not advisory.** Every part is explicitly mapped to the vehicle models it fits. Issuing a part to a service job triggers a live check against the vehicle's model; an incompatible issue is rejected by the API, not merely warned about in the UI.

**Stock is a ledger, not a field.** Quantity on hand is derived from and reconciled against an append-only transaction log. Every movement records what happened, why, against which job or purchase order, and who did it. Nothing is ever silently overwritten.

**Reordering is calculated and explained.** A dedicated service runs nightly and produces, per part, a recommended order quantity together with a plain-language justification. It derives that number from historical usage, a usage trend factor, the mix of vehicle models the shop actually services, supplier lead time, current stock, quantity already on order, and upcoming booked appointments. The calculation is rule-based and fully auditable — no machine learning, no language model, nothing the team cannot explain line by line.

### 2.4 What Makes This Project Distinctive

Two things, and both are defensible in an interview or a viva:

1. **Domain intelligence** — the reorder engine is real inventory mathematics applied to a real constraint (vehicle fitment and appointment-driven demand), not a CRUD screen with a colour-coded badge.
2. **Architecture** — a genuine microservices decomposition where every service boundary was chosen for a stated reason, including the deliberate decision *not* to split certain things apart (Section 10.5). Being able to explain why `inventory-ops-service` is one service rather than three is worth more than having three services.

### 2.5 System Boundary

**Inside the system:** user authentication and role management; vehicle, customer, part and supplier master data; part-to-vehicle compatibility; stock levels and the movement ledger; the service job lifecycle from intake to invoice; warranty records on fitted parts; purchase orders and goods receipt; scheduled appointments; the reorder recommendation engine; and a dashboard over all of it.

**Outside the system:** payment processing, customer-facing booking portals, SMS or email delivery, accounting-system integration, supplier EDI, native mobile applications, and multi-branch chain management. Section 27.2 states these as deliberate exclusions.

### 2.6 The Ten Functional Modules

| # | Module | Owning Service | Summary |
|---|---|---|---|
| M1 | Authentication & User Management | auth-service | Login, JWT issuance, user accounts, role assignment |
| M2 | Master Data | catalog-service | Vehicle brands, models, customers, vehicles, suppliers |
| M3 | Parts & Compatibility | catalog-service | Parts catalogue, categories, part-to-model fitment mapping |
| M4 | Inventory & Stock Ledger | inventory-ops-service | Quantity per part per location, immutable movement ledger |
| M5 | Service Jobs | inventory-ops-service | Job card lifecycle, parts issued/installed/returned |
| M6 | Warranty Tracking | inventory-ops-service | Warranty period and claim status per fitted part |
| M7 | Purchasing | inventory-ops-service | Purchase orders, goods receipt, rejection handling |
| M8 | Appointments | inventory-ops-service | Upcoming bookings, feeding forward demand |
| M9 | Reorder Intelligence | reorder-service | Nightly calculated recommendations with justification |
| M10 | Dashboard & Analytics | frontend (aggregates) | KPIs, dead stock, fast/slow movers, recommendation feed |

---

## 3. Glossary and Domain Terminology

### 3.1 Domain Terms

| Term | Definition |
|---|---|
| **Service Job / Job Card** | A unit of work on one vehicle, from intake through diagnosis, repair, completion and invoicing. The central workflow object of the system. |
| **Part** | A stock-keeping unit (SKU) held in the store — a brake pad set, an oil filter, a headlamp assembly. |
| **Fitment / Compatibility** | The relationship declaring that a given part fits a given vehicle model. Enforced at the point a part is issued to a job. |
| **Issue** | Moving a part from the store to a job. Decreases stock, creates a ledger entry, does not yet mean the part was fitted. |
| **Install** | Confirming an issued part was actually fitted to the vehicle. Triggers warranty record creation and makes the part billable. |
| **Return** | An issued part that was not used, going back to the store. Increases stock, creates a ledger entry. |
| **Stock Ledger** | The append-only record of every stock movement. The authoritative history; the quantity field is the running result. |
| **Quantity Reserved** | Stock committed to an open job or an inbound expectation, not physically gone but not freely available either. |
| **Purchase Order (PO)** | A commitment to a supplier to buy specified quantities of specified parts. |
| **Goods Receipt** | Recording what physically arrived against a PO — including quantities rejected on inspection. |
| **Lead Time** | Days between placing an order with a supplier and receiving it. A direct input to the reorder calculation. |
| **Safety Stock** | Buffer stock held to absorb demand variability during the lead time window. |
| **Reorder Point** | The stock level at which a new order must be placed to avoid running out before the next delivery arrives. |
| **Vehicle Mix** | The distribution of vehicle models the workshop actually services, used to weight demand for parts that fit popular models. |
| **Dead Stock** | A part with no consumption over an extended period — capital sitting on a shelf. |
| **Fast / Slow Mover** | A part with unusually high or low consumption velocity relative to the catalogue. |

### 3.2 Technical Terms

| Term | Definition |
|---|---|
| **JWT** | JSON Web Token. A signed token carrying the authenticated user's id, name and role, presented on every subsequent request. |
| **DTO** | Data Transfer Object. The shape of data crossing an API boundary, deliberately separate from the internal JPA entity. |
| **Entity** | A JPA-annotated class mapped to a database table. Never returned directly from a controller. |
| **Repository** | A Spring Data JPA interface providing database access for one entity. |
| **RBAC** | Role-Based Access Control. Permissions attach to roles, roles attach to users. |
| **OpenFeign / Feign Client** | A declarative HTTP client. Calling another microservice is written as a Java interface method call. |
| **Eureka** | The service registry. Services register themselves on startup and are discovered by logical name. |
| **API Gateway** | The single public entry point. Validates tokens and routes requests to the correct service. |
| **Circuit Breaker** | A resilience pattern that stops calling a repeatedly-failing dependency for a cooldown period and returns a fallback instead. |
| **Saga** | A pattern for coordinating a transaction spanning multiple services. Deliberately avoided in this system (Section 11.3). |
| **Optimistic Locking** | Concurrency control using a version column; a conflicting concurrent update fails rather than silently overwriting. |
| **Flyway** | Database migration tool. Schema changes are versioned SQL files, applied in order, never hand-run. |
| **Correlation ID** | A unique id generated per incoming request and propagated across all downstream calls, so one user action is traceable through every service log. |
| **SPA** | Single Page Application — the React frontend. |

---

## 4. Stakeholders, Roles and Permission Matrix

### 4.1 System Roles

Four roles. A user has exactly one role. The role is issued as a claim inside the JWT by `auth-service` and is re-checked independently by every service.

| Role | Real-world persona | Primary responsibility |
|---|---|---|
| `ADMIN` | Workshop owner / system administrator | Full access, including creating user accounts and managing master data |
| `INVENTORY_MANAGER` | Store keeper | Parts catalogue, stock levels, stock adjustments, reviewing reorder recommendations |
| `TECHNICIAN` | Mechanic | Service jobs assigned to them; issuing, installing and returning parts on those jobs |
| `PURCHASER` | Procurement staff | Suppliers, purchase orders, goods receipt, acting on reorder recommendations |

### 4.2 Permission Matrix

`C` = Create, `R` = Read, `U` = Update, `D` = Delete, `—` = no access. This matrix is the authoritative source for every `@PreAuthorize` annotation in the codebase.

| Resource | ADMIN | INVENTORY_MANAGER | TECHNICIAN | PURCHASER |
|---|---|---|---|---|
| Users | C R U D | — | — | — |
| Own profile | R | R | R | R |
| Vehicle brands / models | C R U D | R | R | R |
| Customers | C R U D | R | R | — |
| Vehicles | C R U D | R | R | — |
| Part categories | C R U D | C R U | R | R |
| Parts | C R U D | C R U | R | R |
| Part compatibility | C R U D | C R U D | R | R |
| Suppliers | C R U D | R | — | C R U |
| Locations | C R U D | C R U | R | R |
| Inventory (view stock) | R | R | R | R |
| Stock adjustment | C | C | — | — |
| Stock ledger (transactions) | R | R | R | R |
| Service jobs | C R U D | R | C R U (own only) | R |
| Issue / install / return parts | C | — | C (own jobs only) | — |
| Warranties | R U | R | R | — |
| Invoices | C R U | R | R | R |
| Purchase orders | C R U D | R | — | C R U |
| Goods receipt | C | C | — | C |
| Appointments | C R U D | R | R | R |
| Reorder recommendations | R U | R U | — | R U |
| Dashboard | R | R | R | R |

### 4.3 Role Enforcement Rules

- **RBAC-01** — The gateway validates the JWT signature and expiry. It does not make authorisation decisions beyond rejecting invalid tokens.
- **RBAC-02** — Every business service independently enforces the matrix above using `@PreAuthorize` on the controller method. A service must be correctly protected even if it were reachable directly.
- **RBAC-03** — "Own only" restrictions (a technician's own jobs) are enforced in the service layer by comparing the authenticated user id against the resource's owning field, not by role annotation alone.
- **RBAC-04** — A permission violation returns HTTP `403 Forbidden` with the standard error body. It must never return `404` to disguise the resource's existence, and must never silently succeed with a filtered result.

---

# PART B — REQUIREMENTS

## 5. Functional Requirements

Each requirement is atomic and testable. The "Service" column states which service implements it; the "Role" column states who may invoke it.

### 5.1 M1 — Authentication & User Management

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-AUTH-01 | The system shall authenticate a user by email and password and return a signed JWT containing user id, name and role. | auth-service | Public |
| FR-AUTH-02 | The system shall reject authentication with an invalid email or password with HTTP 401 and a generic message that does not reveal which field was wrong. | auth-service | Public |
| FR-AUTH-03 | The system shall allow an ADMIN to create a user account with name, email, password and role. | auth-service | ADMIN |
| FR-AUTH-04 | The system shall reject creation of a user with an email address that already exists, with HTTP 409. | auth-service | ADMIN |
| FR-AUTH-05 | The system shall store passwords only as bcrypt hashes and shall never return a password or hash in any API response. | auth-service | — |
| FR-AUTH-06 | The system shall allow any authenticated user to retrieve their own profile. | auth-service | All |
| FR-AUTH-07 | The system shall allow an ADMIN to deactivate a user, after which that user's authentication attempts fail with HTTP 401. | auth-service | ADMIN |
| FR-AUTH-08 | The system shall expire issued tokens after a configured period (default 8 hours) and reject expired tokens at the gateway with HTTP 401. | api-gateway | — |
| FR-AUTH-09 | The system shall allow an ADMIN to list all users with pagination. | auth-service | ADMIN |
| FR-AUTH-10 | The system shall expose an internal endpoint returning basic user details by id, for other services resolving user references. | auth-service | Internal |

### 5.2 M2 — Master Data

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-CAT-01 | The system shall support create, read, update and delete of vehicle brands. | catalog-service | ADMIN |
| FR-CAT-02 | The system shall support CRUD of vehicle models, each belonging to exactly one brand, with a production year range. | catalog-service | ADMIN |
| FR-CAT-03 | The system shall prevent deletion of a brand that has vehicle models attached, returning HTTP 409. | catalog-service | ADMIN |
| FR-CAT-04 | The system shall support CRUD of customers with name, phone, email and address. | catalog-service | ADMIN |
| FR-CAT-05 | The system shall support CRUD of vehicles, each linked to one customer and one vehicle model. | catalog-service | ADMIN |
| FR-CAT-06 | The system shall enforce uniqueness of vehicle registration number across all vehicles. | catalog-service | — |
| FR-CAT-07 | The system shall support searching vehicles by registration number, returning the vehicle with its customer and model details. | catalog-service | All |
| FR-CAT-08 | The system shall support CRUD of suppliers including an average lead time in days. | catalog-service | ADMIN, PURCHASER |
| FR-CAT-09 | The system shall require supplier average lead time to be between 1 and 365 days. | catalog-service | — |
| FR-CAT-10 | The system shall expose an internal endpoint returning a supplier's lead time and pack size by id, for the reorder engine. | catalog-service | Internal |

### 5.3 M3 — Parts & Compatibility

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-PART-01 | The system shall support CRUD of part categories, optionally nested under a parent category. | catalog-service | ADMIN, INVENTORY_MANAGER |
| FR-PART-02 | The system shall support CRUD of parts with part number, name, category, manufacturer, cost price, unit price, unit of measure, minimum stock level and default supplier. | catalog-service | ADMIN, INVENTORY_MANAGER |
| FR-PART-03 | The system shall enforce uniqueness of part number across the catalogue. | catalog-service | — |
| FR-PART-04 | The system shall reject a part whose unit price is less than its cost price, with a validation error. | catalog-service | — |
| FR-PART-05 | The system shall allow a part to be mapped to many vehicle models, and a vehicle model to be mapped to many parts. | catalog-service | ADMIN, INVENTORY_MANAGER |
| FR-PART-06 | The system shall reject a duplicate compatibility mapping for the same part and model pair. | catalog-service | — |
| FR-PART-07 | The system shall list all vehicle models compatible with a given part. | catalog-service | All |
| FR-PART-08 | The system shall list all parts compatible with a given vehicle model. | catalog-service | All |
| FR-PART-09 | The system shall expose an internal endpoint answering whether a given part is compatible with a given vehicle model, returning a boolean. | catalog-service | Internal |
| FR-PART-10 | The system shall support searching parts by part number or name with pagination. | catalog-service | All |

### 5.4 M4 — Inventory & Stock Ledger

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-INV-01 | The system shall maintain a stock record per part per location holding quantity on hand and quantity reserved. | inventory-ops-service | — |
| FR-INV-02 | The system shall enforce uniqueness of the part and location pair in the stock table. | inventory-ops-service | — |
| FR-INV-03 | The system shall record every stock change as an immutable transaction with type, quantity, reference type, reference id, performing user and timestamp. | inventory-ops-service | — |
| FR-INV-04 | The system shall never allow quantity on hand to become negative; an operation that would do so is rejected with HTTP 409 and a clear message. | inventory-ops-service | — |
| FR-INV-05 | The system shall support a manual stock adjustment with a mandatory reason note, recorded as an `ADJUSTMENT` transaction. | inventory-ops-service | ADMIN, INVENTORY_MANAGER |
| FR-INV-06 | The system shall not permit editing or deleting a stock transaction once created. | inventory-ops-service | — |
| FR-INV-07 | The system shall list stock transactions for a part, filterable by date range and transaction type, with pagination. | inventory-ops-service | All |
| FR-INV-08 | The system shall use optimistic locking on the stock record and return HTTP 409 when a concurrent update conflict occurs. | inventory-ops-service | — |
| FR-INV-09 | The system shall support CRUD of storage locations. | inventory-ops-service | ADMIN, INVENTORY_MANAGER |
| FR-INV-10 | The system shall list current stock across all parts with filters for low stock and zero stock. | inventory-ops-service | All |
| FR-INV-11 | The system shall expose an internal endpoint returning consumption history for a part over a given number of days, for the reorder engine. | inventory-ops-service | Internal |
| FR-INV-12 | The system shall expose an internal endpoint returning current stock and quantity already on order for a part. | inventory-ops-service | Internal |

### 5.5 M5 — Service Jobs

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-JOB-01 | The system shall create a service job for a vehicle with an auto-generated unique job number, an assigned technician and a description. | inventory-ops-service | ADMIN, TECHNICIAN |
| FR-JOB-02 | The system shall validate that the referenced vehicle exists by calling catalog-service, rejecting the creation with HTTP 422 if it does not. | inventory-ops-service | — |
| FR-JOB-03 | The system shall move a job through the states CREATED, DIAGNOSIS, IN_PROGRESS, AWAITING_PARTS, COMPLETED, INVOICED, CLOSED, permitting only the transitions defined in Section 7.3. | inventory-ops-service | ADMIN, TECHNICIAN |
| FR-JOB-04 | The system shall permit a TECHNICIAN to modify only jobs assigned to them. | inventory-ops-service | TECHNICIAN |
| FR-JOB-05 | The system shall issue a part to a job, decrementing stock and creating an `ISSUED_TO_JOB` transaction, in a single atomic database transaction. | inventory-ops-service | ADMIN, TECHNICIAN |
| FR-JOB-06 | The system shall reject issuing a part that is not compatible with the job vehicle's model, determined by a live call to catalog-service, with HTTP 422. | inventory-ops-service | — |
| FR-JOB-07 | The system shall snapshot the part's unit price at the moment of issue, so later catalogue price changes do not alter historical invoices. | inventory-ops-service | — |
| FR-JOB-08 | The system shall record installation of an issued part, with installed quantity not exceeding issued quantity. | inventory-ops-service | ADMIN, TECHNICIAN |
| FR-JOB-09 | The system shall record return of an unused issued part, incrementing stock and creating a `RETURNED_FROM_JOB` transaction atomically. | inventory-ops-service | ADMIN, TECHNICIAN |
| FR-JOB-10 | The system shall enforce that issued quantity equals installed quantity plus returned quantity before a job may be marked COMPLETED. | inventory-ops-service | — |
| FR-JOB-11 | The system shall generate an invoice for a completed job, computing parts subtotal from installed parts at their snapshot prices, plus a labour amount and tax. | inventory-ops-service | ADMIN |
| FR-JOB-12 | The system shall prevent issuing further parts to a job in COMPLETED, INVOICED or CLOSED state, with HTTP 409. | inventory-ops-service | — |
| FR-JOB-13 | The system shall list jobs filterable by status, technician and date range, with pagination. | inventory-ops-service | All |
| FR-JOB-14 | The system shall expose an internal endpoint returning vehicle ids serviced within a date range, for vehicle-mix analysis. | inventory-ops-service | Internal |

### 5.6 M6 — Warranty Tracking

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-WAR-01 | The system shall create a warranty record automatically when a part is marked installed, with a configurable warranty period in days. | inventory-ops-service | — |
| FR-WAR-02 | The system shall compute warranty end date as the installation date plus the warranty period. | inventory-ops-service | — |
| FR-WAR-03 | The system shall allow recording a warranty claim, moving claim status from NONE to CLAIMED. | inventory-ops-service | ADMIN |
| FR-WAR-04 | The system shall allow resolving a claim, moving status from CLAIMED to RESOLVED. | inventory-ops-service | ADMIN |
| FR-WAR-05 | The system shall reject a claim on a warranty whose end date has passed, with HTTP 422. | inventory-ops-service | — |
| FR-WAR-06 | The system shall list warranties expiring within a given number of days. | inventory-ops-service | ADMIN, INVENTORY_MANAGER |
| FR-WAR-07 | The system shall retrieve the full warranty history for a given vehicle. | inventory-ops-service | All |

### 5.7 M7 — Purchasing

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-PO-01 | The system shall create a purchase order for a supplier with an auto-generated unique PO number, an expected delivery date and one or more line items. | inventory-ops-service | ADMIN, PURCHASER |
| FR-PO-02 | The system shall validate that the referenced supplier and every referenced part exist, by calling catalog-service, rejecting with HTTP 422 otherwise. | inventory-ops-service | — |
| FR-PO-03 | The system shall reject a purchase order with no line items or with any line item quantity below 1. | inventory-ops-service | — |
| FR-PO-04 | The system shall move a purchase order through DRAFT, SENT, PARTIALLY_RECEIVED, RECEIVED and CANCELLED, permitting only the transitions defined in Section 7.4. | inventory-ops-service | ADMIN, PURCHASER |
| FR-PO-05 | The system shall record goods receipt per line item, capturing received and rejected quantities. | inventory-ops-service | ADMIN, INVENTORY_MANAGER, PURCHASER |
| FR-PO-06 | The system shall increment stock and create a `PURCHASE_RECEIVED` transaction for received quantities, atomically with the line item update. | inventory-ops-service | — |
| FR-PO-07 | The system shall reject a receipt where received plus rejected quantity exceeds the ordered quantity, with HTTP 422. | inventory-ops-service | — |
| FR-PO-08 | The system shall set purchase order status to RECEIVED when all line items are fully accounted for, and to PARTIALLY_RECEIVED otherwise. | inventory-ops-service | — |
| FR-PO-09 | The system shall prevent cancellation of a purchase order that has any received quantity, with HTTP 409. | inventory-ops-service | — |
| FR-PO-10 | The system shall list purchase orders filterable by supplier, status and date range, with pagination. | inventory-ops-service | All |
| FR-PO-11 | The system shall permit creating a purchase order directly from an acknowledged reorder recommendation, pre-filling part, quantity and supplier. | inventory-ops-service | ADMIN, PURCHASER |

### 5.8 M8 — Appointments

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-APT-01 | The system shall create an appointment for a vehicle with a scheduled date and a service type. | inventory-ops-service | ADMIN |
| FR-APT-02 | The system shall reject an appointment with a scheduled date in the past, with HTTP 422. | inventory-ops-service | — |
| FR-APT-03 | The system shall move an appointment through SCHEDULED, CONFIRMED, CANCELLED and CONVERTED_TO_JOB. | inventory-ops-service | ADMIN |
| FR-APT-04 | The system shall create a service job from an appointment, setting the appointment status to CONVERTED_TO_JOB and carrying over the vehicle. | inventory-ops-service | ADMIN |
| FR-APT-05 | The system shall list appointments filterable by date range and status. | inventory-ops-service | All |
| FR-APT-06 | The system shall expose an internal endpoint returning appointments scheduled within a forward-looking window, for the reorder engine. | inventory-ops-service | Internal |

### 5.9 M9 — Reorder Intelligence

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-REO-01 | The system shall calculate a reorder recommendation for every active part on a nightly schedule. | reorder-service | System |
| FR-REO-02 | The system shall compute average daily usage from consumption transactions over a 90-day window, weighted toward the most recent 30 days. | reorder-service | — |
| FR-REO-03 | The system shall compute a trend factor as recent 30-day average usage divided by the preceding 30-day average usage. | reorder-service | — |
| FR-REO-04 | The system shall compute a vehicle mix weight between 1.0 and 1.2 based on whether the part fits the workshop's most-serviced vehicle models. | reorder-service | — |
| FR-REO-05 | The system shall compute safety stock as `z × standard deviation of daily usage × square root of lead time days`, with z fixed at 1.65. | reorder-service | — |
| FR-REO-06 | The system shall compute the reorder point as `(average daily usage × lead time days) + safety stock`. | reorder-service | — |
| FR-REO-07 | The system shall add expected demand from appointments scheduled within the lead time window. | reorder-service | — |
| FR-REO-08 | The system shall compute the recommended order quantity as `max(0, reorder point + upcoming demand − current stock − quantity on order) × vehicle mix weight`, rounded up to the supplier's pack size. | reorder-service | — |
| FR-REO-09 | The system shall generate a human-readable reason summary from the same computed values, using a string template and no language model. | reorder-service | — |
| FR-REO-10 | The system shall persist each recommendation with all intermediate values so the calculation is auditable after the fact. | reorder-service | — |
| FR-REO-11 | The system shall skip and log any part whose data cannot be retrieved due to a downstream failure, without aborting the remainder of the run. | reorder-service | — |
| FR-REO-12 | The system shall list recommendations filterable by status, sorted by recommended quantity descending. | reorder-service | All except TECHNICIAN |
| FR-REO-13 | The system shall allow a recommendation to be acknowledged, dismissed, or marked as ordered. | reorder-service | ADMIN, INVENTORY_MANAGER, PURCHASER |
| FR-REO-14 | The system shall support triggering a recalculation on demand in addition to the nightly schedule. | reorder-service | ADMIN, INVENTORY_MANAGER |
| FR-REO-15 | The system shall supersede a part's previous PENDING recommendation when a new one is generated for that part. | reorder-service | — |

### 5.10 M10 — Dashboard & Analytics

| ID | Requirement | Service | Role |
|---|---|---|---|
| FR-DSH-01 | The system shall display total stock value, computed as the sum of quantity on hand multiplied by cost price. | frontend | All |
| FR-DSH-02 | The system shall display counts of open jobs by status. | frontend | All |
| FR-DSH-03 | The system shall display the count of parts currently below their minimum stock level. | frontend | All |
| FR-DSH-04 | The system shall display the count of pending reorder recommendations and the top recommendations by quantity. | frontend | All except TECHNICIAN |
| FR-DSH-05 | The system shall identify dead stock as parts with no consumption transaction in a configurable number of days (default 90). | frontend | All |
| FR-DSH-06 | The system shall display the ten fastest-moving and ten slowest-moving parts by consumption over the last 30 days. | frontend | All |
| FR-DSH-07 | The system shall display a chart of parts consumption over time. | frontend | All |
| FR-DSH-08 | The system shall display the distribution of vehicle models serviced over a selected period. | frontend | All |
| FR-DSH-09 | The system shall show each user only the dashboard widgets permitted by their role. | frontend | All |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement | How it is verified |
|---|---|---|---|
| NFR-01 | Security | All passwords stored as bcrypt hashes with a minimum work factor of 10. No password or hash appears in any response or log. | Code review; inspect a user row directly in the database |
| NFR-02 | Security | Every request except login is rejected at the gateway unless it carries a valid, unexpired JWT. | Manual test with an absent, malformed and expired token |
| NFR-03 | Security | Each business service independently enforces role authorisation and does not rely solely on the gateway. | Call a service directly, bypassing the gateway, with a wrong-role token |
| NFR-04 | Security | Internal endpoints under `/internal/**` are not routed by the gateway and are unreachable from outside the service network. | Attempt to reach an internal path through the gateway; expect 404 |
| NFR-05 | Security | CORS is configured once, at the gateway, restricted to the frontend origin. | Cross-origin request from an unlisted origin is blocked |
| NFR-06 | Reliability | Every Feign call is wrapped in a circuit breaker with a defined fallback. A failing dependency degrades the caller, never crashes it. | Stop a container mid-run and observe the fallback path |
| NFR-07 | Reliability | The nightly reorder run completes and persists results for all reachable parts even if some parts fail. | Force a failure for one part and confirm the run continues |
| NFR-08 | Data Integrity | Stock quantity can never be negative under any code path, including concurrent requests. | Concurrency test issuing the same last unit twice |
| NFR-09 | Data Integrity | Stock transactions are append-only. No update or delete path exists in code. | Code review; confirm repository exposes no update/delete for the entity |
| NFR-10 | Data Integrity | Every write that touches two tables and must be consistent occurs inside one `@Transactional` boundary within one service. | Code review of issue-part and receive-PO paths |
| NFR-11 | Performance | Every list endpoint is paginated with a default page size of 20 and a maximum of 100. | Request an oversized page size; expect it to be capped |
| NFR-12 | Performance | Every Feign call has an explicit connect and read timeout (default 3s and 5s). | Configuration review |
| NFR-13 | Performance | The dashboard renders within 3 seconds on a local Docker Compose environment with seed data. | Manual timing with seeded dataset |
| NFR-14 | Observability | A correlation id is generated at the gateway and propagated through every downstream call and log line. | Trace one request end to end through all service logs |
| NFR-15 | Observability | Every stock-changing operation writes a log entry including part, quantity, type, reference and user. | Inspect logs after an issue and a receipt |
| NFR-16 | Maintainability | Each service builds, tests and starts independently without any other service running. | Run `mvn test` per service in isolation |
| NFR-17 | Maintainability | All schema changes are Flyway migration files, versioned and committed. No schema is created by Hibernate `ddl-auto` beyond `validate`. | Configuration review |
| NFR-18 | Portability | The entire system starts with a single `docker-compose up` on any machine with Docker installed, requiring no manual setup steps. | Fresh clone, single command, working system |
| NFR-19 | Usability | Every destructive action in the UI requires an explicit confirmation step. | Manual walkthrough |
| NFR-20 | Usability | Every API error surfaces to the user as a readable message, never a raw stack trace or a bare status code. | Trigger each error class from the UI |
| NFR-21 | Compatibility | The frontend is responsive and usable at tablet width (768px) and above. | Manual test at 768px, 1024px, 1440px |
| NFR-22 | Testability | Reorder calculation logic is unit-testable with fixed inputs and no running dependencies. | Unit test suite runs with all services stopped |

---

## 7. Business Rules

Business rules are constraints that hold regardless of which interface invokes them. They are enforced in the service layer, not in the UI, and each has a corresponding test case.

### 7.1 Stock Rules

| ID | Rule |
|---|---|
| BR-01 | Quantity on hand may never be negative. Any operation that would reduce it below zero is rejected. |
| BR-02 | Quantity available for issue equals quantity on hand minus quantity reserved. |
| BR-03 | Every change to quantity on hand must be accompanied by a stock transaction row created in the same database transaction. |
| BR-04 | Stock transactions are immutable. A mistake is corrected by posting a compensating `ADJUSTMENT` transaction, never by editing history. |
| BR-05 | A manual stock adjustment requires a non-empty reason note. |
| BR-06 | A part may hold stock at multiple locations; each part-location pair is a distinct stock record. |

### 7.2 Compatibility and Issue Rules

| ID | Rule |
|---|---|
| BR-07 | A part may only be issued to a service job if the part is mapped as compatible with the job vehicle's model. |
| BR-08 | Compatibility is checked live at the moment of issue, against catalog-service, not against a cached copy. |
| BR-09 | If the compatibility check cannot be completed because catalog-service is unreachable, the issue is rejected. Fitment is never assumed on failure. |
| BR-10 | The unit price recorded on an issue is the part's price at that moment and is never retroactively updated. |
| BR-11 | Installed quantity may not exceed issued quantity. Returned quantity may not exceed issued quantity minus installed quantity. |

### 7.3 Service Job Lifecycle Rules

| ID | Rule |
|---|---|
| BR-12 | Permitted job status transitions are: CREATED → DIAGNOSIS → IN_PROGRESS → (AWAITING_PARTS ⇄ IN_PROGRESS) → COMPLETED → INVOICED → CLOSED. Any other transition is rejected with HTTP 409. |
| BR-13 | A job may not be marked COMPLETED while any issued part remains neither installed nor returned. |
| BR-14 | Parts may only be issued to a job in DIAGNOSIS, IN_PROGRESS or AWAITING_PARTS status. |
| BR-15 | A job may only be invoiced from COMPLETED status, and only once. |
| BR-16 | A CLOSED job is fully immutable. |
| BR-17 | A technician may only act on jobs where they are the assigned technician. |

### 7.4 Purchasing Rules

| ID | Rule |
|---|---|
| BR-18 | Permitted purchase order transitions are: DRAFT → SENT → (PARTIALLY_RECEIVED) → RECEIVED, with DRAFT → CANCELLED and SENT → CANCELLED also permitted. |
| BR-19 | A purchase order may only be cancelled if no quantity has been received against any line item. |
| BR-20 | Received quantity plus rejected quantity may never exceed the ordered quantity for a line item. |
| BR-21 | Only received quantity increases stock. Rejected quantity is recorded for supplier performance but never enters inventory. |
| BR-22 | A purchase order automatically becomes RECEIVED when every line item has received plus rejected equal to ordered. |
| BR-23 | Line items may not be added to or removed from a purchase order once it has left DRAFT status. |

### 7.5 Warranty Rules

| ID | Rule |
|---|---|
| BR-24 | A warranty record is created only on installation, never on issue. |
| BR-25 | Warranty start date is the installation date; end date is start date plus the warranty period in days. |
| BR-26 | A claim may only be raised while the current date is on or before the warranty end date. |
| BR-27 | Claim status transitions are NONE → CLAIMED → RESOLVED, in that order only. |

### 7.6 Reorder Engine Rules

| ID | Rule |
|---|---|
| BR-28 | Only `ISSUED_TO_JOB` transactions count as consumption for usage calculation. Adjustments, returns and receipts do not. |
| BR-29 | A part with fewer than 30 days of usage history is flagged as insufficient-data and receives a recommendation based on minimum stock level alone, with that stated in its reason summary. |
| BR-30 | The recommended order quantity is never negative; the calculation floors at zero. |
| BR-31 | The recommended quantity is always rounded up to a whole multiple of the supplier's pack size, never down. |
| BR-32 | Vehicle mix weight is bounded to the range 1.0 to 1.2 inclusive, so it can boost demand but never suppress it. |
| BR-33 | Generating a new recommendation for a part supersedes that part's previous PENDING recommendation, which is marked superseded rather than deleted. |
| BR-34 | A recommendation records the inputs used at calculation time. Later changes to stock or lead time do not alter a historical recommendation. |
# PART C — ARCHITECTURE AND DESIGN

## 8. System Architecture

### 8.1 Architectural Style

Microservices, built on Spring Cloud. Six deployable applications: one service registry, one API gateway, and four business services. One React single-page application. One PostgreSQL instance holding four independent schemas.

### 8.2 Why Microservices Here

The decomposition was not chosen because microservices are fashionable. It was chosen because the domain contains three genuinely separate concerns with different rates of change, different data, and different reasons to fail:

- **Identity** changes rarely, is security-critical, and is touched by everything. It should not be redeployed because a parts field was added.
- **Reference data** (vehicles, parts, suppliers) is read constantly and written rarely. It is the natural read-heavy service.
- **Operations** (stock, jobs, purchasing) is write-heavy and transactional.
- **The reorder engine** is a scheduled batch calculation with a completely different load profile from everything else, and it is the piece most likely to be rewritten as the algorithm is tuned. Isolating it means the algorithm can be changed and redeployed without touching the workshop's live operations.

Equally important is what was **not** split. Section 10.5 explains why stock, service jobs and purchasing live together in one service, and why splitting them would have been an architectural mistake rather than an improvement.

### 8.3 Layered View

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTATION                                            │
│  React SPA (Vite + Tailwind) — one base URL              │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTPS, Bearer JWT
┌──────────────────────────▼───────────────────────────────┐
│  EDGE                                                    │
│  api-gateway  :8080                                      │
│  JWT validation · path routing · CORS · correlation id   │
└──────┬──────────┬──────────────┬──────────────┬──────────┘
       │          │              │              │
┌──────▼───┐ ┌────▼─────┐ ┌──────▼────────┐ ┌───▼──────────┐
│  auth-   │ │ catalog- │ │ inventory-ops-│ │  reorder-    │
│  service │ │ service  │ │   service     │ │  service     │
│  :8081   │ │  :8082   │ │    :8083      │ │   :8084      │
└──────┬───┘ └────┬─────┘ └──────┬────────┘ └───┬──────────┘
       │          │◄─────Feign───┤              │
       │          │◄──────────Feign──────────---┤
       │          │              │◄─────Feign───┤
┌──────▼──────────▼──────────────▼──────────────▼──────────┐
│  DATA — PostgreSQL :5432                                 │
│  auth_schema │ catalog_schema │ inventory_ops_schema │   │
│                                        reorder_schema    │
└──────────────────────────────────────────────────────────┘

        discovery-service :8761 (Eureka)
        ▲ all six applications register here on startup
```

### 8.4 Request Path

Every request from the browser follows the same path:

1. React calls the gateway at a single base URL, attaching `Authorization: Bearer <jwt>`.
2. The gateway generates or forwards an `X-Correlation-Id`, validates the token's signature and expiry, and extracts the user id and role.
3. The gateway forwards the request to the target service (resolved by logical name through Eureka), adding `X-User-Id` and `X-User-Role` headers.
4. The service re-checks the role against the permission matrix, executes the business logic, and returns a DTO.
5. If the service needs data owned by another service, it makes a Feign call, wrapped in a circuit breaker, to that service's `/internal/**` endpoint.

### 8.5 Architectural Decisions Register

| ID | Decision | Rationale | Consequence accepted |
|---|---|---|---|
| AD-01 | Microservices over monolith | Independent deployability of the reorder engine; separable concerns; architecture story for the portfolio | More operational complexity; six apps to run |
| AD-02 | Synchronous REST via OpenFeign, not message queues | Two-person team; synchronous is debuggable and adequate at this scale | Caller is coupled to callee availability, mitigated by circuit breakers |
| AD-03 | One PostgreSQL instance, four schemas | Preserves the ownership discipline of database-per-service at a fraction of the operational cost | Single point of failure; documented as RSK-05 |
| AD-04 | Stock + jobs + purchasing in one service | These writes must be atomic together; splitting forces distributed transactions | inventory-ops-service is the largest service |
| AD-05 | No sagas, no eventual consistency | Every multi-table write is contained within one service, so none are needed | Certain future splits would require revisiting this |
| AD-06 | JWT validated at gateway and re-checked per service | Defence in depth; each service is independently secure | Small duplication of authorisation logic |
| AD-07 | Rule-based reorder engine, no ML | Explainable, testable with fixed inputs, defensible in a viva | Will not learn patterns automatically |
| AD-08 | Docker Compose as the environment of record | Deterministic startup; avoids free-tier cold-start cascades during demonstrations | Cloud deployment is optional, not primary |
| AD-09 | Flyway migrations, `ddl-auto: validate` | Schema is reviewable, versioned and reproducible | Every schema change requires writing a migration file |
| AD-10 | DTOs at every boundary, entities never exposed | Prevents accidental leakage of internal fields such as password hashes | More mapping code |

---

## 9. Technology Stack Specification

### 9.1 Frontend

| Concern | Choice | Version guidance | Why |
|---|---|---|---|
| Framework | React | 18.x | Component model, ecosystem, team familiarity |
| Build tool | Vite | 5.x | Fast dev server and builds |
| Styling | Tailwind CSS | 3.x | Utility-first; consistent spacing and colour without writing a design system |
| Routing | React Router | 6.x | Nested routes and route-level role guards |
| Server state | TanStack Query | 5.x | Caching, background refetch, loading and error states without hand-rolled reducers |
| HTTP client | Axios | 1.x | Interceptors for attaching the JWT and handling 401 centrally |
| Charts | Recharts | 2.x | Declarative React charts for the dashboard |
| Forms | React Hook Form | 7.x | Performant forms with validation |
| Icons | Lucide React | latest | Consistent icon set |
| Date handling | date-fns | 3.x | Lightweight, tree-shakeable |

### 9.2 Backend — Per Service

| Concern | Choice | Notes |
|---|---|---|
| Language | Java 17 (LTS) | Records, sealed types, pattern matching available |
| Framework | Spring Boot 3.2.x | Baseline for all six applications |
| Web | Spring Web (MVC) | REST controllers |
| Security | Spring Security 6 | JWT filter chain; `@PreAuthorize` method security |
| Persistence | Spring Data JPA / Hibernate 6 | Repositories per entity |
| Validation | Jakarta Bean Validation | Annotations on request DTOs |
| Migrations | Flyway | `V1__init.sql`, `V2__...` per service |
| JWT library | jjwt (io.jsonwebtoken) 0.12.x | Signing and parsing |
| Password hashing | BCryptPasswordEncoder | Strength 10 |
| Mapping | MapStruct (optional) or manual mappers | Entity ↔ DTO |
| Build | Maven | One `pom.xml` per service; no shared parent required |
| Testing | JUnit 5, Mockito, AssertJ | Unit tests |
| Contract mocking | WireMock | Mocking Feign responses in tests |

### 9.3 Microservices Infrastructure

| Concern | Choice | Where it runs |
|---|---|---|
| Service registry | Spring Cloud Netflix Eureka Server | discovery-service :8761 |
| Service registration | Spring Cloud Netflix Eureka Client | All six applications |
| API gateway | Spring Cloud Gateway (reactive) | api-gateway :8080 |
| Inter-service client | Spring Cloud OpenFeign | catalog callers, reorder-service |
| Resilience | Resilience4j (circuit breaker, timeout, retry) | Wrapped around every Feign client |
| Scheduling | Spring `@Scheduled` | reorder-service nightly job |
| Containerisation | Docker + Docker Compose | Entire system |

Spring Cloud version must be the release train matching Spring Boot 3.2.x — declare it in each `pom.xml` via `spring-cloud-dependencies` in `dependencyManagement`.

### 9.4 Data

| Concern | Choice |
|---|---|
| RDBMS | PostgreSQL 16 |
| Deployment | Single container instance, four logical schemas |
| Connection pooling | HikariCP (Spring Boot default) |
| Migrations | Flyway, per service, isolated by schema |

### 9.5 Tooling

| Concern | Choice |
|---|---|
| Version control | Git, single monorepo |
| API testing | Postman collection committed under `docs/postman/` |
| Container orchestration (local) | Docker Compose |
| CI (optional) | GitHub Actions — `mvn test` per service, `npm run build` for frontend |
| Diagramming | Any; committed as PNG under `docs/diagrams/` |

---

## 10. Service Catalog — What Each Service Does

This section is the reference for "which service do I put this in". If a piece of functionality does not clearly belong to one of these six, that is a signal to re-read the boundaries rather than to invent a seventh service.

---

### 10.1 discovery-service

**One-line purpose:** The phone book. Every service registers here so the others can find it by name instead of by address.

| Attribute | Value |
|---|---|
| Port | 8761 |
| Type | Spring Cloud Netflix Eureka Server |
| Owns data | None — in-memory registry only |
| Database schema | None |
| Depends on | Nothing |
| Depended on by | All five other applications |
| Public endpoints | None (dashboard at `/` for developers) |

**What it actually does.** On startup, every other application sends a registration message announcing its logical name (`AUTH-SERVICE`, `CATALOG-SERVICE`, and so on), its host and its port. Each then sends a heartbeat every 30 seconds. The gateway and every Feign client ask the registry "where is CATALOG-SERVICE right now" rather than holding a hardcoded URL.

**Why it exists.** Without it, every service configuration file would contain the addresses of every other service, and every environment change would mean editing six configuration files. With it, services are addressed by name and the addresses are discovered at runtime.

**What it must never do.** Contain business logic, hold a database, or be called by the frontend.

**Implementation note.** This is the smallest application in the system — one class with `@EnableEurekaServer` and roughly ten lines of configuration. Build it first, in Phase 0, because nothing else can register until it is running.

---

### 10.2 api-gateway

**One-line purpose:** The front door. The only address the browser knows, responsible for proving who the caller is and sending the request to the right service.

| Attribute | Value |
|---|---|
| Port | 8080 |
| Type | Spring Cloud Gateway (reactive) |
| Owns data | None |
| Database schema | None |
| Depends on | discovery-service |
| Depended on by | React frontend exclusively |

**Responsibilities, in order of execution:**

1. **CORS handling** — configured once here, restricted to the frontend origin. No business service configures CORS.
2. **Correlation id** — generates `X-Correlation-Id` if absent, propagates it if present. Every downstream log line carries it.
3. **JWT validation** — verifies signature and expiry on every request except the public login route. Invalid, malformed, expired or missing tokens are rejected with 401 before any service is contacted.
4. **Identity propagation** — extracts user id and role from token claims and adds `X-User-Id` and `X-User-Role` headers for downstream services.
5. **Routing** — matches the path prefix and forwards to the service resolved through Eureka.

**Routing table.** This table is the contract; the frontend depends on these paths and nothing else.

| Path pattern | Target service | Auth required |
|---|---|---|
| `/api/auth/login` | auth-service | No |
| `/api/auth/**` | auth-service | Yes |
| `/api/users/**` | auth-service | Yes |
| `/api/vehicle-brands/**` | catalog-service | Yes |
| `/api/vehicle-models/**` | catalog-service | Yes |
| `/api/customers/**` | catalog-service | Yes |
| `/api/vehicles/**` | catalog-service | Yes |
| `/api/part-categories/**` | catalog-service | Yes |
| `/api/parts/**` | catalog-service | Yes |
| `/api/suppliers/**` | catalog-service | Yes |
| `/api/locations/**` | inventory-ops-service | Yes |
| `/api/inventory/**` | inventory-ops-service | Yes |
| `/api/service-jobs/**` | inventory-ops-service | Yes |
| `/api/warranties/**` | inventory-ops-service | Yes |
| `/api/invoices/**` | inventory-ops-service | Yes |
| `/api/purchase-orders/**` | inventory-ops-service | Yes |
| `/api/appointments/**` | inventory-ops-service | Yes |
| `/api/reorder-recommendations/**` | reorder-service | Yes |
| `/internal/**` | **NOT ROUTED** | — |

**What it must never do.** Contain business logic, transform response bodies, hold a database, or make authorisation decisions beyond rejecting invalid tokens. Authorisation belongs to the services.

**Critical implementation note.** The absence of an `/internal/**` route is a security control, not an omission. Internal endpoints are reachable only from inside the Docker network, service to service.

---

### 10.3 auth-service

**One-line purpose:** Who you are. The only service that knows about passwords and the only service that issues tokens.

| Attribute | Value |
|---|---|
| Port | 8081 |
| Owns data | `users` |
| Database schema | `auth_schema` |
| Depends on | discovery-service only |
| Depended on by | Every service indirectly (via the JWT); other services call `/internal/users/{id}` to resolve names |

**What it actually does.** Holds user accounts. On login, it looks up the user by email, compares the presented password against the stored bcrypt hash, and — on success — signs a JWT containing the user's id, name and role, with an expiry. It also provides account administration for ADMIN users, and an internal lookup so other services can turn a stored `performed_by` id into a display name without duplicating the user table.

**Endpoints owned:** `/api/auth/**`, `/api/users/**`, `/internal/users/**`

**Business rules enforced:** FR-AUTH-01 through FR-AUTH-10, NFR-01.

**What it must never do.** Store any domain data. Return a password hash. Make authorisation decisions on behalf of other services — it states the role in the token; each service decides what that role may do.

**Implementation note.** The JWT signing secret is one shared value read from an environment variable by both auth-service (to sign) and api-gateway (to verify). It must be identical in both and must never be committed.

---

### 10.4 catalog-service

**One-line purpose:** What things are. The single source of truth for every reference entity in the system — vehicles, parts, suppliers, and the fitment mapping between parts and vehicles.

| Attribute | Value |
|---|---|
| Port | 8082 |
| Owns data | `vehicle_brands`, `vehicle_models`, `customers`, `vehicles`, `part_categories`, `parts`, `part_compatibility`, `suppliers` |
| Database schema | `catalog_schema` |
| Depends on | discovery-service only |
| Depended on by | inventory-ops-service, reorder-service (both via Feign) |

**What it actually does.** Provides CRUD over the master data that everything else references, and answers two questions that other services cannot answer for themselves:

- *"Does this part fit this vehicle model?"* — asked by inventory-ops-service before every part issue.
- *"What is this supplier's lead time and pack size?"* — asked by reorder-service during every calculation.

It is deliberately read-heavy and write-light. Master data changes when a new part is stocked or a new model is supported, not during daily operations.

**Endpoints owned:** `/api/vehicle-brands/**`, `/api/vehicle-models/**`, `/api/customers/**`, `/api/vehicles/**`, `/api/part-categories/**`, `/api/parts/**`, `/api/suppliers/**`, and internal endpoints under `/internal/`.

**Business rules enforced:** FR-CAT-01 through FR-CAT-10, FR-PART-01 through FR-PART-10.

**Why it is separate from inventory-ops-service.** A part's *definition* (what it is, what it costs, what it fits) and a part's *stock level* (how many are on the shelf right now) change for entirely different reasons and at entirely different rates. Keeping them together would mean the same service handles both a quiet administrative catalogue and a high-frequency transactional ledger.

**What it must never do.** Track quantities, know about jobs or purchase orders, or hold anything that changes as a consequence of daily workshop activity.

---

### 10.5 inventory-ops-service

**One-line purpose:** What is happening. Everything that moves stock, and every workflow that causes stock to move.

| Attribute | Value |
|---|---|
| Port | 8083 |
| Owns data | `locations`, `inventory`, `inventory_transactions`, `service_jobs`, `job_parts`, `part_warranties`, `invoices`, `purchase_orders`, `purchase_order_items`, `appointments`, `audit_logs` |
| Database schema | `inventory_ops_schema` |
| Depends on | catalog-service (via Feign), discovery-service |
| Depended on by | reorder-service (via Feign) |

**What it actually does.** This is the operational heart of the system, covering four closely-related workflows:

**Stock management.** Maintains quantity on hand and quantity reserved per part per location, and the append-only ledger of every movement. The quantity field and the ledger are always written together.

**Service jobs.** The full job card lifecycle: create a job against a vehicle, move it through diagnosis and repair, issue parts to it, record which were installed and which came back, complete it, and invoice it.

**Purchasing.** Raise purchase orders against suppliers, send them, receive goods against them line by line including rejections, and increment stock accordingly.

**Appointments.** Record forward bookings, which serve two purposes: converting into jobs when the customer arrives, and feeding forward demand into the reorder engine.

**Endpoints owned:** `/api/locations/**`, `/api/inventory/**`, `/api/service-jobs/**`, `/api/warranties/**`, `/api/invoices/**`, `/api/purchase-orders/**`, `/api/appointments/**`, plus internal endpoints.

**Business rules enforced:** FR-INV-*, FR-JOB-*, FR-WAR-*, FR-PO-*, FR-APT-*, and business rules BR-01 through BR-27.

**Why these four are one service — the most important boundary decision in the system.**

Issuing a part to a job must do two things atomically: decrement `inventory.quantity_on_hand` and insert a `job_parts` row plus an `inventory_transactions` row. If either half succeeds without the other, the system is lying about its own stock. Receiving a purchase order has exactly the same shape: increment stock and update `purchase_order_items` together, or not at all.

If stock lived in one service and jobs in another, that single atomic write would become a distributed transaction across two databases. The standard solution is a saga: a coordinator, compensating transactions to undo partial work, idempotency keys, and a window during which the system is knowingly inconsistent. That is a substantial amount of machinery, and every piece of it is a new way for data to be wrong.

Keeping them in one service means those writes are ordinary `@Transactional` methods against one database. The database guarantees atomicity, and no saga machinery exists because none is needed.

This is a deliberate, defensible decision, and it is worth stating plainly in a viva: *the correct number of services is the number where every transaction that must be atomic is contained within one of them.*

**Internally, it is still modular.** The single deployable is organised into four packages — `inventory`, `servicejob`, `purchasing`, `appointment` — each with its own entities, repositories, services and controllers. They share a database and a transaction manager, not a class.

**What it must never do.** Define what a part *is*, hold supplier or customer master data, or read another service's schema. Everything it needs about a part or a supplier comes over Feign.

---

### 10.6 reorder-service

**One-line purpose:** What to buy next. The differentiator — a calculation engine that turns operational history into a defensible purchasing recommendation.

| Attribute | Value |
|---|---|
| Port | 8084 |
| Owns data | `reorder_recommendations` |
| Database schema | `reorder_schema` |
| Depends on | inventory-ops-service and catalog-service (both via Feign, both circuit-broken) |
| Depended on by | The frontend recommendation dashboard only |

**What it actually does.** Every night at 02:00 it runs a scheduled job. For each active part it gathers, over Feign:

- consumption history for the last 90 days (from inventory-ops-service)
- current stock and quantity already on order (from inventory-ops-service)
- appointments scheduled inside the supplier's lead-time window (from inventory-ops-service)
- the vehicle models serviced recently (from inventory-ops-service, resolved through catalog-service)
- the part's supplier lead time and pack size (from catalog-service)

It then executes the eight-step calculation in Section 19 and writes a recommendation row containing not just the final number but every intermediate value — average daily usage, trend factor, safety stock, computed reorder point, vehicle mix weight, upcoming demand — plus a plain-language reason summary. It also serves the recommendation list to the frontend and accepts acknowledgement or dismissal.

**Endpoints owned:** `/api/reorder-recommendations/**`

**Business rules enforced:** FR-REO-01 through FR-REO-15, BR-28 through BR-34.

**Why it is separate.** Three reasons, and all three are genuine:

1. **Different load profile.** It is a batch job that runs once a night and does heavy computation. Everything else is interactive request-response. Co-locating them means a long calculation competes with a technician trying to issue a part.
2. **Different rate of change.** The algorithm will be tuned repeatedly — different windows, different z-scores, different weighting. Each tuning is a deployment. Isolating it means those deployments never risk the workshop's live operations.
3. **It is a pure consumer.** It owns almost no data and writes to nothing but its own table. It reads from everywhere and calculates. That is the cleanest possible service boundary.

**Resilience requirement.** Because it depends on two other services for essentially all of its input, every Feign call is wrapped in a Resilience4j circuit breaker with a fallback that skips the affected part, logs it, and lets the run continue. A downstream outage must degrade the run, not fail it (FR-REO-11, NFR-07).

**What it must never do.** Write to inventory, create purchase orders, or hold a copy of parts or supplier data. It reads, calculates, and recommends. Acting on a recommendation is a human decision, executed through inventory-ops-service.

---

### 10.7 Service Dependency Summary

| Caller | Callee | Mechanism | Purpose | Failure behaviour |
|---|---|---|---|---|
| frontend | api-gateway | REST | All traffic | Error surfaced to user |
| api-gateway | all services | REST via Eureka | Routing | 503 to caller |
| inventory-ops-service | catalog-service | Feign | Validate part-vehicle compatibility before issue | **Reject the issue** (BR-09) |
| inventory-ops-service | catalog-service | Feign | Validate supplier and part exist on PO creation | Reject the PO creation |
| reorder-service | inventory-ops-service | Feign | Usage history, stock, on-order, appointments, serviced vehicles | Skip that part, continue run |
| reorder-service | catalog-service | Feign | Supplier lead time, pack size, part compatibility | Skip that part, continue run |
| any service | auth-service | Feign | Resolve user id to display name | Show the raw id |

Note the deliberate asymmetry: a compatibility check failure **blocks** the operation, because issuing a possibly-wrong part is worse than refusing to issue. A reorder data failure **skips** the part, because a missing recommendation is a minor inconvenience and an aborted nightly run is not.

---

# PART D — DATA DESIGN

## 11. Database Design Principles

### 11.1 Database-per-Service

Each of the four business services owns exactly one schema and accesses no other. There are four schemas in one PostgreSQL instance:

| Service | Schema | Tables |
|---|---|---|
| auth-service | `auth_schema` | 1 |
| catalog-service | `catalog_schema` | 8 |
| inventory-ops-service | `inventory_ops_schema` | 11 |
| reorder-service | `reorder_schema` | 1 |

Each service connects with its own database user, granted privileges only on its own schema. This turns the ownership rule from a convention into something the database enforces: a developer who accidentally writes a cross-schema query gets a permission error rather than a silently-working shortcut that becomes load-bearing.

### 11.2 Cross-Service References

A field such as `service_jobs.vehicle_id` points at a row in `catalog_schema.vehicles`. It is stored as a plain `BIGINT` with **no foreign key constraint**, because a foreign key across service-owned schemas would couple the two services at the database level and defeat the entire boundary.

Referential integrity for these fields is enforced at the application layer: the owning service calls the referencing service over Feign to confirm the id exists before committing the write. Every such field is marked in the schema tables below with **`XREF`** and names the service and table it points to.

This is normal in microservices and should be stated explicitly in the project report so it reads as a deliberate architectural choice rather than a forgotten constraint.

### 11.3 Consistency Model

Within a service: full ACID. Every multi-table write that must be consistent is a single `@Transactional` method against a single schema.

Across services: read-time snapshots. When reorder-service reads current stock, it reads the value at that instant. There is no distributed transaction, no two-phase commit, no saga, and consequently no compensating-transaction logic anywhere in the codebase. This is possible only because of the boundary decision described in Section 10.5.

### 11.4 Conventions

| Convention | Rule |
|---|---|
| Table names | `snake_case`, plural (`service_jobs`, `part_compatibility`) |
| Column names | `snake_case`, singular (`quantity_on_hand`) |
| Primary key | Always `id BIGSERIAL PRIMARY KEY` |
| Foreign key columns | `<referenced_table_singular>_id` (`supplier_id`) |
| Timestamps | `created_at TIMESTAMP NOT NULL DEFAULT NOW()`, `updated_at TIMESTAMP` where mutable |
| Money | `DECIMAL(12,2)` — never `float` or `double` |
| Calculated ratios | `DECIMAL(6,3)` |
| Enums | Stored as `VARCHAR` with a `CHECK` constraint, mapped in Java with `@Enumerated(EnumType.STRING)` — never ordinal |
| Booleans | `BOOLEAN NOT NULL DEFAULT TRUE/FALSE` |
| Soft delete | Not used. Deletion is either permitted or blocked by a business rule |
| Migrations | Flyway, `V<n>__<description>.sql`, per service, never edited once applied |

---

## 12. Complete Database Schema — Tables and Fields

---

### 12.1 auth_schema (auth-service)

#### 12.1.1 `users`

Every person who can log in.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | Surrogate key |
| name | VARCHAR(100) | NOT NULL | Display name shown throughout the UI |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash, strength 10. Never returned by any API |
| role | VARCHAR(30) | NOT NULL, CHECK in enum | ADMIN / INVENTORY_MANAGER / TECHNICIAN / PURCHASER |
| active | BOOLEAN | NOT NULL DEFAULT TRUE | Inactive users cannot authenticate |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | | Last modification time |

**Indexes:** `UNIQUE(email)`; `INDEX(role)` for filtered user lists.

---

### 12.2 catalog_schema (catalog-service)

#### 12.2.1 `vehicle_brands`

Manufacturers whose vehicles the workshop services.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| name | VARCHAR(80) | NOT NULL, UNIQUE | e.g. Honda, Maruti Suzuki, Hyundai |
| country | VARCHAR(60) | | Country of origin, informational |
| active | BOOLEAN | NOT NULL DEFAULT TRUE | Hidden from selection lists when false |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

#### 12.2.2 `vehicle_models`

A specific model produced by a brand, over a production year range.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| brand_id | BIGINT | NOT NULL, FK → vehicle_brands(id) | Owning manufacturer |
| name | VARCHAR(80) | NOT NULL | e.g. City, Swift, i20 |
| year_from | INT | NOT NULL, CHECK ≥ 1950 | First production year |
| year_to | INT | CHECK ≥ year_from | Last production year; NULL if current |
| fuel_type | VARCHAR(20) | CHECK in enum | PETROL / DIESEL / CNG / ELECTRIC / HYBRID |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `UNIQUE(brand_id, name, year_from)`; `INDEX(brand_id)`.

#### 12.2.3 `customers`

Vehicle owners.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| name | VARCHAR(120) | NOT NULL | |
| phone | VARCHAR(20) | NOT NULL | Primary contact |
| email | VARCHAR(150) | | Optional |
| address | TEXT | | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `INDEX(phone)` for lookup at the counter.

#### 12.2.4 `vehicles`

A physical vehicle belonging to a customer.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| customer_id | BIGINT | NOT NULL, FK → customers(id) | Owner |
| model_id | BIGINT | NOT NULL, FK → vehicle_models(id) | Determines part fitment |
| registration_number | VARCHAR(20) | NOT NULL, UNIQUE | Number plate; the workshop's everyday identifier |
| vin | VARCHAR(30) | | Chassis number, optional |
| manufacture_year | INT | CHECK 1950–2100 | |
| odometer_reading | INT | CHECK ≥ 0 | Last recorded reading, in km |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `UNIQUE(registration_number)`; `INDEX(customer_id)`; `INDEX(model_id)`.

#### 12.2.5 `suppliers`

Vendors from whom parts are purchased.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| name | VARCHAR(120) | NOT NULL, UNIQUE | |
| contact_person | VARCHAR(100) | | |
| phone | VARCHAR(20) | NOT NULL | |
| email | VARCHAR(150) | | |
| address | TEXT | | |
| avg_lead_time_days | INT | NOT NULL, CHECK 1–365 | **Direct input to the reorder calculation** |
| default_pack_size | INT | NOT NULL DEFAULT 1, CHECK ≥ 1 | Order quantities round up to a multiple of this |
| active | BOOLEAN | NOT NULL DEFAULT TRUE | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

#### 12.2.6 `part_categories`

Hierarchical classification of parts.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| name | VARCHAR(80) | NOT NULL | e.g. Brakes, Filters, Electricals |
| parent_category_id | BIGINT | FK → part_categories(id) | NULL for a top-level category |
| description | TEXT | | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `UNIQUE(name, parent_category_id)`.

#### 12.2.7 `parts`

The parts catalogue. Defines what a part *is*, not how many exist.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| part_number | VARCHAR(60) | NOT NULL, UNIQUE | SKU; the workshop's identifier |
| name | VARCHAR(150) | NOT NULL | e.g. Brake Pad Set — Front |
| category_id | BIGINT | NOT NULL, FK → part_categories(id) | |
| manufacturer | VARCHAR(100) | | Part maker, distinct from vehicle brand |
| description | TEXT | | |
| cost_price | DECIMAL(12,2) | NOT NULL, CHECK ≥ 0 | Purchase price; used for stock valuation |
| unit_price | DECIMAL(12,2) | NOT NULL, CHECK ≥ cost_price | Selling price (FR-PART-04) |
| unit_of_measure | VARCHAR(20) | NOT NULL | PIECE / LITRE / SET / METRE |
| min_stock_level | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Manual floor; fallback when usage history is thin (BR-29) |
| reorder_point | INT | | Last value calculated by reorder-service, cached for display |
| warranty_period_days | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Default warranty granted when this part is installed |
| default_supplier_id | BIGINT | FK → suppliers(id) | Supplier used for lead time and pack size in the calculation |
| active | BOOLEAN | NOT NULL DEFAULT TRUE | Inactive parts are excluded from the nightly run |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMP | | |

**Indexes:** `UNIQUE(part_number)`; `INDEX(category_id)`; `INDEX(default_supplier_id)`; `INDEX(active)`.

#### 12.2.8 `part_compatibility`

The fitment mapping — the table that makes this system domain-specific rather than generic. Many-to-many between parts and vehicle models.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| part_id | BIGINT | NOT NULL, FK → parts(id) ON DELETE CASCADE | |
| vehicle_model_id | BIGINT | NOT NULL, FK → vehicle_models(id) ON DELETE CASCADE | |
| notes | VARCHAR(255) | | e.g. "Front axle only", "2015 facelift onwards" |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `UNIQUE(part_id, vehicle_model_id)` — enforces FR-PART-06; `INDEX(vehicle_model_id)` — supports "which parts fit this vehicle".

This table is read on **every part issue** through a Feign call, and again by the reorder engine for vehicle-mix weighting. It should be indexed accordingly.

---

### 12.3 inventory_ops_schema (inventory-ops-service)

#### 12.3.1 `locations`

Physical storage areas.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| name | VARCHAR(80) | NOT NULL, UNIQUE | e.g. Main Store, Rack A |
| address | TEXT | | |
| active | BOOLEAN | NOT NULL DEFAULT TRUE | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

#### 12.3.2 `inventory`

Current stock position. One row per part per location.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| part_id | BIGINT | NOT NULL, **XREF** → catalog_schema.parts(id) | No DB FK; validated via Feign |
| location_id | BIGINT | NOT NULL, FK → locations(id) | |
| quantity_on_hand | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | **Never negative** (BR-01) |
| quantity_reserved | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Committed to open jobs or expected receipts |
| version | INT | NOT NULL DEFAULT 0 | Optimistic lock; JPA `@Version` (FR-INV-08) |
| updated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `UNIQUE(part_id, location_id)` — enforces FR-INV-02; `INDEX(part_id)`.

Quantity available for issue is derived, not stored: `quantity_on_hand − quantity_reserved` (BR-02).

#### 12.3.3 `inventory_transactions`

The append-only stock ledger. The authoritative history of every movement.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| part_id | BIGINT | NOT NULL, **XREF** → catalog_schema.parts(id) | |
| location_id | BIGINT | NOT NULL, FK → locations(id) | |
| transaction_type | VARCHAR(30) | NOT NULL, CHECK in enum | See Section 13.3 |
| quantity | INT | NOT NULL, CHECK ≠ 0 | Signed: positive increases stock, negative decreases |
| balance_after | INT | NOT NULL | Running balance after this movement; makes the ledger self-auditing |
| reference_type | VARCHAR(30) | NOT NULL, CHECK in enum | JOB / PURCHASE_ORDER / ADJUSTMENT |
| reference_id | BIGINT | | Id of the job or PO that caused this; NULL for adjustments |
| performed_by | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | Who did it |
| notes | TEXT | | Mandatory for ADJUSTMENT (BR-05) |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `INDEX(part_id, created_at DESC)` — the primary access path, used heavily by the reorder engine; `INDEX(transaction_type)`; `INDEX(reference_type, reference_id)`.

**Critical rule:** no `UPDATE` or `DELETE` path may exist in code for this table (BR-04, NFR-09). The repository interface must not expose one.

#### 12.3.4 `service_jobs`

A job card — the central workflow object.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| job_number | VARCHAR(30) | NOT NULL, UNIQUE | Auto-generated, e.g. `JOB-2026-000147` |
| vehicle_id | BIGINT | NOT NULL, **XREF** → catalog_schema.vehicles(id) | Validated via Feign on creation |
| vehicle_model_id | BIGINT | NOT NULL, **XREF** → catalog_schema.vehicle_models(id) | Denormalised at creation so compatibility checks need one fewer hop |
| assigned_technician_id | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | |
| status | VARCHAR(30) | NOT NULL, CHECK in enum | See Section 13.4 |
| description | TEXT | NOT NULL | Reported complaint / work requested |
| diagnosis_notes | TEXT | | Filled during DIAGNOSIS |
| odometer_reading | INT | CHECK ≥ 0 | Reading at intake |
| labor_charge | DECIMAL(12,2) | NOT NULL DEFAULT 0, CHECK ≥ 0 | Feeds the invoice |
| created_by | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| completed_at | TIMESTAMP | | Set on transition to COMPLETED |
| closed_at | TIMESTAMP | | Set on transition to CLOSED |

**Indexes:** `UNIQUE(job_number)`; `INDEX(status)`; `INDEX(assigned_technician_id)`; `INDEX(vehicle_id)`; `INDEX(created_at DESC)`.

Note `vehicle_model_id` is stored deliberately: without it, every part issue would require two Feign calls (vehicle → model, then compatibility). Capturing the model once at job creation reduces that to one.

#### 12.3.5 `job_parts`

A part issued against a job, and what became of it.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| job_id | BIGINT | NOT NULL, FK → service_jobs(id) ON DELETE CASCADE | |
| part_id | BIGINT | NOT NULL, **XREF** → catalog_schema.parts(id) | |
| location_id | BIGINT | NOT NULL, FK → locations(id) | Where the stock came from |
| quantity_issued | INT | NOT NULL, CHECK ≥ 1 | |
| quantity_installed | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | ≤ quantity_issued (BR-11) |
| quantity_returned | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | installed + returned ≤ issued |
| unit_price_at_issue | DECIMAL(12,2) | NOT NULL, CHECK ≥ 0 | Price snapshot (FR-JOB-07, BR-10) |
| status | VARCHAR(20) | NOT NULL, CHECK in enum | ISSUED / PARTIALLY_INSTALLED / INSTALLED / RETURNED |
| issued_by | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | |
| issued_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| installed_at | TIMESTAMP | | Set when installation is recorded |

**Indexes:** `INDEX(job_id)`; `INDEX(part_id)`.

**Constraint:** `CHECK (quantity_installed + quantity_returned <= quantity_issued)`.

#### 12.3.6 `part_warranties`

Warranty coverage on an installed part.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| job_part_id | BIGINT | NOT NULL, UNIQUE, FK → job_parts(id) | One warranty per installed job part |
| warranty_period_days | INT | NOT NULL, CHECK ≥ 0 | Copied from the part at installation |
| warranty_start_date | DATE | NOT NULL | Installation date |
| warranty_end_date | DATE | NOT NULL | start + period (BR-25) |
| claim_status | VARCHAR(20) | NOT NULL DEFAULT 'NONE', CHECK in enum | NONE / CLAIMED / RESOLVED |
| claim_date | DATE | | |
| claim_notes | TEXT | | |
| resolved_date | DATE | | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `UNIQUE(job_part_id)`; `INDEX(warranty_end_date)` — supports the expiring-soon report; `INDEX(claim_status)`.

#### 12.3.7 `invoices`

The bill for a completed job.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| invoice_number | VARCHAR(30) | NOT NULL, UNIQUE | Auto-generated, e.g. `INV-2026-000098` |
| job_id | BIGINT | NOT NULL, UNIQUE, FK → service_jobs(id) | One invoice per job (BR-15) |
| parts_subtotal | DECIMAL(12,2) | NOT NULL DEFAULT 0 | Sum over installed parts of qty × price at issue |
| labor_subtotal | DECIMAL(12,2) | NOT NULL DEFAULT 0 | From the job's labor_charge |
| tax_rate | DECIMAL(5,2) | NOT NULL DEFAULT 18.00 | Percentage |
| tax_amount | DECIMAL(12,2) | NOT NULL DEFAULT 0 | (parts + labor) × rate ÷ 100 |
| discount_amount | DECIMAL(12,2) | NOT NULL DEFAULT 0, CHECK ≥ 0 | |
| total_amount | DECIMAL(12,2) | NOT NULL | parts + labor + tax − discount |
| status | VARCHAR(20) | NOT NULL DEFAULT 'DRAFT', CHECK in enum | DRAFT / ISSUED / PAID / CANCELLED |
| created_by | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| paid_at | TIMESTAMP | | |

**Indexes:** `UNIQUE(invoice_number)`; `UNIQUE(job_id)`; `INDEX(status)`.

#### 12.3.8 `purchase_orders`

An order placed with a supplier.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| po_number | VARCHAR(30) | NOT NULL, UNIQUE | Auto-generated, e.g. `PO-2026-000031` |
| supplier_id | BIGINT | NOT NULL, **XREF** → catalog_schema.suppliers(id) | Validated via Feign |
| status | VARCHAR(30) | NOT NULL DEFAULT 'DRAFT', CHECK in enum | See Section 13.6 |
| expected_delivery_date | DATE | NOT NULL | |
| actual_delivery_date | DATE | | Set on final receipt |
| total_amount | DECIMAL(12,2) | NOT NULL DEFAULT 0 | Sum of line item ordered qty × unit cost |
| notes | TEXT | | |
| created_by | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |
| sent_at | TIMESTAMP | | Set on transition to SENT |

**Indexes:** `UNIQUE(po_number)`; `INDEX(supplier_id)`; `INDEX(status)`; `INDEX(created_at DESC)`.

#### 12.3.9 `purchase_order_items`

A line on a purchase order.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| po_id | BIGINT | NOT NULL, FK → purchase_orders(id) ON DELETE CASCADE | |
| part_id | BIGINT | NOT NULL, **XREF** → catalog_schema.parts(id) | |
| quantity_ordered | INT | NOT NULL, CHECK ≥ 1 | |
| quantity_received | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Increases stock (BR-21) |
| quantity_rejected | INT | NOT NULL DEFAULT 0, CHECK ≥ 0 | Recorded, never enters stock |
| unit_cost | DECIMAL(12,2) | NOT NULL, CHECK ≥ 0 | Agreed price, may differ from catalogue cost |
| line_total | DECIMAL(12,2) | NOT NULL | quantity_ordered × unit_cost |

**Indexes:** `INDEX(po_id)`; `INDEX(part_id)`.

**Constraint:** `CHECK (quantity_received + quantity_rejected <= quantity_ordered)` — enforces BR-20 at the database level as well as in code.

#### 12.3.10 `appointments`

A forward booking. Feeds demand into the reorder engine.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| vehicle_id | BIGINT | NOT NULL, **XREF** → catalog_schema.vehicles(id) | |
| vehicle_model_id | BIGINT | NOT NULL, **XREF** → catalog_schema.vehicle_models(id) | Denormalised, so the reorder engine can weight demand without a second hop |
| scheduled_date | DATE | NOT NULL | Must be today or later at creation (FR-APT-02) |
| service_type | VARCHAR(60) | NOT NULL | e.g. Periodic Service, Brake Job |
| estimated_duration_hours | DECIMAL(4,1) | CHECK ≥ 0 | Capacity planning, informational |
| status | VARCHAR(30) | NOT NULL DEFAULT 'SCHEDULED', CHECK in enum | See Section 13.8 |
| converted_job_id | BIGINT | FK → service_jobs(id) | Set when converted |
| notes | TEXT | | |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `INDEX(scheduled_date)` — the reorder engine's forward window query; `INDEX(status)`; `INDEX(vehicle_id)`.

#### 12.3.11 `audit_logs`

Generic change trail for sensitive entities.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| entity_type | VARCHAR(60) | NOT NULL | e.g. ServiceJob, PurchaseOrder |
| entity_id | BIGINT | NOT NULL | |
| action | VARCHAR(30) | NOT NULL | CREATE / UPDATE / DELETE / STATUS_CHANGE |
| old_value | TEXT | | JSON snapshot before |
| new_value | TEXT | | JSON snapshot after |
| performed_by | BIGINT | NOT NULL, **XREF** → auth_schema.users(id) | |
| correlation_id | VARCHAR(64) | | Ties this change to a single request chain |
| created_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `INDEX(entity_type, entity_id)`; `INDEX(created_at DESC)`.

---

### 12.4 reorder_schema (reorder-service)

#### 12.4.1 `reorder_recommendations`

One calculated recommendation for one part at one point in time. Every intermediate value is stored so the number can be defended afterwards (FR-REO-10, BR-34).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| part_id | BIGINT | NOT NULL, **XREF** → catalog_schema.parts(id) | |
| part_number | VARCHAR(60) | NOT NULL | Denormalised snapshot for display without a Feign call |
| part_name | VARCHAR(150) | NOT NULL | Denormalised snapshot |
| supplier_id | BIGINT | **XREF** → catalog_schema.suppliers(id) | Supplier used for lead time and pack size |
| supplier_name | VARCHAR(120) | | Denormalised snapshot |
| avg_daily_usage | DECIMAL(10,3) | NOT NULL | Step 1 output |
| usage_std_dev | DECIMAL(10,3) | NOT NULL | Input to safety stock |
| trend_factor | DECIMAL(6,3) | NOT NULL | Step 2 output; 1.30 = usage up 30% |
| vehicle_mix_weight | DECIMAL(6,3) | NOT NULL DEFAULT 1.000 | Step 3 output; bounded 1.000–1.200 (BR-32) |
| lead_time_days | INT | NOT NULL | From supplier |
| safety_stock | INT | NOT NULL | Step 4 output |
| calculated_reorder_point | INT | NOT NULL | Step 5 output |
| upcoming_appointment_demand | INT | NOT NULL DEFAULT 0 | Step 6 output |
| current_stock | INT | NOT NULL | Snapshot at calculation time |
| quantity_on_order | INT | NOT NULL DEFAULT 0 | Open PO quantity at calculation time |
| pack_size | INT | NOT NULL DEFAULT 1 | Rounding unit |
| recommended_order_quantity | INT | NOT NULL, CHECK ≥ 0 | Step 7 output — the number the purchaser sees |
| reason_summary | TEXT | NOT NULL | Step 8 output — plain-language justification |
| data_sufficiency | VARCHAR(20) | NOT NULL DEFAULT 'SUFFICIENT', CHECK in enum | SUFFICIENT / INSUFFICIENT_HISTORY (BR-29) |
| status | VARCHAR(30) | NOT NULL DEFAULT 'PENDING', CHECK in enum | See Section 13.9 |
| acknowledged_by | BIGINT | **XREF** → auth_schema.users(id) | |
| acknowledged_at | TIMESTAMP | | |
| linked_po_id | BIGINT | **XREF** → inventory_ops_schema.purchase_orders(id) | Set when a PO is raised from this recommendation |
| generated_at | TIMESTAMP | NOT NULL DEFAULT NOW() | |

**Indexes:** `INDEX(part_id, generated_at DESC)`; `INDEX(status)`; `INDEX(recommended_order_quantity DESC)` — supports the default sort.

---

## 13. Enumerations Reference

Every enum is stored as `VARCHAR` with a `CHECK` constraint and mapped in Java with `@Enumerated(EnumType.STRING)`. Ordinal mapping is forbidden — reordering an enum constant would silently corrupt existing rows.

### 13.1 `Role`
`ADMIN` · `INVENTORY_MANAGER` · `TECHNICIAN` · `PURCHASER`

### 13.2 `FuelType`
`PETROL` · `DIESEL` · `CNG` · `ELECTRIC` · `HYBRID`

### 13.3 `TransactionType`

| Value | Sign | Meaning |
|---|---|---|
| `PURCHASE_RECEIVED` | + | Goods received against a purchase order |
| `ISSUED_TO_JOB` | − | Part pulled from store to a job. **The only type counted as consumption** (BR-28) |
| `RETURNED_FROM_JOB` | + | Unused issued part returned to store |
| `DAMAGED` | − | Written off as damaged or unusable |
| `ADJUSTMENT` | ± | Manual correction; requires a reason note |

### 13.4 `JobStatus`
`CREATED` · `DIAGNOSIS` · `IN_PROGRESS` · `AWAITING_PARTS` · `COMPLETED` · `INVOICED` · `CLOSED`

Permitted transitions (BR-12):

| From | To |
|---|---|
| CREATED | DIAGNOSIS |
| DIAGNOSIS | IN_PROGRESS |
| IN_PROGRESS | AWAITING_PARTS, COMPLETED |
| AWAITING_PARTS | IN_PROGRESS |
| COMPLETED | INVOICED |
| INVOICED | CLOSED |

### 13.5 `JobPartStatus`
`ISSUED` · `PARTIALLY_INSTALLED` · `INSTALLED` · `RETURNED`

### 13.6 `PurchaseOrderStatus`
`DRAFT` · `SENT` · `PARTIALLY_RECEIVED` · `RECEIVED` · `CANCELLED`

Permitted transitions (BR-18):

| From | To |
|---|---|
| DRAFT | SENT, CANCELLED |
| SENT | PARTIALLY_RECEIVED, RECEIVED, CANCELLED |
| PARTIALLY_RECEIVED | RECEIVED |

### 13.7 `InvoiceStatus`
`DRAFT` · `ISSUED` · `PAID` · `CANCELLED`

### 13.8 `AppointmentStatus`
`SCHEDULED` · `CONFIRMED` · `CANCELLED` · `CONVERTED_TO_JOB`

### 13.9 `RecommendationStatus`
`PENDING` · `ACKNOWLEDGED` · `ORDERED_VIA_PO` · `DISMISSED` · `SUPERSEDED`

### 13.10 `ClaimStatus`
`NONE` · `CLAIMED` · `RESOLVED`

### 13.11 `ReferenceType`
`JOB` · `PURCHASE_ORDER` · `ADJUSTMENT`

### 13.12 `DataSufficiency`
`SUFFICIENT` · `INSUFFICIENT_HISTORY`

---

## 14. Indexes, Constraints and Entity Relationships

### 14.1 Relationships Within catalog_schema

```
vehicle_brands ──1:N──► vehicle_models ──M:N──► parts
                              ▲                   │
                              │                (via part_compatibility)
                        1:N   │                   │
customers ──1:N──► vehicles ──┘                   │
                                                  ▼
                        part_categories ──1:N──► parts ──N:1──► suppliers
                              │
                              └──self-referencing (parent_category_id)
```

### 14.2 Relationships Within inventory_ops_schema

```
locations ──1:N──► inventory
locations ──1:N──► inventory_transactions

service_jobs ──1:N──► job_parts ──1:1──► part_warranties
     │
     └──1:1──► invoices

purchase_orders ──1:N──► purchase_order_items

appointments ──N:1──► service_jobs   (converted_job_id, optional)
```

### 14.3 Cross-Service References

None of these are database foreign keys. Each is a plain `BIGINT` validated by the owning service at write time via Feign (Section 11.2).

| From (table.column) | To (schema.table) | Validated by | When |
|---|---|---|---|
| inventory.part_id | catalog_schema.parts | inventory-ops-service | On first stock record creation |
| inventory_transactions.part_id | catalog_schema.parts | inventory-ops-service | Implicitly, via inventory |
| inventory_transactions.performed_by | auth_schema.users | — | Trusted from JWT |
| service_jobs.vehicle_id | catalog_schema.vehicles | inventory-ops-service | On job creation (FR-JOB-02) |
| service_jobs.vehicle_model_id | catalog_schema.vehicle_models | inventory-ops-service | On job creation |
| service_jobs.assigned_technician_id | auth_schema.users | inventory-ops-service | On job creation |
| job_parts.part_id | catalog_schema.parts | inventory-ops-service | On issue, together with compatibility (FR-JOB-06) |
| purchase_orders.supplier_id | catalog_schema.suppliers | inventory-ops-service | On PO creation (FR-PO-02) |
| purchase_order_items.part_id | catalog_schema.parts | inventory-ops-service | On PO creation |
| appointments.vehicle_id | catalog_schema.vehicles | inventory-ops-service | On appointment creation |
| reorder_recommendations.part_id | catalog_schema.parts | reorder-service | Implicitly, iterating the parts list |
| reorder_recommendations.linked_po_id | inventory_ops_schema.purchase_orders | reorder-service | On PO linkage |

### 14.4 Index Summary

The following indexes exist for a stated performance reason, not by default. Each should be created explicitly in a Flyway migration.

| Table | Index | Reason |
|---|---|---|
| users | UNIQUE(email) | Login lookup |
| vehicles | UNIQUE(registration_number) | Counter lookup by number plate |
| parts | UNIQUE(part_number) | SKU lookup |
| parts | INDEX(active) | Nightly run iterates active parts only |
| part_compatibility | UNIQUE(part_id, vehicle_model_id) | Prevents duplicates; also serves the compatibility check |
| part_compatibility | INDEX(vehicle_model_id) | "Which parts fit this vehicle" |
| inventory | UNIQUE(part_id, location_id) | One stock row per part per location |
| inventory_transactions | INDEX(part_id, created_at DESC) | **Hot path** — the reorder engine's 90-day usage query |
| inventory_transactions | INDEX(reference_type, reference_id) | "Show me the movements for this job" |
| service_jobs | INDEX(status) | Dashboard counts by status |
| service_jobs | INDEX(assigned_technician_id) | Technician's own job list |
| purchase_orders | INDEX(status) | Open PO list; quantity-on-order calculation |
| appointments | INDEX(scheduled_date) | Forward-window query in the reorder engine |
| part_warranties | INDEX(warranty_end_date) | Expiring-soon report |
| reorder_recommendations | INDEX(status) | Pending recommendation feed |

### 14.5 Table Ownership Summary

| Schema | Table count | Tables |
|---|---|---|
| auth_schema | 1 | users |
| catalog_schema | 8 | vehicle_brands, vehicle_models, customers, vehicles, suppliers, part_categories, parts, part_compatibility |
| inventory_ops_schema | 11 | locations, inventory, inventory_transactions, service_jobs, job_parts, part_warranties, invoices, purchase_orders, purchase_order_items, appointments, audit_logs |
| reorder_schema | 1 | reorder_recommendations |
| **Total** | **21** | |
# PART E — INTERFACE DESIGN

## 15. API Design Conventions

These conventions apply to every endpoint in every service. They are stated once here rather than repeated for each endpoint.

### 15.1 Base URL

The frontend uses exactly one base URL: the gateway.

```
Development:  http://localhost:8080
```

The frontend never contains a service hostname or port. If a developer finds themselves typing `:8082` into frontend code, something is wrong.

### 15.2 Authentication Header

Every request except `POST /api/auth/login` carries:

```
Authorization: Bearer <jwt>
```

The gateway adds the following headers before forwarding downstream. Services read these; they do not re-parse the token.

```
X-User-Id:        147
X-User-Role:      TECHNICIAN
X-Correlation-Id: 7f3c9a2e-51b8-4d6a-9e11-2c8b7d4f5a90
```

### 15.3 HTTP Status Code Usage

Status codes carry meaning. Using the wrong one is a defect, not a stylistic choice.

| Code | Used when | Example |
|---|---|---|
| 200 OK | Successful read or update | Fetching a part |
| 201 Created | Resource created; `Location` header set | Creating a service job |
| 204 No Content | Successful delete | Deleting a compatibility mapping |
| 400 Bad Request | Malformed request or failed field validation | Missing required field |
| 401 Unauthorized | Missing, invalid or expired token | Expired JWT |
| 403 Forbidden | Valid token, insufficient role | Technician calling a purchase order endpoint |
| 404 Not Found | Referenced resource does not exist | Unknown part id |
| 409 Conflict | Request violates current state or uniqueness | Duplicate part number; illegal status transition; insufficient stock |
| 422 Unprocessable Entity | Well-formed but semantically invalid against a business rule | Incompatible part for this vehicle |
| 500 Internal Server Error | Unhandled failure. Should never be reachable by a valid request | — |
| 503 Service Unavailable | A required downstream service is unreachable and the operation cannot degrade | Compatibility check fails (BR-09) |

The distinction between 409 and 422 matters: **409** means "the current state of the system forbids this" (retry might work later); **422** means "this request will never be valid" (retry will not help).

### 15.4 Standard Error Response

Every service returns the identical error shape from a `@RestControllerAdvice`. The frontend has exactly one error handler because of this.

```json
{
  "timestamp": "2026-09-10T14:32:11.482",
  "status": 422,
  "error": "Unprocessable Entity",
  "code": "PART_NOT_COMPATIBLE",
  "message": "Part BRK-PAD-001 is not compatible with vehicle model Maruti Swift",
  "path": "/api/service-jobs/147/parts",
  "correlationId": "7f3c9a2e-51b8-4d6a-9e11-2c8b7d4f5a90",
  "fieldErrors": []
}
```

For a field validation failure (400), `fieldErrors` is populated:

```json
{
  "timestamp": "2026-09-10T14:35:02.119",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "path": "/api/parts",
  "correlationId": "9b2e1c4d-...",
  "fieldErrors": [
    { "field": "partNumber", "message": "must not be blank" },
    { "field": "unitPrice", "message": "must be greater than or equal to cost price" }
  ]
}
```

### 15.5 Application Error Codes

The `code` field is a stable machine-readable identifier. The frontend may branch on it; it may never branch on `message` text.

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_FAILED` | 400 | One or more fields failed Bean Validation |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `TOKEN_EXPIRED` | 401 | JWT past expiry |
| `TOKEN_INVALID` | 401 | JWT missing or signature invalid |
| `ACCESS_DENIED` | 403 | Role not permitted for this operation |
| `RESOURCE_NOT_FOUND` | 404 | Referenced id does not exist |
| `DUPLICATE_RESOURCE` | 409 | Uniqueness constraint violated |
| `INSUFFICIENT_STOCK` | 409 | Requested quantity exceeds available |
| `INVALID_STATUS_TRANSITION` | 409 | Not a permitted transition |
| `CONCURRENT_MODIFICATION` | 409 | Optimistic lock conflict |
| `ENTITY_IN_USE` | 409 | Delete blocked by dependent records |
| `PART_NOT_COMPATIBLE` | 422 | Fitment check failed |
| `BUSINESS_RULE_VIOLATION` | 422 | A rule from Section 7 was violated |
| `DOWNSTREAM_UNAVAILABLE` | 503 | A required service could not be reached |

### 15.6 Pagination

Every list endpoint is paginated (NFR-11).

**Request parameters:** `page` (0-based, default 0), `size` (default 20, maximum 100), `sort` (`field,direction`, e.g. `createdAt,desc`).

**Response envelope:**

```json
{
  "content": [ /* array of items */ ],
  "page": 0,
  "size": 20,
  "totalElements": 143,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

### 15.7 Naming and Payload Conventions

| Rule | Detail |
|---|---|
| Paths | Plural nouns, kebab-case: `/api/purchase-orders`, `/api/vehicle-models` |
| JSON fields | `camelCase` — `quantityOnHand`, not `quantity_on_hand` |
| Sub-resources | Nested under parent: `/api/service-jobs/{id}/parts` |
| State changes | POST to a verb sub-path: `/api/service-jobs/{id}/complete` — never PUT with a magic status field |
| Dates | ISO-8601. `LocalDate` as `2026-09-10`; `LocalDateTime` as `2026-09-10T14:32:11` |
| Money | JSON number with two decimals: `1250.00` |
| Nulls | Omitted from responses rather than sent as `null` |
| Booleans | Named affirmatively: `active`, not `notInactive` |
| Ids in responses | Always include both the id and a human-readable label where the id references another entity (`partId` and `partName`) |

### 15.8 Internal Endpoint Convention

Endpoints under `/internal/**` are for service-to-service calls only. They are not routed by the gateway (Section 10.2), are not documented for the frontend, and return lean payloads shaped for their single consumer rather than general-purpose resources.

---

## 16. Complete API Contract Specification

Every endpoint the system exposes. `[R]` marks the roles permitted.

---

### 16.1 auth-service — `/api/auth`, `/api/users`

#### API-AUTH-01 · POST `/api/auth/login`
Authenticate and receive a token. **Public.** Implements FR-AUTH-01, FR-AUTH-02.

**Request**
```json
{
  "email": "ravi@workshop.com",
  "password": "Secret123!"
}
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "user": {
    "id": 3,
    "name": "Ravi Kumar",
    "email": "ravi@workshop.com",
    "role": "TECHNICIAN"
  }
}
```

**Errors:** 401 `INVALID_CREDENTIALS` (wrong email *or* password — the message must not distinguish); 401 `INVALID_CREDENTIALS` if the account is inactive.

---

#### API-AUTH-02 · GET `/api/auth/me`
Return the caller's own profile. `[R: all]` Implements FR-AUTH-06.

**Response 200**
```json
{
  "id": 3,
  "name": "Ravi Kumar",
  "email": "ravi@workshop.com",
  "role": "TECHNICIAN",
  "active": true,
  "createdAt": "2026-01-15T09:20:00"
}
```

---

#### API-AUTH-03 · POST `/api/users`
Create a user account. `[R: ADMIN]` Implements FR-AUTH-03, FR-AUTH-04.

**Request**
```json
{
  "name": "Priya Sharma",
  "email": "priya@workshop.com",
  "password": "Secret123!",
  "role": "PURCHASER"
}
```

**Response 201** — same shape as API-AUTH-02.
**Errors:** 409 `DUPLICATE_RESOURCE` if the email exists; 400 `VALIDATION_FAILED` if the password is shorter than 8 characters.

---

#### API-AUTH-04 · GET `/api/users`
List users. `[R: ADMIN]` Implements FR-AUTH-09.
**Query:** `role`, `active`, `page`, `size`, `sort`. **Response 200:** paginated envelope of user objects.

---

#### API-AUTH-05 · PUT `/api/users/{id}`
Update a user's name or role. `[R: ADMIN]`
**Request:** `{ "name": "Priya Sharma", "role": "INVENTORY_MANAGER" }` **Response 200:** updated user.

---

#### API-AUTH-06 · PATCH `/api/users/{id}/deactivate`
Deactivate an account. `[R: ADMIN]` Implements FR-AUTH-07. **Response 200:** updated user with `active: false`.

---

#### API-AUTH-07 · GET `/internal/users/{id}`
Resolve a user id to a display name. **Internal.** Implements FR-AUTH-10.

**Response 200**
```json
{ "id": 3, "name": "Ravi Kumar", "role": "TECHNICIAN" }
```

---

### 16.2 catalog-service — master data

#### API-CAT-01 · GET `/api/vehicle-brands`
`[R: all]` **Query:** `active`, `page`, `size`. **Response 200:** paginated.
```json
{ "id": 1, "name": "Honda", "country": "Japan", "active": true, "modelCount": 6 }
```

#### API-CAT-02 · POST `/api/vehicle-brands`
`[R: ADMIN]` **Request:** `{ "name": "Honda", "country": "Japan" }` **Response 201.**
**Errors:** 409 `DUPLICATE_RESOURCE`.

#### API-CAT-03 · PUT `/api/vehicle-brands/{id}` · DELETE `/api/vehicle-brands/{id}`
`[R: ADMIN]` Implements FR-CAT-03. Delete returns **204**, or **409 `ENTITY_IN_USE`** if models reference the brand.

---

#### API-CAT-04 · GET `/api/vehicle-models`
`[R: all]` **Query:** `brandId`, `fuelType`, `page`, `size`.
```json
{
  "id": 12, "name": "City", "brandId": 1, "brandName": "Honda",
  "yearFrom": 2014, "yearTo": null, "fuelType": "PETROL"
}
```

#### API-CAT-05 · POST `/api/vehicle-models`
`[R: ADMIN]` Implements FR-CAT-02.
```json
{ "brandId": 1, "name": "City", "yearFrom": 2014, "yearTo": null, "fuelType": "PETROL" }
```
**Errors:** 400 if `yearTo` < `yearFrom`; 404 if `brandId` unknown.

---

#### API-CAT-06 · GET `/api/customers` · POST · PUT · DELETE
`[R: ADMIN for write, all for read]` Implements FR-CAT-04.
```json
{ "id": 55, "name": "Anil Menon", "phone": "9876543210",
  "email": "anil@example.com", "address": "12 MG Road, Kochi", "vehicleCount": 2 }
```

---

#### API-CAT-07 · GET `/api/vehicles`
`[R: all]` **Query:** `customerId`, `modelId`, `registrationNumber`, `page`, `size`. Implements FR-CAT-07.
```json
{
  "id": 88, "registrationNumber": "KL07AB1234", "vin": "MAKGM123456789012",
  "manufactureYear": 2019, "odometerReading": 62400,
  "customerId": 55, "customerName": "Anil Menon",
  "modelId": 12, "modelName": "City", "brandName": "Honda"
}
```

#### API-CAT-08 · POST `/api/vehicles`
`[R: ADMIN]` Implements FR-CAT-05, FR-CAT-06.
```json
{ "customerId": 55, "modelId": 12, "registrationNumber": "KL07AB1234",
  "vin": "MAKGM123456789012", "manufactureYear": 2019, "odometerReading": 62400 }
```
**Errors:** 409 `DUPLICATE_RESOURCE` on registration number.

---

#### API-CAT-09 · GET `/api/suppliers` · POST · PUT · DELETE
`[R: ADMIN, PURCHASER for write; all for read]` Implements FR-CAT-08, FR-CAT-09.
```json
{
  "id": 4, "name": "ABC Auto Parts", "contactPerson": "Suresh N",
  "phone": "9812345678", "email": "sales@abcauto.in",
  "address": "Industrial Estate, Coimbatore",
  "avgLeadTimeDays": 7, "defaultPackSize": 6, "active": true
}
```
**Errors:** 400 if `avgLeadTimeDays` outside 1–365.

---

#### API-CAT-10 · GET `/api/part-categories` · POST · PUT · DELETE
`[R: ADMIN, INVENTORY_MANAGER for write]` Implements FR-PART-01.
```json
{ "id": 2, "name": "Brake Pads", "parentCategoryId": 1,
  "parentCategoryName": "Brakes", "partCount": 24 }
```

---

#### API-CAT-11 · GET `/api/parts`
`[R: all]` **Query:** `search` (matches part number or name), `categoryId`, `supplierId`, `active`, `page`, `size`. Implements FR-PART-10.
```json
{
  "id": 301, "partNumber": "BRK-PAD-001", "name": "Brake Pad Set — Front",
  "categoryId": 2, "categoryName": "Brake Pads", "manufacturer": "Bosch",
  "costPrice": 1450.00, "unitPrice": 1850.00, "unitOfMeasure": "SET",
  "minStockLevel": 8, "reorderPoint": 22, "warrantyPeriodDays": 180,
  "defaultSupplierId": 4, "defaultSupplierName": "ABC Auto Parts",
  "active": true, "compatibleModelCount": 2
}
```

#### API-CAT-12 · POST `/api/parts`
`[R: ADMIN, INVENTORY_MANAGER]` Implements FR-PART-02, FR-PART-03, FR-PART-04.
```json
{
  "partNumber": "BRK-PAD-001", "name": "Brake Pad Set — Front",
  "categoryId": 2, "manufacturer": "Bosch",
  "costPrice": 1450.00, "unitPrice": 1850.00, "unitOfMeasure": "SET",
  "minStockLevel": 8, "warrantyPeriodDays": 180, "defaultSupplierId": 4
}
```
**Errors:** 409 `DUPLICATE_RESOURCE` on part number; 400 `VALIDATION_FAILED` if `unitPrice < costPrice`.

---

#### API-CAT-13 · GET `/api/parts/{id}/compatibility`
List models this part fits. `[R: all]` Implements FR-PART-07.
```json
[
  { "id": 900, "vehicleModelId": 12, "modelName": "City",
    "brandName": "Honda", "notes": "Front axle only" },
  { "id": 901, "vehicleModelId": 15, "modelName": "Amaze",
    "brandName": "Honda", "notes": null }
]
```

#### API-CAT-14 · POST `/api/parts/{id}/compatibility`
`[R: ADMIN, INVENTORY_MANAGER]` Implements FR-PART-05, FR-PART-06.
**Request:** `{ "vehicleModelId": 12, "notes": "Front axle only" }` **Response 201.**
**Errors:** 409 `DUPLICATE_RESOURCE` if the pair already exists.

#### API-CAT-15 · DELETE `/api/parts/{partId}/compatibility/{id}`
`[R: ADMIN, INVENTORY_MANAGER]` **Response 204.**

#### API-CAT-16 · GET `/api/vehicle-models/{id}/parts`
List parts fitting this model. `[R: all]` Implements FR-PART-08. Paginated part objects.

---

#### API-CAT-17 · GET `/internal/parts/{partId}/compatible-with/{vehicleModelId}`
**Internal.** The fitment check called on every part issue. Implements FR-PART-09.
```json
{ "partId": 301, "vehicleModelId": 12, "compatible": true }
```

#### API-CAT-18 · GET `/internal/parts/{id}/supply-info`
**Internal.** Everything the reorder engine needs about a part in one call. Implements FR-CAT-10.
```json
{
  "partId": 301, "partNumber": "BRK-PAD-001", "partName": "Brake Pad Set — Front",
  "minStockLevel": 8, "active": true,
  "supplierId": 4, "supplierName": "ABC Auto Parts",
  "leadTimeDays": 7, "packSize": 6,
  "compatibleModelIds": [12, 15]
}
```

#### API-CAT-19 · GET `/internal/parts/active-ids`
**Internal.** The list the nightly run iterates.
```json
{ "partIds": [301, 302, 303, 310, 415] }
```

#### API-CAT-20 · GET `/internal/vehicles/{id}`
**Internal.** Vehicle existence and model resolution for job creation (FR-JOB-02).
```json
{ "id": 88, "registrationNumber": "KL07AB1234",
  "modelId": 12, "modelName": "City", "brandName": "Honda", "exists": true }
```

---

### 16.3 inventory-ops-service — inventory

#### API-INV-01 · GET `/api/inventory`
Current stock across parts. `[R: all]` Implements FR-INV-10.
**Query:** `partId`, `locationId`, `lowStock` (boolean), `zeroStock` (boolean), `page`, `size`.
```json
{
  "id": 500, "partId": 301, "partNumber": "BRK-PAD-001",
  "partName": "Brake Pad Set — Front",
  "locationId": 1, "locationName": "Main Store",
  "quantityOnHand": 10, "quantityReserved": 2, "quantityAvailable": 8,
  "minStockLevel": 8, "belowMinimum": false,
  "updatedAt": "2026-09-09T16:44:21"
}
```

#### API-INV-02 · POST `/api/inventory/adjust`
Manual stock correction. `[R: ADMIN, INVENTORY_MANAGER]` Implements FR-INV-05, BR-05.
```json
{ "partId": 301, "locationId": 1, "quantityDelta": -2,
  "notes": "Two sets found damaged during stock count on 2026-09-09" }
```
**Response 200**
```json
{ "partId": 301, "locationId": 1,
  "previousQuantity": 12, "newQuantity": 10,
  "transactionId": 7781 }
```
**Errors:** 400 if `notes` blank; 409 `INSUFFICIENT_STOCK` if the result would be negative (BR-01).

#### API-INV-03 · GET `/api/inventory/transactions`
The stock ledger. `[R: all]` Implements FR-INV-07.
**Query:** `partId`, `locationId`, `transactionType`, `referenceType`, `fromDate`, `toDate`, `page`, `size`.
```json
{
  "id": 7781, "partId": 301, "partNumber": "BRK-PAD-001",
  "locationId": 1, "locationName": "Main Store",
  "transactionType": "ISSUED_TO_JOB", "quantity": -2, "balanceAfter": 10,
  "referenceType": "JOB", "referenceId": 147, "referenceLabel": "JOB-2026-000147",
  "performedBy": 3, "performedByName": "Ravi Kumar",
  "notes": null, "createdAt": "2026-09-09T16:44:21"
}
```

#### API-INV-04 · GET `/api/locations` · POST · PUT · DELETE
`[R: ADMIN, INVENTORY_MANAGER for write]` Implements FR-INV-09.
```json
{ "id": 1, "name": "Main Store", "address": "Shop floor, rear", "active": true, "partCount": 187 }
```

#### API-INV-05 · GET `/internal/usage/{partId}`
**Internal.** Consumption history for the reorder engine. Implements FR-INV-11.
**Query:** `days` (default 90).
```json
{
  "partId": 301, "windowDays": 90,
  "totalConsumed": 216,
  "dailyUsage": [
    { "date": "2026-06-12", "quantity": 3 },
    { "date": "2026-06-13", "quantity": 1 }
  ],
  "recent30DayTotal": 84,
  "previous30DayTotal": 64,
  "distinctDaysWithUsage": 71
}
```

#### API-INV-06 · GET `/internal/stock/{partId}`
**Internal.** Stock snapshot for the reorder engine. Implements FR-INV-12.
```json
{ "partId": 301, "currentStock": 10, "quantityReserved": 2, "quantityOnOrder": 0 }
```

---

### 16.4 inventory-ops-service — service jobs

#### API-JOB-01 · POST `/api/service-jobs`
Create a job card. `[R: ADMIN, TECHNICIAN]` Implements FR-JOB-01, FR-JOB-02.
```json
{
  "vehicleId": 88,
  "assignedTechnicianId": 3,
  "description": "Front brakes squealing under light braking",
  "odometerReading": 62400
}
```
**Response 201**
```json
{
  "id": 147, "jobNumber": "JOB-2026-000147",
  "vehicleId": 88, "vehicleRegistration": "KL07AB1234",
  "vehicleModelId": 12, "vehicleModelName": "Honda City",
  "assignedTechnicianId": 3, "assignedTechnicianName": "Ravi Kumar",
  "status": "CREATED",
  "description": "Front brakes squealing under light braking",
  "odometerReading": 62400, "laborCharge": 0.00,
  "createdAt": "2026-09-09T10:12:00", "completedAt": null
}
```
**Errors:** 422 `BUSINESS_RULE_VIOLATION` if the vehicle does not exist in catalog-service; 503 `DOWNSTREAM_UNAVAILABLE` if catalog-service is unreachable.

#### API-JOB-02 · GET `/api/service-jobs`
`[R: all — TECHNICIAN sees only own]` Implements FR-JOB-13, BR-17.
**Query:** `status`, `technicianId`, `vehicleId`, `fromDate`, `toDate`, `page`, `size`.

#### API-JOB-03 · GET `/api/service-jobs/{id}`
Full job detail including issued parts. `[R: all]`
```json
{
  "id": 147, "jobNumber": "JOB-2026-000147",
  "vehicleRegistration": "KL07AB1234", "vehicleModelName": "Honda City",
  "assignedTechnicianName": "Ravi Kumar", "status": "IN_PROGRESS",
  "description": "Front brakes squealing under light braking",
  "diagnosisNotes": "Front pads worn to 2mm. Discs within tolerance.",
  "laborCharge": 800.00,
  "parts": [
    { "id": 990, "partId": 301, "partNumber": "BRK-PAD-001",
      "partName": "Brake Pad Set — Front",
      "quantityIssued": 2, "quantityInstalled": 2, "quantityReturned": 0,
      "unitPriceAtIssue": 1850.00, "lineTotal": 3700.00,
      "status": "INSTALLED", "issuedAt": "2026-09-09T16:44:21" }
  ],
  "partsSubtotal": 3700.00,
  "createdAt": "2026-09-09T10:12:00"
}
```

#### API-JOB-04 · PATCH `/api/service-jobs/{id}/status`
Move the job through its lifecycle. `[R: ADMIN, TECHNICIAN(own)]` Implements FR-JOB-03, BR-12, BR-13.
**Request:** `{ "status": "IN_PROGRESS", "diagnosisNotes": "Front pads worn to 2mm." }`
**Errors:** 409 `INVALID_STATUS_TRANSITION`; 409 `BUSINESS_RULE_VIOLATION` if completing with unreconciled parts (BR-13); 403 if a technician targets another's job.

#### API-JOB-05 · POST `/api/service-jobs/{id}/parts`
**Issue a part to the job.** The single most important write in the system. `[R: ADMIN, TECHNICIAN(own)]` Implements FR-JOB-05, FR-JOB-06, FR-JOB-07, BR-07 through BR-10.
```json
{ "partId": 301, "locationId": 1, "quantity": 2 }
```
**Response 201**
```json
{
  "id": 990, "jobId": 147,
  "partId": 301, "partNumber": "BRK-PAD-001", "partName": "Brake Pad Set — Front",
  "locationId": 1, "quantityIssued": 2,
  "quantityInstalled": 0, "quantityReturned": 0,
  "unitPriceAtIssue": 1850.00, "status": "ISSUED",
  "stockRemaining": 8,
  "issuedAt": "2026-09-09T16:44:21"
}
```
**Errors:**
- 422 `PART_NOT_COMPATIBLE` — the part does not fit this vehicle's model (BR-07)
- 409 `INSUFFICIENT_STOCK` — requested quantity exceeds available
- 409 `INVALID_STATUS_TRANSITION` — the job is COMPLETED, INVOICED or CLOSED (FR-JOB-12, BR-14)
- 409 `CONCURRENT_MODIFICATION` — optimistic lock conflict on the stock row
- 503 `DOWNSTREAM_UNAVAILABLE` — the fitment check could not be completed (BR-09)

**Transaction boundary.** This endpoint performs, inside one `@Transactional` method: decrement `inventory.quantity_on_hand`; insert `job_parts`; insert `inventory_transactions`. All three commit together or none do.

#### API-JOB-06 · PATCH `/api/service-jobs/{jobId}/parts/{id}/install`
Confirm fitment. `[R: ADMIN, TECHNICIAN(own)]` Implements FR-JOB-08, FR-WAR-01.
**Request:** `{ "quantityInstalled": 2 }`
**Response 200** — updated job part, plus the created warranty:
```json
{
  "id": 990, "quantityInstalled": 2, "status": "INSTALLED",
  "installedAt": "2026-09-09T17:05:00",
  "warranty": { "id": 410, "warrantyStartDate": "2026-09-09",
                "warrantyEndDate": "2027-03-08", "claimStatus": "NONE" }
}
```
**Errors:** 422 if `quantityInstalled` exceeds `quantityIssued − quantityReturned` (BR-11).

#### API-JOB-07 · PATCH `/api/service-jobs/{jobId}/parts/{id}/return`
Return an unused part. `[R: ADMIN, TECHNICIAN(own)]` Implements FR-JOB-09.
**Request:** `{ "quantityReturned": 1, "notes": "Second set not required" }`
**Response 200** — updated job part with `stockRestored`. Increments stock and writes a `RETURNED_FROM_JOB` transaction atomically.

#### API-JOB-08 · POST `/api/service-jobs/{id}/invoice`
Generate the invoice. `[R: ADMIN]` Implements FR-JOB-11, BR-15.
**Request:** `{ "laborCharge": 800.00, "taxRate": 18.00, "discountAmount": 0.00 }`
**Response 201**
```json
{
  "id": 98, "invoiceNumber": "INV-2026-000098", "jobId": 147,
  "partsSubtotal": 3700.00, "laborSubtotal": 800.00,
  "taxRate": 18.00, "taxAmount": 810.00,
  "discountAmount": 0.00, "totalAmount": 5310.00,
  "status": "DRAFT", "createdAt": "2026-09-09T17:30:00"
}
```
**Errors:** 409 if the job is not COMPLETED or is already invoiced.

#### API-JOB-09 · GET `/api/invoices` · GET `/api/invoices/{id}` · PATCH `/api/invoices/{id}/status`
`[R: all read; ADMIN write]` Status moves DRAFT → ISSUED → PAID.

#### API-JOB-10 · GET `/internal/serviced-vehicles`
**Internal.** Vehicle-mix input for the reorder engine. Implements FR-JOB-14.
**Query:** `days` (default 90).
```json
{
  "windowDays": 90, "totalJobs": 128,
  "modelCounts": [
    { "vehicleModelId": 12, "jobCount": 34 },
    { "vehicleModelId": 15, "jobCount": 21 },
    { "vehicleModelId": 22, "jobCount": 18 }
  ]
}
```

---

### 16.5 inventory-ops-service — warranties

#### API-WAR-01 · GET `/api/warranties`
`[R: all]` Implements FR-WAR-06.
**Query:** `claimStatus`, `expiringWithinDays`, `vehicleId`, `page`, `size`.
```json
{
  "id": 410, "jobPartId": 990, "jobId": 147, "jobNumber": "JOB-2026-000147",
  "partId": 301, "partName": "Brake Pad Set — Front",
  "vehicleId": 88, "vehicleRegistration": "KL07AB1234",
  "warrantyPeriodDays": 180,
  "warrantyStartDate": "2026-09-09", "warrantyEndDate": "2027-03-08",
  "daysRemaining": 180, "claimStatus": "NONE"
}
```

#### API-WAR-02 · GET `/api/warranties/vehicle/{vehicleId}`
Full warranty history for a vehicle. `[R: all]` Implements FR-WAR-07.

#### API-WAR-03 · POST `/api/warranties/{id}/claim`
`[R: ADMIN]` Implements FR-WAR-03, FR-WAR-05, BR-26.
**Request:** `{ "claimNotes": "Premature wear reported at 4,000 km" }`
**Errors:** 422 `BUSINESS_RULE_VIOLATION` if past the warranty end date; 409 if already claimed.

#### API-WAR-04 · POST `/api/warranties/{id}/resolve`
`[R: ADMIN]` Implements FR-WAR-04, BR-27.
**Request:** `{ "resolutionNotes": "Replaced free of charge under warranty" }`

---

### 16.6 inventory-ops-service — purchasing

#### API-PO-01 · POST `/api/purchase-orders`
`[R: ADMIN, PURCHASER]` Implements FR-PO-01, FR-PO-02, FR-PO-03.
```json
{
  "supplierId": 4,
  "expectedDeliveryDate": "2026-09-17",
  "notes": "Urgent — brake stock low",
  "items": [
    { "partId": 301, "quantityOrdered": 18, "unitCost": 1450.00 },
    { "partId": 305, "quantityOrdered": 12, "unitCost": 620.00 }
  ]
}
```
**Response 201**
```json
{
  "id": 31, "poNumber": "PO-2026-000031",
  "supplierId": 4, "supplierName": "ABC Auto Parts",
  "status": "DRAFT",
  "expectedDeliveryDate": "2026-09-17",
  "totalAmount": 33540.00,
  "createdBy": 5, "createdByName": "Priya Sharma",
  "createdAt": "2026-09-10T09:00:00",
  "items": [
    { "id": 71, "partId": 301, "partNumber": "BRK-PAD-001",
      "partName": "Brake Pad Set — Front",
      "quantityOrdered": 18, "quantityReceived": 0, "quantityRejected": 0,
      "unitCost": 1450.00, "lineTotal": 26100.00 }
  ]
}
```
**Errors:** 422 if supplier or any part does not exist; 400 if `items` is empty or any quantity < 1.

#### API-PO-02 · GET `/api/purchase-orders`
`[R: all]` Implements FR-PO-10. **Query:** `supplierId`, `status`, `fromDate`, `toDate`, `page`, `size`.

#### API-PO-03 · GET `/api/purchase-orders/{id}`
Full PO with line items and receipt progress. `[R: all]`

#### API-PO-04 · PATCH `/api/purchase-orders/{id}/status`
`[R: ADMIN, PURCHASER]` Implements FR-PO-04, FR-PO-09, BR-18, BR-19.
**Request:** `{ "status": "SENT" }`
**Errors:** 409 `INVALID_STATUS_TRANSITION`; 409 if cancelling a PO with received quantity.

#### API-PO-05 · POST `/api/purchase-orders/{id}/receive`
**Goods receipt.** `[R: ADMIN, INVENTORY_MANAGER, PURCHASER]` Implements FR-PO-05 through FR-PO-08, BR-20, BR-21, BR-22.
```json
{
  "locationId": 1,
  "items": [
    { "itemId": 71, "quantityReceived": 18, "quantityRejected": 0 },
    { "itemId": 72, "quantityReceived": 10, "quantityRejected": 2,
      "rejectionReason": "Two units with damaged packaging" }
  ]
}
```
**Response 200**
```json
{
  "poId": 31, "poNumber": "PO-2026-000031",
  "status": "RECEIVED",
  "actualDeliveryDate": "2026-09-16",
  "stockUpdates": [
    { "partId": 301, "quantityAdded": 18, "newStockLevel": 26, "transactionId": 7802 },
    { "partId": 305, "quantityAdded": 10, "newStockLevel": 22, "transactionId": 7803 }
  ]
}
```
**Errors:** 422 if received + rejected exceeds ordered for any line; 409 if the PO is in DRAFT or CANCELLED.

**Transaction boundary.** Per line item, inside one `@Transactional` method: update `purchase_order_items`; increment `inventory`; insert `inventory_transactions`; recompute and set PO status.

#### API-PO-06 · POST `/api/purchase-orders/from-recommendation`
Create a PO pre-filled from a reorder recommendation. `[R: ADMIN, PURCHASER]` Implements FR-PO-11.
```json
{ "recommendationIds": [1201, 1204], "expectedDeliveryDate": "2026-09-18" }
```
Groups recommendations by supplier and returns one PO per supplier.

---

### 16.7 inventory-ops-service — appointments

#### API-APT-01 · POST `/api/appointments`
`[R: ADMIN]` Implements FR-APT-01, FR-APT-02.
```json
{ "vehicleId": 88, "scheduledDate": "2026-09-15",
  "serviceType": "Brake Job", "estimatedDurationHours": 2.5,
  "notes": "Customer reports squealing" }
```
**Errors:** 422 if `scheduledDate` is in the past.

#### API-APT-02 · GET `/api/appointments`
`[R: all]` Implements FR-APT-05. **Query:** `fromDate`, `toDate`, `status`, `vehicleId`, `page`, `size`.
```json
{
  "id": 620, "vehicleId": 88, "vehicleRegistration": "KL07AB1234",
  "vehicleModelId": 12, "vehicleModelName": "Honda City",
  "customerName": "Anil Menon",
  "scheduledDate": "2026-09-15", "serviceType": "Brake Job",
  "estimatedDurationHours": 2.5, "status": "CONFIRMED", "convertedJobId": null
}
```

#### API-APT-03 · PATCH `/api/appointments/{id}/status`
`[R: ADMIN]` Implements FR-APT-03.

#### API-APT-04 · POST `/api/appointments/{id}/convert`
Turn an appointment into a job. `[R: ADMIN]` Implements FR-APT-04.
**Request:** `{ "assignedTechnicianId": 3, "odometerReading": 62400 }`
**Response 201** — the created service job. Sets the appointment to CONVERTED_TO_JOB and records `convertedJobId`.

#### API-APT-05 · GET `/internal/appointments/upcoming`
**Internal.** Forward demand window for the reorder engine. Implements FR-APT-06.
**Query:** `days` (default 7).
```json
{
  "windowDays": 7, "totalAppointments": 9,
  "appointments": [
    { "id": 620, "vehicleModelId": 12, "serviceType": "Brake Job",
      "scheduledDate": "2026-09-15" },
    { "id": 621, "vehicleModelId": 15, "serviceType": "Periodic Service",
      "scheduledDate": "2026-09-16" }
  ]
}
```

---

### 16.8 reorder-service

#### API-REO-01 · GET `/api/reorder-recommendations`
The purchaser's work queue. `[R: ADMIN, INVENTORY_MANAGER, PURCHASER]` Implements FR-REO-12.
**Query:** `status` (default PENDING), `supplierId`, `minQuantity`, `page`, `size`, `sort` (default `recommendedOrderQuantity,desc`).

```json
{
  "id": 1201,
  "partId": 301, "partNumber": "BRK-PAD-001", "partName": "Brake Pad Set — Front",
  "supplierId": 4, "supplierName": "ABC Auto Parts",
  "avgDailyUsage": 2.400, "usageStdDev": 1.100, "trendFactor": 1.320,
  "vehicleMixWeight": 1.150, "leadTimeDays": 7,
  "safetyStock": 5, "calculatedReorderPoint": 22,
  "upcomingAppointmentDemand": 3,
  "currentStock": 10, "quantityOnOrder": 0, "packSize": 6,
  "recommendedOrderQuantity": 18,
  "reasonSummary": "Usage trending up 32% over 30 days; 3 upcoming Honda City/Amaze appointments in the next 7-day lead time; current stock covers 10 of the 22-unit reorder point; ordering in packs of 6 from ABC Auto Parts.",
  "dataSufficiency": "SUFFICIENT",
  "status": "PENDING",
  "generatedAt": "2026-09-10T02:00:14"
}
```

#### API-REO-02 · GET `/api/reorder-recommendations/{id}`
Single recommendation with the full calculation breakdown. `[R: as above]`
Adds a `calculationSteps` array so the UI can show the working:
```json
{
  "calculationSteps": [
    { "step": 1, "name": "Average daily usage",
      "formula": "weighted 90-day moving average", "value": "2.400 units/day" },
    { "step": 2, "name": "Trend factor",
      "formula": "recent 30d avg / previous 30d avg", "value": "1.320" },
    { "step": 3, "name": "Vehicle mix weight",
      "formula": "top-serviced model boost", "value": "1.150" },
    { "step": 4, "name": "Safety stock",
      "formula": "1.65 x 1.100 x sqrt(7)", "value": "5" },
    { "step": 5, "name": "Reorder point",
      "formula": "(2.400 x 7) + 5", "value": "22" },
    { "step": 6, "name": "Upcoming demand",
      "formula": "3 appointments in 7-day window", "value": "3" },
    { "step": 7, "name": "Recommended quantity",
      "formula": "max(0, 22 + 3 - 10 - 0) x 1.150, rounded up to pack of 6",
      "value": "18" }
  ]
}
```

#### API-REO-03 · POST `/api/reorder-recommendations/{id}/acknowledge`
`[R: ADMIN, INVENTORY_MANAGER, PURCHASER]` Implements FR-REO-13.
**Request:** `{ "notes": "Will include in this week's ABC order" }` Moves status PENDING → ACKNOWLEDGED.

#### API-REO-04 · POST `/api/reorder-recommendations/{id}/dismiss`
`[R: as above]` **Request:** `{ "reason": "Part being discontinued next quarter" }` Moves status to DISMISSED.

#### API-REO-05 · POST `/api/reorder-recommendations/recalculate`
Trigger the calculation on demand. `[R: ADMIN, INVENTORY_MANAGER]` Implements FR-REO-14.
**Request:** `{ "partIds": [301, 305] }` — omit `partIds` to recalculate everything.
**Response 202 Accepted**
```json
{
  "runId": "run-2026-09-10-1442",
  "partsQueued": 2,
  "message": "Recalculation started. Results available shortly."
}
```

#### API-REO-06 · GET `/api/reorder-recommendations/summary`
Dashboard tile data. `[R: as above]`
```json
{
  "pendingCount": 14,
  "totalRecommendedValue": 187400.00,
  "partsWithInsufficientHistory": 3,
  "lastRunAt": "2026-09-10T02:00:14",
  "lastRunStatus": "COMPLETED",
  "lastRunPartsProcessed": 187,
  "lastRunPartsSkipped": 2
}
```

---

## 17. Inter-Service Communication Contracts

### 17.1 Feign Client Inventory

| Client interface | Lives in | Calls | Endpoints used |
|---|---|---|---|
| `CatalogClient` | inventory-ops-service | catalog-service | API-CAT-17, API-CAT-18, API-CAT-20, supplier lookup |
| `InventoryOpsClient` | reorder-service | inventory-ops-service | API-INV-05, API-INV-06, API-JOB-10, API-APT-05 |
| `CatalogClient` | reorder-service | catalog-service | API-CAT-18, API-CAT-19 |
| `AuthClient` | inventory-ops-service | auth-service | API-AUTH-07 |

### 17.2 Declaration Pattern

```java
@FeignClient(
    name = "catalog-service",
    fallback = CatalogClientFallback.class
)
public interface CatalogClient {

    @GetMapping("/internal/parts/{partId}/compatible-with/{vehicleModelId}")
    CompatibilityResponse checkCompatibility(
        @PathVariable Long partId,
        @PathVariable Long vehicleModelId);

    @GetMapping("/internal/parts/{id}/supply-info")
    PartSupplyInfoResponse getSupplyInfo(@PathVariable Long id);
}
```

The `name` is the logical Eureka service name. No host, no port, ever.

### 17.3 Resilience Configuration

Every Feign client is wrapped with Resilience4j:

| Setting | Value | Reason |
|---|---|---|
| Connect timeout | 3 seconds | Fail fast on an unreachable service |
| Read timeout | 5 seconds | Bound the wait on a slow response |
| Circuit breaker failure threshold | 50% | Open after half of recent calls fail |
| Sliding window size | 10 calls | Small enough to react quickly |
| Wait duration in open state | 30 seconds | Cooldown before probing again |
| Retry attempts | 2 (idempotent GETs only) | Absorb a transient blip; never retry a write |

### 17.4 Fallback Behaviour Per Call

This table encodes the asymmetry described in Section 10.7. It is a design decision, not a default.

| Call | On failure | Rationale |
|---|---|---|
| Compatibility check before issue | **Fail the request** — 503 `DOWNSTREAM_UNAVAILABLE` | Issuing a possibly-incompatible part is worse than refusing to issue (BR-09) |
| Vehicle existence on job creation | **Fail the request** — 503 | Creating a job against a non-existent vehicle corrupts data |
| Supplier/part existence on PO creation | **Fail the request** — 503 | Same reason |
| Usage history for reorder | **Skip this part**, log, continue the run | A missing recommendation is recoverable; an aborted run is not (FR-REO-11) |
| Stock snapshot for reorder | **Skip this part**, log, continue | Same |
| Appointments for reorder | **Use zero upcoming demand**, note it in the reason summary | Partial data still yields a useful recommendation |
| User name resolution | **Return the raw id** | Cosmetic only; must never block a business operation |

### 17.5 Correlation ID Propagation

The gateway generates `X-Correlation-Id` if absent. A `RequestInterceptor` on every Feign client copies it onto outgoing calls, and a logging filter puts it into the MDC so it appears on every log line in every service (NFR-14).

```java
@Bean
public RequestInterceptor correlationIdInterceptor() {
    return template -> {
        String correlationId = MDC.get("correlationId");
        if (correlationId != null) {
            template.header("X-Correlation-Id", correlationId);
        }
    };
}
```

Tracing one part issue end to end should show the same correlation id in the gateway log, the inventory-ops-service log, and the catalog-service log.

---

# PART F — BEHAVIOURAL DESIGN

## 18. Use Cases and Sequence Flows

Each use case states the actor, preconditions, the ordered steps across services, the postconditions, and the alternate paths. These are the flows to demonstrate in a viva.

---

### UC-01 — User Login

**Actor:** Any user · **Precondition:** An active account exists · **Requirements:** FR-AUTH-01, FR-AUTH-02

```
Browser              api-gateway          auth-service        auth_schema
   │                     │                     │                   │
   │ POST /api/auth/login│                     │                   │
   ├────────────────────►│                     │                   │
   │                     │ (public route —     │                   │
   │                     │  no JWT check)      │                   │
   │                     ├────────────────────►│                   │
   │                     │                     │ SELECT by email   │
   │                     │                     ├──────────────────►│
   │                     │                     │◄──────────────────┤
   │                     │                     │ bcrypt.matches()  │
   │                     │                     │ sign JWT          │
   │                     │◄────────────────────┤ 200 + token       │
   │◄────────────────────┤                     │                   │
   │ store token         │                     │                   │
```

**Postcondition:** The client holds a JWT valid for 8 hours and attaches it to every subsequent request.
**Alternate A1:** Email not found or password mismatch → 401 `INVALID_CREDENTIALS`, identical message either way.
**Alternate A2:** Account inactive → 401 `INVALID_CREDENTIALS`.

---

### UC-02 — Create a Service Job

**Actor:** ADMIN or TECHNICIAN · **Precondition:** The vehicle exists in catalog-service · **Requirements:** FR-JOB-01, FR-JOB-02

```
Browser        api-gateway     inventory-ops-service    catalog-service
   │                │                    │                     │
   │ POST /api/service-jobs              │                     │
   ├───────────────►│                    │                     │
   │                │ validate JWT       │                     │
   │                │ + X-User-Id/Role   │                     │
   │                ├───────────────────►│                     │
   │                │                    │ @PreAuthorize check │
   │                │                    │                     │
   │                │                    │ Feign GET           │
   │                │                    │ /internal/vehicles/88
   │                │                    ├────────────────────►│
   │                │                    │◄────────────────────┤
   │                │                    │ {exists, modelId}   │
   │                │                    │                     │
   │                │                    │ generate job number │
   │                │                    │ INSERT service_jobs │
   │                │◄───────────────────┤ 201 + job           │
   │◄───────────────┤                    │                     │
```

**Postcondition:** A job exists in CREATED status, carrying both `vehicle_id` and the denormalised `vehicle_model_id`.
**Alternate A1:** Vehicle not found → 422 `BUSINESS_RULE_VIOLATION`, nothing written.
**Alternate A2:** catalog-service unreachable → 503 `DOWNSTREAM_UNAVAILABLE`, nothing written.

---

### UC-03 — Issue a Part to a Job (the critical flow)

**Actor:** TECHNICIAN (own job) or ADMIN · **Preconditions:** Job in DIAGNOSIS, IN_PROGRESS or AWAITING_PARTS; stock available · **Requirements:** FR-JOB-05, FR-JOB-06, FR-JOB-07 · **Rules:** BR-01, BR-07 through BR-10, BR-14

```
Browser     api-gateway   inventory-ops-service   catalog-service   inv_ops_schema
   │             │                 │                    │                │
   │ POST /api/service-jobs/147/parts                   │                │
   ├────────────►│                 │                    │                │
   │             ├────────────────►│                    │                │
   │             │                 │ 1. load job,       │                │
   │             │                 │    check status    │                │
   │             │                 │    (BR-14)         │                │
   │             │                 │ 2. check technician│                │
   │             │                 │    owns job (BR-17)│                │
   │             │                 │                    │                │
   │             │                 │ 3. Feign: compatible?               │
   │             │                 ├───────────────────►│                │
   │             │                 │◄───────────────────┤                │
   │             │                 │   {compatible:true}│                │
   │             │                 │                    │                │
   │             │                 │ ┌── @Transactional ─────────────┐   │
   │             │                 │ │ 4. SELECT inventory FOR UPDATE│──►│
   │             │                 │ │ 5. check available >= qty     │   │
   │             │                 │ │ 6. UPDATE quantity_on_hand    │──►│
   │             │                 │ │ 7. INSERT job_parts           │──►│
   │             │                 │ │ 8. INSERT inventory_transactions─►│
   │             │                 │ └── COMMIT ────────────────────┘   │
   │             │◄────────────────┤ 201 + jobPart                       │
   │◄────────────┤                 │                    │                │
```

**Postcondition:** Stock decremented, a `job_parts` row created with the price snapshot, and one `ISSUED_TO_JOB` ledger row written — all three or none.

**Alternate A1** — Incompatible part → 422 `PART_NOT_COMPATIBLE`. No transaction opened.
**Alternate A2** — Insufficient stock → 409 `INSUFFICIENT_STOCK`. Transaction rolled back.
**Alternate A3** — Job in COMPLETED/INVOICED/CLOSED → 409 `INVALID_STATUS_TRANSITION`.
**Alternate A4** — catalog-service unreachable → 503. Fitment is never assumed (BR-09).
**Alternate A5** — Two technicians issue the last unit concurrently → the second fails with 409 `CONCURRENT_MODIFICATION` via the `@Version` column. Stock cannot go negative under any interleaving.

---

### UC-04 — Complete and Invoice a Job

**Actor:** TECHNICIAN then ADMIN · **Requirements:** FR-JOB-08, FR-JOB-10, FR-JOB-11, FR-WAR-01 · **Rules:** BR-13, BR-15

1. Technician records installation per issued part (API-JOB-06). Each installation creates a `part_warranties` row with start = today and end = today + the part's warranty period.
2. Technician returns any unused parts (API-JOB-07). Stock is incremented and a `RETURNED_FROM_JOB` ledger row is written.
3. Technician sets status to COMPLETED (API-JOB-04). The service verifies for every job part that `quantity_installed + quantity_returned = quantity_issued`. If any part is unreconciled, the transition is rejected with 409 (BR-13).
4. Admin generates the invoice (API-JOB-08). Parts subtotal is computed from installed quantities at their **issue-time** prices, never current catalogue prices (BR-10). Labour and tax are added; the job moves to INVOICED.
5. Admin marks the invoice PAID; the job moves to CLOSED and becomes immutable (BR-16).

---

### UC-05 — Raise and Receive a Purchase Order

**Actor:** PURCHASER, then INVENTORY_MANAGER · **Requirements:** FR-PO-01 through FR-PO-08 · **Rules:** BR-18 through BR-22

```
Purchaser   inventory-ops-service   catalog-service   inv_ops_schema
    │               │                     │                │
    │ POST /api/purchase-orders           │                │
    ├──────────────►│                     │                │
    │               │ Feign: supplier exists?              │
    │               ├────────────────────►│                │
    │               │ Feign: each part exists?             │
    │               ├────────────────────►│                │
    │               │◄────────────────────┤                │
    │               │ INSERT po + items   │                │
    │               ├─────────────────────┼───────────────►│
    │◄──────────────┤ 201 DRAFT           │                │
    │ PATCH status → SENT                 │                │
    ├──────────────►│                     │                │
    │               │                     │                │
    ═══ goods physically arrive, days later ═══
    │               │                     │                │
    │ POST /api/purchase-orders/31/receive │               │
    ├──────────────►│                     │                │
    │               │ ┌─ @Transactional, per line item ─┐  │
    │               │ │ validate recv+rej <= ordered    │  │
    │               │ │ UPDATE purchase_order_items     │─►│
    │               │ │ UPDATE inventory (+received)    │─►│
    │               │ │ INSERT inventory_transactions   │─►│
    │               │ │ recompute PO status             │─►│
    │               │ └─ COMMIT ───────────────────────┘   │
    │◄──────────────┤ 200 + stockUpdates                   │
```

**Postcondition:** Stock increased by received quantities only. Rejected quantities are recorded against the line item for supplier performance but never enter inventory (BR-21). PO status becomes RECEIVED if every line is fully accounted for, PARTIALLY_RECEIVED otherwise (BR-22).

**Alternate A1** — Received + rejected exceeds ordered → 422, whole receipt rolled back.
**Alternate A2** — Cancelling a PO with any received quantity → 409 (BR-19).

---

### UC-06 — Nightly Reorder Calculation (the differentiator)

**Actor:** System scheduler, 02:00 daily · **Requirements:** FR-REO-01 through FR-REO-11

```
@Scheduled          reorder-service    inventory-ops-service   catalog-service
    │                     │                     │                    │
    │ 02:00 trigger       │                     │                    │
    ├────────────────────►│                     │                    │
    │                     │ Feign: active part ids ──────────────────►│
    │                     │◄──────────────────────────────────────────┤
    │                     │ [301, 302, 303, ...]                      │
    │                     │                     │                    │
    │              ┌──────┴─── for each part ───────────────────┐    │
    │              │      │                     │               │    │
    │              │ Feign: usage 90d           │               │    │
    │              ├─────────────────────────────►               │    │
    │              │ Feign: stock + on-order    │               │    │
    │              ├─────────────────────────────►               │    │
    │              │ Feign: upcoming appts (lead-time window)    │    │
    │              ├─────────────────────────────►               │    │
    │              │ Feign: serviced vehicle mix │               │    │
    │              ├─────────────────────────────►               │    │
    │              │ Feign: supply info (lead time, pack size) ──────►│
    │              │◄────────────────────────────────────────────────┤
    │              │      │                     │               │    │
    │              │ ── run 8-step calculation (Section 19) ──   │    │
    │              │ ── mark prior PENDING as SUPERSEDED ──      │    │
    │              │ ── INSERT reorder_recommendations ──        │    │
    │              └──────┬──────────────────────────────────────┘   │
    │                     │ log run summary                          │
```

**Postcondition:** Every reachable active part has a fresh PENDING recommendation; the previous one is SUPERSEDED, not deleted (BR-33).

**Alternate A1** — A Feign call fails for one part: the circuit breaker fallback logs it, that part is skipped, and the loop continues (FR-REO-11, NFR-07).
**Alternate A2** — A part has fewer than 30 days of history: it is marked `INSUFFICIENT_HISTORY` and receives a recommendation based on `min_stock_level` alone, stated in the reason summary (BR-29).
**Alternate A3** — The appointments call fails but others succeed: upcoming demand is treated as zero and the reason summary says so.

**This is the flow to demonstrate live.** Stop the catalog-service container mid-run and show the circuit breaker opening, the affected parts being skipped with a logged reason, and the run completing successfully for the rest.

---

### UC-07 — Act on a Recommendation

**Actor:** PURCHASER · **Requirements:** FR-REO-13, FR-PO-11

1. Purchaser opens the recommendations screen, sorted by recommended quantity descending.
2. They open a recommendation and read the calculation breakdown (API-REO-02) — every intermediate value is shown, so the number can be questioned and defended.
3. They acknowledge it (API-REO-03), or dismiss it with a reason (API-REO-04).
4. From one or more acknowledged recommendations they create a purchase order (API-PO-06). Recommendations are grouped by supplier; one PO is produced per supplier, pre-filled with part and quantity.
5. The recommendation status becomes ORDERED_VIA_PO and `linked_po_id` is set, closing the loop between the recommendation and the action taken on it.

---

### UC-08 — Warranty Claim

**Actor:** ADMIN · **Requirements:** FR-WAR-03, FR-WAR-05 · **Rules:** BR-26, BR-27

1. Customer returns with a complaint about a previously fitted part.
2. Admin looks up the vehicle's warranty history (API-WAR-02).
3. Admin raises a claim (API-WAR-03). The service checks the current date against `warranty_end_date`; a claim past expiry is rejected with 422 (BR-26).
4. Status moves NONE → CLAIMED.
5. After the replacement is handled, the admin resolves the claim (API-WAR-04); status moves CLAIMED → RESOLVED. No other transition is permitted (BR-27).

---

### UC-09 — Manual Stock Adjustment

**Actor:** INVENTORY_MANAGER · **Requirements:** FR-INV-05 · **Rules:** BR-01, BR-04, BR-05

1. During a physical stock count a discrepancy is found.
2. The manager submits an adjustment with a signed delta and a mandatory reason note (API-INV-02).
3. The service validates that the resulting quantity is not negative, then, in one transaction, updates `inventory` and inserts an `ADJUSTMENT` transaction carrying the note.
4. Nothing is edited or deleted. The discrepancy and its explanation are now permanent history (BR-04).

---

## 19. Reorder Intelligence Engine — Algorithm Specification

### 19.1 Design Principles

| Principle | Consequence |
|---|---|
| Rule-based, not learned | Every output traces to a formula and named inputs. No model, no training data, no unexplainable output. |
| Fully auditable | Every intermediate value is persisted, so a recommendation can be defended weeks later (BR-34). |
| Degradation over failure | A missing input skips one part, never the run (FR-REO-11). |
| Conservative bias | Weighting can increase a recommendation but never suppress it; rounding is always up (BR-31, BR-32). |
| Deterministic | The same inputs always produce the same output, which is what makes it unit-testable (NFR-22). |

### 19.2 Inputs

| Input | Source | Endpoint |
|---|---|---|
| Consumption history, 90 days | inventory-ops-service | API-INV-05 |
| Current stock, quantity on order | inventory-ops-service | API-INV-06 |
| Upcoming appointments in the lead-time window | inventory-ops-service | API-APT-05 |
| Vehicle models serviced, last 90 days | inventory-ops-service | API-JOB-10 |
| Supplier lead time, pack size, compatible models, minimum stock | catalog-service | API-CAT-18 |

### 19.3 The Eight Steps

**Step 1 — Average daily usage.**
Take `ISSUED_TO_JOB` transactions only (BR-28) over 90 days. Compute a weighted moving average with the most recent 30 days weighted 2× and the preceding 60 days weighted 1×.

```
avg_daily_usage = (recent30Total × 2 + previous60Total × 1) / (30 × 2 + 60 × 1)
```

**Step 2 — Trend factor.**

```
trend_factor = recent30DayAverage / previous30DayAverage
```

Above 1.3 indicates a fast mover; below 0.5 indicates decline; near zero indicates dead stock. If the previous period had zero usage, the factor is set to 1.0 to avoid division by zero.

**Step 3 — Vehicle mix weight.**
Rank vehicle models by job count over 90 days. If the part is compatible with any model in the top three, apply a weight; otherwise 1.0.

```
top-1 model    → 1.20
top-2 or top-3 → 1.10
otherwise      → 1.00
```

Bounded to [1.000, 1.200] (BR-32).

**Step 4 — Safety stock.**

```
safety_stock = ceil( z × stdDev(dailyUsage) × sqrt(leadTimeDays) )
```

with `z = 1.65`, giving approximately a 95% service level under a normal demand assumption.

**Step 5 — Reorder point.**

```
reorder_point = ceil( avg_daily_usage × leadTimeDays ) + safety_stock
```

**Step 6 — Upcoming appointment demand.**
Count appointments in the next `leadTimeDays` whose vehicle model is compatible with this part, and multiply by the expected quantity per service type (default 1 unless the service type maps to a known quantity).

```
upcoming_demand = Σ (compatible appointments × expectedQtyPerService)
```

**Step 7 — Recommended order quantity.**

```
raw       = max(0, reorder_point + upcoming_demand − current_stock − quantity_on_order)
weighted  = raw × vehicle_mix_weight
final     = ceil(weighted / packSize) × packSize
```

Floored at zero (BR-30), rounded up to a whole pack (BR-31).

**Step 8 — Reason summary.**
A string template populated from the values above. No language model is involved. The template varies by which factors were significant:

```
"Usage trending {up|down} {trendPercent}% over 30 days;
 {n} upcoming {modelNames} appointments in the next {leadTime}-day lead time;
 current stock covers {currentStock} of the {reorderPoint}-unit reorder point;
 ordering in packs of {packSize} from {supplierName}."
```

For insufficient history: *"Insufficient usage history (only {n} days recorded). Recommendation based on minimum stock level of {minStock} units."*

### 19.4 Worked Example

**Part:** Brake Pad Set — Front (BRK-PAD-001), compatible with Honda City and Honda Amaze.
**Supplier:** ABC Auto Parts — lead time 7 days, pack size 6.

| Step | Input / Formula | Result |
|---|---|---|
| 1 | Weighted 90-day moving average of `ISSUED_TO_JOB` | **2.400** units/day |
| 2 | recent 30d avg (2.80) ÷ prior 30d avg (2.12) | **1.320** (usage up 32%) |
| — | Standard deviation of daily usage | 1.100 |
| 3 | Honda City ranks #1, Amaze ranks #2 in serviced models | **×1.150** |
| 4 | ceil(1.65 × 1.100 × √7) = ceil(4.80) | **5** units |
| 5 | ceil(2.400 × 7) + 5 = 17 + 5 | **22** units |
| — | Current stock (Feign snapshot) | 10 |
| — | Quantity already on order | 0 |
| 6 | 3 Honda City/Amaze appointments within 7 days × 1 set each | **3** units |
| 7a | max(0, 22 + 3 − 10 − 0) | 15 |
| 7b | 15 × 1.150 | 17.25 |
| 7c | ceil(17.25 ÷ 6) × 6 = 3 × 6 | **18 units** |

**Reason summary produced:**

> "Usage trending up 32% over 30 days; 3 upcoming Honda City/Amaze appointments in the next 7-day lead time; current stock covers 10 of the 22-unit reorder point; ordering in packs of 6 from ABC Auto Parts."

### 19.5 Unit Test Requirements

Each step is independently testable with fixed inputs. The following must be covered:

| Test | Input | Expected |
|---|---|---|
| Average daily usage, normal case | 90 days of known transactions | 2.400 |
| Average daily usage, empty history | No transactions | 0.000, flagged INSUFFICIENT_HISTORY |
| Trend factor, previous period zero | prior = 0 | 1.000, no division-by-zero |
| Vehicle mix weight, no compatible top model | Part fits only rare models | 1.000 |
| Vehicle mix weight, top-1 model | Part fits the most-serviced model | 1.200 |
| Safety stock | stdDev 1.1, lead time 7 | 5 |
| Reorder point | usage 2.4, lead time 7, safety 5 | 22 |
| Recommended quantity, stock exceeds need | current stock 40 | 0 (floored, BR-30) |
| Pack rounding | raw 17.25, pack 6 | 18 (rounded up, BR-31) |
| Full worked example | The inputs in 19.4 | 18 |
# PART G — IMPLEMENTATION STANDARDS

## 20. Project Folder Structure

### 20.1 Repository Root

One monorepo. One top-level directory per deployable application, plus the frontend, infrastructure files, and documentation.

```
automotive-inventory-system/
│
├── discovery-service/
├── api-gateway/
├── auth-service/
├── catalog-service/
├── inventory-ops-service/
├── reorder-service/
├── frontend/
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
│
└── docs/
    ├── ASIS-SDS-001-software-design-specification.docx
    ├── ASIS-PLAN-001-master-plan.docx
    ├── ASIS-SAD-001-architecture-design.docx
    ├── diagrams/
    │   ├── architecture.png
    │   ├── er-diagram.png
    │   └── sequence-issue-part.png
    └── postman/
        └── automotive-inventory.postman_collection.json
```

### 20.2 Standard Spring Boot Service Layout

Every business service follows the same internal shape. A developer who learns one service can navigate any of them.

```
<service-name>/
├── pom.xml
├── Dockerfile
├── .env.example
└── src/
    ├── main/
    │   ├── java/com/automotiveinventory/<service>/
    │   │   ├── <Service>Application.java
    │   │   │
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   ├── FeignConfig.java
    │   │   │   └── OpenApiConfig.java
    │   │   │
    │   │   ├── controller/
    │   │   ├── service/
    │   │   ├── repository/
    │   │   ├── entity/
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   └── response/
    │   │   ├── mapper/
    │   │   ├── client/            # Feign interfaces + fallbacks
    │   │   ├── exception/
    │   │   │   ├── GlobalExceptionHandler.java
    │   │   │   ├── ResourceNotFoundException.java
    │   │   │   ├── BusinessRuleViolationException.java
    │   │   │   └── ErrorResponse.java
    │   │   └── util/
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-docker.yml
    │       └── db/migration/
    │           ├── V1__initial_schema.sql
    │           └── V2__seed_reference_data.sql
    │
    └── test/java/com/automotiveinventory/<service>/
        ├── service/
        └── controller/
```

### 20.3 discovery-service

The smallest application. One class and one configuration file.

```
discovery-service/
├── pom.xml
├── Dockerfile
└── src/main/
    ├── java/com/automotiveinventory/discovery/
    │   └── DiscoveryServiceApplication.java      # @EnableEurekaServer
    └── resources/
        └── application.yml
```

### 20.4 api-gateway

```
api-gateway/
├── pom.xml
├── Dockerfile
└── src/main/
    ├── java/com/automotiveinventory/gateway/
    │   ├── ApiGatewayApplication.java
    │   ├── config/
    │   │   ├── RouteConfig.java              # the routing table, Section 10.2
    │   │   ├── CorsConfig.java
    │   │   └── SecurityConfig.java
    │   ├── filter/
    │   │   ├── JwtValidationFilter.java      # global filter, runs first
    │   │   ├── CorrelationIdFilter.java
    │   │   └── UserContextFilter.java        # adds X-User-Id / X-User-Role
    │   └── exception/
    │       └── GatewayExceptionHandler.java
    └── resources/
        └── application.yml
```

### 20.5 auth-service

```
auth-service/src/main/java/com/automotiveinventory/auth/
├── AuthServiceApplication.java
├── config/
│   ├── SecurityConfig.java
│   └── JwtConfig.java
├── controller/
│   ├── AuthController.java              # /api/auth/**
│   ├── UserController.java              # /api/users/**
│   └── InternalUserController.java      # /internal/users/**
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   └── JwtService.java                  # sign, parse, validate
├── repository/
│   └── UserRepository.java
├── entity/
│   ├── User.java
│   └── Role.java                        # enum
├── dto/
│   ├── request/  LoginRequest, CreateUserRequest, UpdateUserRequest
│   └── response/ AuthResponse, UserResponse, InternalUserResponse
├── mapper/UserMapper.java
└── exception/…
```

### 20.6 catalog-service

Organised by domain area rather than by technical layer, because it holds several unrelated entity families.

```
catalog-service/src/main/java/com/automotiveinventory/catalog/
├── CatalogServiceApplication.java
├── config/
│
├── vehicle/
│   ├── controller/  VehicleBrandController, VehicleModelController, VehicleController
│   ├── service/     VehicleBrandService, VehicleModelService, VehicleService
│   ├── repository/  VehicleBrandRepository, VehicleModelRepository, VehicleRepository
│   ├── entity/      VehicleBrand, VehicleModel, Vehicle, FuelType(enum)
│   └── dto/
│
├── customer/
│   ├── controller/CustomerController.java
│   ├── service/    CustomerService.java
│   ├── repository/ CustomerRepository.java
│   ├── entity/     Customer.java
│   └── dto/
│
├── part/
│   ├── controller/  PartController, PartCategoryController, CompatibilityController
│   ├── service/     PartService, PartCategoryService, CompatibilityService
│   ├── repository/  PartRepository, PartCategoryRepository, PartCompatibilityRepository
│   ├── entity/      Part, PartCategory, PartCompatibility
│   └── dto/
│
├── supplier/
│   ├── controller/SupplierController.java
│   ├── service/    SupplierService.java
│   ├── repository/ SupplierRepository.java
│   ├── entity/     Supplier.java
│   └── dto/
│
├── internal/
│   └── controller/InternalCatalogController.java   # /internal/** — Feign-facing
│
└── exception/
```

### 20.7 inventory-ops-service

The largest service. Four internal modules, one deployable, one transaction manager.

```
inventory-ops-service/src/main/java/com/automotiveinventory/inventoryops/
├── InventoryOpsServiceApplication.java
├── config/
│   ├── SecurityConfig.java
│   └── FeignConfig.java
│
├── inventory/
│   ├── controller/  InventoryController, LocationController
│   ├── service/     InventoryService, StockTransactionService, LocationService
│   ├── repository/  InventoryRepository, InventoryTransactionRepository, LocationRepository
│   ├── entity/      Inventory, InventoryTransaction, Location,
│   │                TransactionType(enum), ReferenceType(enum)
│   └── dto/
│
├── servicejob/
│   ├── controller/  ServiceJobController, JobPartController,
│   │                WarrantyController, InvoiceController
│   ├── service/     ServiceJobService, JobPartService,
│   │                WarrantyService, InvoiceService, JobNumberGenerator
│   ├── repository/  ServiceJobRepository, JobPartRepository,
│   │                PartWarrantyRepository, InvoiceRepository
│   ├── entity/      ServiceJob, JobPart, PartWarranty, Invoice,
│   │                JobStatus(enum), JobPartStatus(enum),
│   │                ClaimStatus(enum), InvoiceStatus(enum)
│   └── dto/
│
├── purchasing/
│   ├── controller/  PurchaseOrderController
│   ├── service/     PurchaseOrderService, GoodsReceiptService, PoNumberGenerator
│   ├── repository/  PurchaseOrderRepository, PurchaseOrderItemRepository
│   ├── entity/      PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus(enum)
│   └── dto/
│
├── appointment/
│   ├── controller/  AppointmentController
│   ├── service/     AppointmentService
│   ├── repository/  AppointmentRepository
│   ├── entity/      Appointment, AppointmentStatus(enum)
│   └── dto/
│
├── internal/
│   └── controller/InternalOpsController.java   # /internal/** — for reorder-service
│
├── client/
│   ├── CatalogClient.java                       # Feign → catalog-service
│   ├── CatalogClientFallback.java
│   ├── AuthClient.java                          # Feign → auth-service
│   └── AuthClientFallback.java
│
├── audit/
│   ├── entity/AuditLog.java
│   ├── repository/AuditLogRepository.java
│   └── service/AuditService.java
│
└── exception/
```

### 20.8 reorder-service

```
reorder-service/src/main/java/com/automotiveinventory/reorder/
├── ReorderServiceApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── FeignConfig.java
│   └── SchedulerConfig.java
├── controller/
│   └── ReorderRecommendationController.java
├── service/
│   ├── ReorderCalculationService.java      # the 8 steps, Section 19
│   ├── ReorderScheduler.java               # @Scheduled nightly trigger
│   ├── RecommendationService.java          # list, acknowledge, dismiss
│   └── ReasonSummaryBuilder.java           # Step 8 string template
├── calculation/
│   ├── UsageCalculator.java                # Steps 1–2
│   ├── VehicleMixCalculator.java           # Step 3
│   ├── SafetyStockCalculator.java          # Steps 4–5
│   └── DemandProjector.java                # Step 6
├── repository/
│   └── ReorderRecommendationRepository.java
├── entity/
│   ├── ReorderRecommendation.java
│   ├── RecommendationStatus.java           # enum
│   └── DataSufficiency.java                # enum
├── client/
│   ├── InventoryOpsClient.java
│   ├── InventoryOpsClientFallback.java
│   ├── CatalogClient.java
│   └── CatalogClientFallback.java
├── dto/
└── exception/
```

Note that each calculation step is its own class. This is deliberate: it is what makes the unit tests in Section 19.5 possible to write cleanly, and it means tuning one step does not risk the others.

### 20.9 frontend

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example                       # VITE_API_BASE_URL=http://localhost:8080
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── api/                           # one module per domain; all point at the gateway
    │   ├── axiosClient.js             # base URL, JWT interceptor, 401 handling
    │   ├── authApi.js
    │   ├── vehicleApi.js
    │   ├── customerApi.js
    │   ├── partApi.js
    │   ├── supplierApi.js
    │   ├── inventoryApi.js
    │   ├── serviceJobApi.js
    │   ├── warrantyApi.js
    │   ├── purchaseOrderApi.js
    │   ├── appointmentApi.js
    │   └── reorderApi.js
    │
    ├── pages/
    │   ├── auth/         LoginPage.jsx
    │   ├── dashboard/    DashboardPage.jsx
    │   ├── masterdata/   BrandsPage, ModelsPage, CustomersPage, VehiclesPage, SuppliersPage
    │   ├── parts/        PartsListPage, PartFormPage, PartDetailPage, CompatibilityPage
    │   ├── inventory/    StockListPage, StockAdjustPage, TransactionLedgerPage, LocationsPage
    │   ├── jobs/         JobListPage, JobFormPage, JobDetailPage, IssuePartModal
    │   ├── warranty/     WarrantyListPage, WarrantyClaimPage
    │   ├── purchasing/   PoListPage, PoFormPage, PoDetailPage, GoodsReceiptPage
    │   ├── appointments/ AppointmentListPage, AppointmentFormPage
    │   ├── reorder/      RecommendationListPage, RecommendationDetailPage
    │   └── users/        UserListPage, UserFormPage
    │
    ├── components/
    │   ├── layout/       AppShell, Sidebar, TopBar, PageHeader
    │   ├── common/       DataTable, Pagination, SearchInput, StatusBadge,
    │   │                 ConfirmDialog, EmptyState, LoadingSpinner, ErrorAlert
    │   ├── forms/        TextField, SelectField, NumberField, DateField, FormActions
    │   └── charts/       UsageTrendChart, StockLevelChart, VehicleMixChart, KpiCard
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── usePagination.js
    │   ├── useDebounce.js
    │   └── useRoleAccess.js
    │
    ├── context/
    │   └── AuthContext.jsx
    │
    ├── routes/
    │   ├── AppRoutes.jsx
    │   └── ProtectedRoute.jsx         # role-gated route wrapper
    │
    ├── utils/
    │   ├── formatters.js              # currency, date, quantity
    │   ├── validators.js
    │   └── constants.js               # enum labels, role lists, status colours
    │
    └── styles/
        └── index.css                  # Tailwind directives
```

---

## 21. Coding Standards and Naming Conventions

These are not stylistic preferences. With two people building six applications, consistency is what makes the other person's code readable without asking.

### 21.1 Java Package and Class Naming

| Element | Convention | Example |
|---|---|---|
| Base package | `com.automotiveinventory.<service>` | `com.automotiveinventory.catalog` |
| Entity | Singular noun, no suffix | `Part`, `ServiceJob` |
| Repository | `<Entity>Repository` | `PartRepository` |
| Service | `<Entity>Service` | `PartService` |
| Controller | `<Entity>Controller` | `PartController` |
| Request DTO | `<Verb><Entity>Request` | `CreatePartRequest`, `IssuePartRequest` |
| Response DTO | `<Entity>Response` | `PartResponse`, `JobPartResponse` |
| Mapper | `<Entity>Mapper` | `PartMapper` |
| Feign client | `<TargetService>Client` | `CatalogClient` |
| Fallback | `<TargetService>ClientFallback` | `CatalogClientFallback` |
| Exception | `<Condition>Exception` | `InsufficientStockException` |
| Enum | Singular, values `UPPER_SNAKE_CASE` | `JobStatus.IN_PROGRESS` |
| Test | `<ClassUnderTest>Test` | `ReorderCalculationServiceTest` |

### 21.2 Layer Responsibilities

Each layer has one job. Code that belongs to another layer is a review comment, not a matter of taste.

| Layer | Does | Never does |
|---|---|---|
| Controller | Accept the request, validate the DTO, check the role, call one service method, return a DTO | Contains business logic, touches a repository, builds queries |
| Service | Business rules, orchestration, transaction boundaries, Feign calls | Returns entities to the controller, handles HTTP concerns |
| Repository | Database access via Spring Data | Contains business logic |
| Entity | Represents a table | Leaves the service layer; is returned from a controller |
| Mapper | Entity ↔ DTO conversion | Contains business rules |
| Client | Declares a Feign interface | Contains business logic; is called from a controller |

**Hard rule:** an entity is never returned from a controller and never accepted as a request body. Every boundary uses a DTO (AD-10). This is what prevents a password hash appearing in a JSON response by accident.

### 21.3 Method Naming

| Operation | Service method | Controller method | HTTP |
|---|---|---|---|
| List | `findAll(criteria, pageable)` | `list(...)` | GET |
| Get one | `findById(id)` | `getById(id)` | GET |
| Create | `create(request)` | `create(request)` | POST |
| Update | `update(id, request)` | `update(id, request)` | PUT |
| Partial update | `updateStatus(id, request)` | `updateStatus(...)` | PATCH |
| Delete | `delete(id)` | `delete(id)` | DELETE |
| Domain action | Named for the action: `issuePartToJob(...)`, `receiveGoods(...)` | Same | POST |

Domain actions get domain names. A method called `updateInventoryAndCreateTransaction` describes its implementation; `issuePartToJob` describes its purpose. Prefer the second.

### 21.4 Transaction Rules

| Rule | Detail |
|---|---|
| TX-01 | `@Transactional` belongs on the service method, never on a controller or a repository. |
| TX-02 | Any operation writing two or more tables that must be consistent is one `@Transactional` method. |
| TX-03 | A Feign call is never made **inside** an open transaction. Fetch what you need first, then open the transaction. A remote call inside a transaction holds a database connection for the duration of a network round trip. |
| TX-04 | Read-only queries use `@Transactional(readOnly = true)`. |
| TX-05 | Transactions are never opened around the whole nightly reorder run — one per part, so a single failure does not roll back the batch. |

### 21.5 Validation Rules

| Rule | Detail |
|---|---|
| VAL-01 | Field-level validation lives on the request DTO using Bean Validation annotations. |
| VAL-02 | Business-rule validation (Section 7) lives in the service layer, never in the controller and never only in the UI. |
| VAL-03 | The frontend duplicates validation for user experience only. The backend is the authority. |
| VAL-04 | Every `@RequestBody` parameter carries `@Valid`. |

### 21.6 Exception Handling

Each service has exactly one `@RestControllerAdvice`. Business code throws typed exceptions; the advice maps them to the standard error body (Section 15.4).

| Exception | HTTP | Code |
|---|---|---|
| `ResourceNotFoundException` | 404 | `RESOURCE_NOT_FOUND` |
| `DuplicateResourceException` | 409 | `DUPLICATE_RESOURCE` |
| `InsufficientStockException` | 409 | `INSUFFICIENT_STOCK` |
| `InvalidStatusTransitionException` | 409 | `INVALID_STATUS_TRANSITION` |
| `EntityInUseException` | 409 | `ENTITY_IN_USE` |
| `OptimisticLockingFailureException` | 409 | `CONCURRENT_MODIFICATION` |
| `PartNotCompatibleException` | 422 | `PART_NOT_COMPATIBLE` |
| `BusinessRuleViolationException` | 422 | `BUSINESS_RULE_VIOLATION` |
| `DownstreamUnavailableException` | 503 | `DOWNSTREAM_UNAVAILABLE` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_FAILED` |

**Never** catch an exception and return a success response. **Never** let a raw stack trace reach the client (NFR-20).

### 21.7 Logging Standards

| Level | Use for |
|---|---|
| ERROR | An operation failed and a human should look at it |
| WARN | A circuit breaker opened, a fallback was used, a part was skipped |
| INFO | A business event completed: part issued, PO received, reorder run finished |
| DEBUG | Calculation intermediate values, Feign request/response |

Every log line carries the correlation id via MDC. Never log a password, a token, or a password hash.

```java
log.info("Part issued: partId={}, jobId={}, quantity={}, remainingStock={}, by userId={}",
         partId, jobId, quantity, remaining, userId);
```

### 21.8 Frontend Standards

| Rule | Detail |
|---|---|
| FE-01 | Components are function components with hooks. No class components. |
| FE-02 | Component files are `PascalCase.jsx`; hooks are `useCamelCase.js`; utilities are `camelCase.js`. |
| FE-03 | All server state goes through TanStack Query. No `useEffect` + `useState` fetching. |
| FE-04 | Every API call goes through a module in `api/`. No inline `axios.get` inside a component. |
| FE-05 | The JWT is attached by a single axios interceptor. No component ever reads the token directly. |
| FE-06 | A 401 response triggers a central logout and redirect, handled once in the interceptor. |
| FE-07 | Role checks use the `useRoleAccess` hook. Hiding a button is a convenience; the backend is the authority (RBAC-02). |
| FE-08 | Every list view handles four states explicitly: loading, error, empty, and populated. |
| FE-09 | Enum values are rendered through a label map in `constants.js`, never as raw `IN_PROGRESS`. |
| FE-10 | Money is formatted through `formatters.js`. No inline `toFixed(2)`. |

### 21.9 Database Migration Rules

| Rule | Detail |
|---|---|
| DB-01 | Every schema change is a new Flyway file. Never edit an applied migration. |
| DB-02 | Naming: `V<n>__<snake_case_description>.sql`, e.g. `V3__add_pack_size_to_suppliers.sql`. |
| DB-03 | `spring.jpa.hibernate.ddl-auto` is `validate` in every service and every environment. Never `update`, never `create`. |
| DB-04 | Seed and reference data are migrations too, kept separate from schema migrations. |
| DB-05 | Every index listed in Section 14.4 is created explicitly in a migration, not left to chance. |

### 21.10 Git Workflow

| Rule | Detail |
|---|---|
| GIT-01 | `main` is always demoable. `docker-compose up` on `main` must produce a working system. |
| GIT-02 | Branch naming: `feature/<service>-<short-description>`, e.g. `feature/reorder-service-safety-stock`. Also `fix/`, `refactor/`, `docs/`. |
| GIT-03 | Commit format: `<type>(<scope>): <subject>` — e.g. `feat(inventory-ops): enforce compatibility check on part issue`. |
| GIT-04 | Commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. |
| GIT-05 | Reference the requirement id where one applies: `feat(reorder): implement safety stock calculation (FR-REO-05)`. |
| GIT-06 | Every PR is reviewed by the other developer before merge, even informally. This is the primary mitigation for RSK-01 and RSK-06. |
| GIT-07 | `.env` files are never committed. One `.env.example` per service, with placeholder values. |
| GIT-08 | A PR that changes an API contract must update Section 16 of this document in the same PR. |

---

## 22. Configuration, Ports and Environment Setup

### 22.1 Port Allocation

| Application | Port | Notes |
|---|---|---|
| discovery-service | 8761 | Eureka dashboard at `/` |
| api-gateway | 8080 | **The only port the frontend knows** |
| auth-service | 8081 | |
| catalog-service | 8082 | |
| inventory-ops-service | 8083 | |
| reorder-service | 8084 | |
| PostgreSQL | 5432 | |
| frontend (Vite dev) | 5173 | |

### 22.2 Environment Variables

Committed as `.env.example`; the real `.env` is git-ignored (GIT-07).

```
# ---------- Database ----------
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=automotive_inventory
POSTGRES_USER=ais_app
POSTGRES_PASSWORD=change_me_locally

# ---------- Per-service schema ----------
AUTH_SCHEMA=auth_schema
CATALOG_SCHEMA=catalog_schema
INVENTORY_OPS_SCHEMA=inventory_ops_schema
REORDER_SCHEMA=reorder_schema

# ---------- JWT ----------
# MUST be identical in auth-service and api-gateway
JWT_SECRET=replace_with_a_long_random_value_at_least_32_chars
JWT_EXPIRATION_MS=28800000

# ---------- Discovery ----------
EUREKA_SERVER_URL=http://discovery-service:8761/eureka

# ---------- Reorder engine tuning ----------
REORDER_CRON=0 0 2 * * *
REORDER_USAGE_WINDOW_DAYS=90
REORDER_Z_SCORE=1.65
REORDER_MIN_HISTORY_DAYS=30

# ---------- Frontend ----------
VITE_API_BASE_URL=http://localhost:8080
```

The reorder tuning values are environment variables rather than constants precisely because they will be tuned. Changing the z-score should not require a code change.

### 22.3 Service `application.yml` Template

```yaml
spring:
  application:
    name: catalog-service
  datasource:
    url: jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?currentSchema=${CATALOG_SCHEMA}
    username: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate          # DB-03 — never update, never create
    properties:
      hibernate:
        default_schema: ${CATALOG_SCHEMA}
        format_sql: true
  flyway:
    enabled: true
    schemas: ${CATALOG_SCHEMA}
    default-schema: ${CATALOG_SCHEMA}
    baseline-on-migrate: true

server:
  port: 8082

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER_URL}
  instance:
    prefer-ip-address: true

resilience4j:
  circuitbreaker:
    instances:
      default:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s

logging:
  pattern:
    console: "%d{HH:mm:ss} %-5level [%X{correlationId}] %logger{20} - %msg%n"
```

### 22.4 docker-compose.yml Structure

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./docker/init-schemas.sql:/docker-entrypoint-initdb.d/01-schemas.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      retries: 10

  discovery-service:
    build: ./discovery-service
    ports: ["8761:8761"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 10s
      retries: 10

  auth-service:
    build: ./auth-service
    ports: ["8081:8081"]
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
      discovery-service: { condition: service_healthy }

  catalog-service:
    build: ./catalog-service
    ports: ["8082:8082"]
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
      discovery-service: { condition: service_healthy }

  inventory-ops-service:
    build: ./inventory-ops-service
    ports: ["8083:8083"]
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
      discovery-service: { condition: service_healthy }

  reorder-service:
    build: ./reorder-service
    ports: ["8084:8084"]
    env_file: .env
    depends_on:
      postgres: { condition: service_healthy }
      discovery-service: { condition: service_healthy }

  api-gateway:
    build: ./api-gateway
    ports: ["8080:8080"]
    env_file: .env
    depends_on:
      discovery-service: { condition: service_healthy }

volumes:
  pgdata:
```

`init-schemas.sql` creates the four schemas on first startup:

```sql
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS catalog_schema;
CREATE SCHEMA IF NOT EXISTS inventory_ops_schema;
CREATE SCHEMA IF NOT EXISTS reorder_schema;
```

### 22.5 Startup Order

Docker Compose health checks enforce this; do not rely on `depends_on` alone.

```
1. postgres            (healthy)
2. discovery-service   (healthy — everything registers here)
3. auth-service, catalog-service, inventory-ops-service, reorder-service  (parallel)
4. api-gateway         (last — it routes to services that must already be registered)
```

### 22.6 Local Development Without Docker

For day-to-day work, run PostgreSQL in Docker and the services from the IDE:

```bash
docker compose up postgres discovery-service
# then run the service you are working on from the IDE
cd frontend && npm run dev
```

This gives fast restarts on the service under development while the rest of the platform stays up.

---

# PART H — DELIVERY

## 23. Frontend Screen Inventory

Every screen the application needs, with its route, the roles that may reach it, and the endpoints it calls. This is the frontend work breakdown.

| ID | Screen | Route | Roles | Purpose | Endpoints |
|---|---|---|---|---|---|
| SCR-01 | Login | `/login` | Public | Authenticate | API-AUTH-01 |
| SCR-02 | Dashboard | `/` | All | KPIs, charts, alerts | API-INV-01, API-JOB-02, API-REO-06 |
| SCR-03 | User list | `/users` | ADMIN | Manage accounts | API-AUTH-04, API-AUTH-06 |
| SCR-04 | User form | `/users/new`, `/users/:id` | ADMIN | Create/edit a user | API-AUTH-03, API-AUTH-05 |
| SCR-05 | Vehicle brands | `/master/brands` | ADMIN, read: all | Brand CRUD | API-CAT-01 to 03 |
| SCR-06 | Vehicle models | `/master/models` | ADMIN, read: all | Model CRUD | API-CAT-04, 05 |
| SCR-07 | Customers | `/master/customers` | ADMIN, read: all | Customer CRUD | API-CAT-06 |
| SCR-08 | Vehicles | `/master/vehicles` | ADMIN, read: all | Vehicle CRUD, search by registration | API-CAT-07, 08 |
| SCR-09 | Suppliers | `/master/suppliers` | ADMIN, PURCHASER | Supplier CRUD incl. lead time | API-CAT-09 |
| SCR-10 | Part categories | `/parts/categories` | ADMIN, INV_MGR | Category tree | API-CAT-10 |
| SCR-11 | Parts list | `/parts` | All | Search, filter, stock indicator | API-CAT-11 |
| SCR-12 | Part form | `/parts/new`, `/parts/:id/edit` | ADMIN, INV_MGR | Create/edit a part | API-CAT-12 |
| SCR-13 | Part detail | `/parts/:id` | All | Part info, stock by location, usage chart | API-CAT-11, API-INV-01, API-INV-03 |
| SCR-14 | Compatibility manager | `/parts/:id/compatibility` | ADMIN, INV_MGR | Map a part to vehicle models | API-CAT-13, 14, 15 |
| SCR-15 | Stock list | `/inventory` | All | Current stock, low/zero filters | API-INV-01 |
| SCR-16 | Stock adjustment | `/inventory/adjust` | ADMIN, INV_MGR | Manual correction with reason | API-INV-02 |
| SCR-17 | Transaction ledger | `/inventory/transactions` | All | Full movement history with filters | API-INV-03 |
| SCR-18 | Locations | `/inventory/locations` | ADMIN, INV_MGR | Storage location CRUD | API-INV-04 |
| SCR-19 | Job list | `/jobs` | All (tech: own) | Filter by status, technician, date | API-JOB-02 |
| SCR-20 | Job form | `/jobs/new` | ADMIN, TECH | Create a job card | API-JOB-01, API-CAT-07 |
| SCR-21 | Job detail | `/jobs/:id` | All (tech: own) | Status timeline, issued parts, actions | API-JOB-03, 04 |
| SCR-22 | Issue part modal | (within SCR-21) | ADMIN, TECH | Search compatible parts, issue | API-JOB-05, API-CAT-16 |
| SCR-23 | Install/return panel | (within SCR-21) | ADMIN, TECH | Record installation or return | API-JOB-06, 07 |
| SCR-24 | Invoice generation | `/jobs/:id/invoice` | ADMIN | Labour, tax, discount, total | API-JOB-08 |
| SCR-25 | Invoice list | `/invoices` | All | Filter by status | API-JOB-09 |
| SCR-26 | Warranty list | `/warranties` | All | Active, expiring, claimed | API-WAR-01 |
| SCR-27 | Warranty claim | `/warranties/:id/claim` | ADMIN | Raise and resolve a claim | API-WAR-03, 04 |
| SCR-28 | Purchase order list | `/purchase-orders` | All | Filter by supplier and status | API-PO-02 |
| SCR-29 | Purchase order form | `/purchase-orders/new` | ADMIN, PURCHASER | Multi-line PO builder | API-PO-01 |
| SCR-30 | Purchase order detail | `/purchase-orders/:id` | All | Lines, receipt progress, status actions | API-PO-03, 04 |
| SCR-31 | Goods receipt | `/purchase-orders/:id/receive` | ADMIN, INV_MGR, PURCHASER | Per-line received and rejected | API-PO-05 |
| SCR-32 | Appointment list | `/appointments` | All | Calendar or list by date range | API-APT-02 |
| SCR-33 | Appointment form | `/appointments/new` | ADMIN | Book a service | API-APT-01 |
| SCR-34 | Appointment convert | (within SCR-32) | ADMIN | Turn an appointment into a job | API-APT-04 |
| SCR-35 | **Recommendation list** | `/reorder` | ADMIN, INV_MGR, PURCHASER | The differentiator's main screen | API-REO-01 |
| SCR-36 | **Recommendation detail** | `/reorder/:id` | as above | Full calculation breakdown, step by step | API-REO-02, 03, 04 |
| SCR-37 | Create PO from recommendations | `/reorder/create-po` | ADMIN, PURCHASER | Multi-select → grouped POs | API-PO-06 |
| SCR-38 | Not found / Forbidden | `/404`, `/403` | All | Error pages | — |

**37 functional screens.** SCR-35 and SCR-36 are the screens to demonstrate first in any presentation — they are where the project's distinctiveness is visible.

### 23.1 Dashboard Widget Specification (SCR-02)

| Widget | Data | Visible to |
|---|---|---|
| Total stock value | Σ (quantityOnHand × costPrice) | All |
| Open jobs by status | Count per JobStatus | All |
| Parts below minimum | Count where quantityOnHand < minStockLevel | All |
| Pending recommendations | Count + total recommended value | All except TECHNICIAN |
| My assigned jobs | Jobs where technicianId = current user | TECHNICIAN |
| Top 5 recommendations | Highest recommended quantity | All except TECHNICIAN |
| Usage trend chart | Consumption over the last 30 days | All |
| Vehicle mix chart | Jobs by vehicle model, last 90 days | All |
| Dead stock list | No consumption in 90 days | ADMIN, INV_MGR |
| Fast/slow movers | Top and bottom 10 by 30-day consumption | ADMIN, INV_MGR |
| Expiring warranties | Ending within 30 days | ADMIN, INV_MGR |
| Overdue POs | expectedDeliveryDate past, not RECEIVED | ADMIN, PURCHASER |

---

## 24. Build Phases and Work Allocation

### 24.1 Phase Plan

**Phase 0 — Platform Scaffolding (Week 1). Non-negotiable, and not to be rushed.**
Stand up discovery-service, api-gateway with its routing table and JWT filter, and auth-service with working login. Success criterion: a login request through the gateway returns a token, and a subsequent authenticated request through the gateway reaches a service and returns data. Nothing else can be built until this skeleton is solid — skipping straight to business features is the most common way a microservices student project stalls.

**Phase 1 — Catalog Foundation (Weeks 2–3).**
catalog-service in full: brands, models, customers, vehicles, categories, parts, compatibility, suppliers. CRUD screens through the gateway. Deliverable: SCR-05 through SCR-14 working.

**Phase 2 — Inventory Core (Weeks 3–4).**
inventory-ops-service: locations, inventory, the transaction ledger, stock adjustment, and — critically — the first Feign call out to catalog-service. Deliverable: SCR-15 through SCR-18, and one service successfully calling another.

**Phase 3 — Service Workflow (Weeks 5–6).**
Job lifecycle, part issue with the live compatibility check, install and return, warranty creation, invoicing. This is the largest single phase. Deliverable: SCR-19 through SCR-27, and UC-03 demonstrable end to end.

**Phase 4 — Purchasing (Weeks 6–7).**
Purchase orders, goods receipt with rejection handling, stock increment. Overlaps the tail of Phase 3. Deliverable: SCR-28 through SCR-31, and UC-05 demonstrable.

**Phase 5 — Reorder Intelligence (Weeks 7–8). Do not compress this phase.**
Stand up reorder-service, wire both Feign clients with circuit breakers, implement the eight calculation steps as separate testable classes, the scheduler, and the recommendation screens. Deliverable: SCR-35 through SCR-37, UC-06 demonstrable including the container-kill resilience demo.

**Phase 6 — Analytics and Polish (Week 9).**
Dashboard widgets, dead stock and fast/slow mover views, role-based UI refinement, empty and error states, responsive checks.

**Week 10 — Hardening.**
Complete the test suite, run the full manual checklist, finalise documentation, rehearse the demonstration.

### 24.2 Work Allocation

Split by service rather than by layer. With four services plus platform, a by-layer split loads one person with four backend applications.

| Developer A — Platform & Reference | Developer B — Operations & Intelligence |
|---|---|
| discovery-service | inventory-ops-service (all four modules) |
| api-gateway | reorder-service |
| auth-service | Frontend: jobs, purchasing, appointments, reorder |
| catalog-service | |
| Frontend: auth, master data, parts, inventory | |
| docker-compose and infrastructure | Test strategy and CI |

**Shared, done together before coding starts:** the API contracts in Section 16, the database schema in Section 12, and the permission matrix in Section 4.2. A mismatched contract between two independently-built services is a real integration bug, not a typo, and it surfaces late.

**Both developers must be able to explain, independently:** the reorder algorithm end to end, and why each service boundary is where it is. Those are the two most interview-relevant parts of this project.

### 24.3 Milestone Checklist

| Milestone | Week | Demonstrable outcome |
|---|---|---|
| M0 | 1 | Login through gateway returns a token; an authenticated call reaches a service |
| M1 | 3 | Full master data CRUD; a part mapped to two vehicle models |
| M2 | 4 | Stock adjustment writes a ledger entry; inventory-ops calls catalog over Feign |
| M3 | 6 | UC-03 end to end: issue a compatible part, reject an incompatible one |
| M4 | 7 | UC-05 end to end: raise a PO, receive with a rejection, stock increases correctly |
| M5 | 8 | UC-06: nightly run produces recommendations; killing a container degrades gracefully |
| M6 | 9 | Dashboard live with all widgets and role-based visibility |
| M7 | 10 | Full test suite green; `docker-compose up` from a clean clone works first time |

---

## 25. Testing Strategy and Test Cases

### 25.1 Test Levels

| Level | Scope | Tooling | Who |
|---|---|---|---|
| Unit | One class, dependencies mocked | JUnit 5 + Mockito + AssertJ | Owner of the service |
| Contract | A Feign client against a mocked downstream | WireMock | Owner of the calling service |
| Integration | One service against a real database | Spring Boot Test + Testcontainers or Docker Compose | Owner |
| End-to-end | Full flow across services | Docker Compose + Postman collection | Both |
| Resilience | Behaviour when a dependency dies | Manual container stop | Both |
| Manual / UAT | Role restrictions, UI states | Checklist | Both |

### 25.2 Priority Test Cases

The following must exist and pass before the project is considered complete.

| ID | Test | Level | Verifies |
|---|---|---|---|
| TC-01 | Login with valid credentials returns a token containing the correct role claim | Unit | FR-AUTH-01 |
| TC-02 | Login with a wrong password returns 401 with a message identical to unknown-email | Unit | FR-AUTH-02 |
| TC-03 | An expired token is rejected at the gateway with 401 | Manual | FR-AUTH-08, NFR-02 |
| TC-04 | A TECHNICIAN token calling a purchase order endpoint receives 403 | Integration | RBAC-02, NFR-03 |
| TC-05 | Calling a service directly (bypassing the gateway) with a wrong-role token still returns 403 | Manual | NFR-03 |
| TC-06 | Creating a part with unitPrice below costPrice returns 400 with a field error | Unit | FR-PART-04 |
| TC-07 | Creating a duplicate part number returns 409 | Integration | FR-PART-03 |
| TC-08 | A duplicate compatibility mapping returns 409 | Integration | FR-PART-06 |
| TC-09 | **Issuing an incompatible part returns 422 and writes nothing** | Integration | FR-JOB-06, BR-07 |
| TC-10 | **Issuing a compatible part decrements stock and writes exactly one ledger row** | Integration | FR-JOB-05, BR-03 |
| TC-11 | Issuing more than available returns 409 and leaves stock unchanged | Integration | FR-INV-04, BR-01 |
| TC-12 | Two concurrent issues of the last unit: one succeeds, one fails with 409 | Integration | FR-INV-08, NFR-08 |
| TC-13 | The issue price snapshot is unaffected by a later catalogue price change | Integration | FR-JOB-07, BR-10 |
| TC-14 | Completing a job with an unreconciled part returns 409 | Unit | FR-JOB-10, BR-13 |
| TC-15 | An illegal job status transition returns 409 | Unit | BR-12 |
| TC-16 | Installing a part creates a warranty with the correct end date | Integration | FR-WAR-01, BR-25 |
| TC-17 | Claiming an expired warranty returns 422 | Unit | FR-WAR-05, BR-26 |
| TC-18 | Goods receipt increments stock only by the received quantity, not received + rejected | Integration | FR-PO-06, BR-21 |
| TC-19 | Receipt where received + rejected exceeds ordered returns 422 and rolls back entirely | Integration | FR-PO-07, BR-20 |
| TC-20 | Cancelling a PO with received quantity returns 409 | Unit | FR-PO-09, BR-19 |
| TC-21 | A PO becomes RECEIVED only when every line is fully accounted for | Unit | FR-PO-08, BR-22 |
| TC-22 | An appointment dated in the past returns 422 | Unit | FR-APT-02 |
| TC-23 | Average daily usage with the Section 19.4 inputs returns 2.400 | Unit | FR-REO-02 |
| TC-24 | Trend factor with a zero prior period returns 1.000, not an error | Unit | FR-REO-03 |
| TC-25 | Safety stock with stdDev 1.1 and lead time 7 returns 5 | Unit | FR-REO-05 |
| TC-26 | Reorder point with usage 2.4 and lead time 7 returns 22 | Unit | FR-REO-06 |
| TC-27 | **The full worked example returns exactly 18** | Unit | FR-REO-08, Section 19.4 |
| TC-28 | A part with stock above the reorder point returns quantity 0, never negative | Unit | BR-30 |
| TC-29 | Recommended quantity always rounds up to a pack multiple | Unit | BR-31 |
| TC-30 | Vehicle mix weight never falls below 1.000 or exceeds 1.200 | Unit | BR-32 |
| TC-31 | A part with under 30 days of history is flagged INSUFFICIENT_HISTORY | Unit | BR-29 |
| TC-32 | **When catalog-service is stopped, the reorder run skips affected parts and completes** | Resilience | FR-REO-11, NFR-07 |
| TC-33 | When catalog-service is stopped, a part issue fails with 503 rather than proceeding | Resilience | BR-09 |
| TC-34 | A new recommendation supersedes the prior PENDING one rather than deleting it | Integration | BR-33 |
| TC-35 | A list endpoint requesting size=500 is capped at 100 | Unit | NFR-11 |
| TC-36 | A correlation id set at the gateway appears in all downstream service logs | Manual | NFR-14 |
| TC-37 | `docker-compose up` from a clean clone produces a fully working system | Manual | NFR-18 |

### 25.3 Coverage Targets

| Area | Target | Reason |
|---|---|---|
| Reorder calculation classes | 90%+ | The differentiator; it must be provably correct |
| Service layer, business rules | 70%+ | Where the rules live |
| Controllers | Smoke coverage | Thin by design |
| Mappers and DTOs | Not required | No logic to test |

### 25.4 The Resilience Demonstration

TC-32 and TC-33 are worth rehearsing as a live demonstration, because they show something most student projects cannot:

1. Start the full system with `docker compose up`.
2. Trigger a reorder recalculation and show it completing normally.
3. Run `docker compose stop catalog-service`.
4. Trigger the recalculation again. Show the logs: the circuit breaker opening, affected parts being skipped with a logged reason, and the run completing with a partial result rather than an exception.
5. Attempt to issue a part on a job. Show it correctly refusing with 503 rather than proceeding on an unverified fitment.
6. Restart catalog-service and show the circuit closing and normal behaviour resuming.

The contrast between step 4 (degrade) and step 5 (refuse) is the point: the system makes a different, deliberate choice depending on what is at stake.

---

## 26. Definition of Done

A feature is complete when every line below is true. This is the merge checklist.

**Code**
- Implements its stated functional requirement id, and the id appears in the commit message.
- Business rules are enforced in the service layer, not only in the UI.
- The endpoint matches its contract in Section 16 exactly — path, method, request shape, response shape, status codes.
- Role authorisation matches the permission matrix in Section 4.2.
- Entities do not cross the controller boundary; DTOs are used both ways.
- Errors use the standard shape and an error code from Section 15.5.
- Any multi-table write that must be consistent is inside one `@Transactional` method.
- No Feign call is made inside an open transaction.
- Logging is present at INFO for the business event, with the correlation id available.

**Data**
- Any schema change is a new Flyway migration, never an edit to an applied one.
- Indexes required by Section 14.4 exist.
- No cross-schema query or foreign key was introduced.

**Tests**
- Unit tests cover the happy path and every rejection path.
- Any new Feign call has a fallback and a test proving the fallback behaves as Section 17.4 specifies.
- The relevant test cases from Section 25.2 pass.

**Frontend**
- Loading, error, empty and populated states are all handled.
- Role-based visibility matches the matrix.
- All API access goes through a module in `api/`.
- Enums render through the label map; money renders through the formatter.
- The screen works at 768px width.

**Integration**
- `docker-compose up` from a clean state still works end to end.
- The other developer has reviewed the PR.
- This document is updated if the change altered a contract, a schema, or a rule.

---

## 27. Risks and Out-of-Scope Declarations

### 27.1 Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RSK-01 | Two developers building six applications drift apart on API contracts, breaking integration late | High | High | Section 16 is agreed and frozen before coding; any contract change requires a PR that updates this document (GIT-08); cross-review every PR (GIT-06) |
| RSK-02 | A downstream service being slow or down cascades into the nightly reorder run failing entirely | Medium | Medium | Resilience4j circuit breaker with per-part fallback (FR-REO-11); proven by TC-32 |
| RSK-03 | Splitting inventory and job/purchasing writes across services would force distributed transactions | — | High | Avoided by design: kept in one service (Section 10.5, AD-04, AD-05) |
| RSK-04 | Free-tier cloud cold starts cascade across six services during a live demonstration | Medium | Medium | Docker Compose is the environment of record (AD-08); cloud deployment optional |
| RSK-05 | One PostgreSQL instance is a single point of failure for all four schemas | Low | Medium | Accepted deliberately at this scale; ownership discipline is still enforced by per-schema users (Section 11.1) |
| RSK-06 | One developer unavailable mid-project stalls their service entirely | Medium | High | Cross-review requirement means neither service is unknown to the other; this document removes single-owner tribal knowledge |
| RSK-07 | Phase 5 (the differentiator) gets compressed because earlier phases overran | Medium | High | Phase ordering puts it before polish, not after; Section 24.1 states explicitly that it is not to be compressed |
| RSK-08 | Compatibility data entry is tedious and gets skipped, making the core feature undemonstrable | Medium | Medium | Seed migration (`V2__seed_reference_data.sql`) ships with realistic parts, models and mappings from day one |
| RSK-09 | Reorder recommendations look arbitrary because the reasoning is not surfaced | Low | High | Every intermediate value is persisted and shown in SCR-36; the reason summary is part of the contract, not an afterthought |
| RSK-10 | Scope creep into notifications, payments or mobile consumes the hardening week | Medium | Medium | Section 27.2 declares these out of scope explicitly and up front |

### 27.2 Out of Scope for Version 1

Stated deliberately. These are decisions, not gaps.

**Architecture and infrastructure**
- Asynchronous messaging or event-driven architecture (Kafka, RabbitMQ). All inter-service communication is synchronous REST via OpenFeign (AD-02).
- Distributed transactions or sagas. Avoided by containing tightly-coupled writes in one service (AD-05).
- A service mesh (Istio, Linkerd). Service-to-service traffic is plain HTTP inside a Docker network.
- Separate physical database servers per service. One instance, four schemas (AD-03).
- Horizontal scaling, load balancing, or multiple instances per service.
- Centralised log aggregation (ELK) or distributed tracing (Zipkin, Jaeger). Correlation ids in per-service logs are the observability story.

**Functional**
- Multi-tenant support for multiple workshop branches on one deployment.
- Payment gateway integration. Invoices reach PAID status manually.
- SMS or email notifications of any kind.
- A customer-facing portal or booking site.
- A native mobile application. The frontend is responsive down to tablet width only.
- Accounting system or supplier EDI integration.
- Multi-warehouse stock transfer with in-transit tracking.
- Barcode or QR scanning for stock movements.
- Labour time tracking per technician beyond a flat labour charge.

**Reorder engine**
- Machine learning or LLM-based forecasting. The engine is deliberately rule-based and explainable (AD-07).
- Seasonality modelling beyond the 30-day trend factor.
- Supplier price comparison or automatic supplier selection.
- Automatic purchase order placement without human approval. A recommendation is always a suggestion; a human raises the PO.

---

## Appendix A — Requirement Traceability Summary

| Module | Requirements | Endpoints | Screens | Priority test cases |
|---|---|---|---|---|
| M1 Auth | FR-AUTH-01 … 10 | API-AUTH-01 … 07 | SCR-01, 03, 04 | TC-01 … 05 |
| M2 Master Data | FR-CAT-01 … 10 | API-CAT-01 … 09, 20 | SCR-05 … 09 | TC-07 |
| M3 Parts | FR-PART-01 … 10 | API-CAT-10 … 19 | SCR-10 … 14 | TC-06, 08 |
| M4 Inventory | FR-INV-01 … 12 | API-INV-01 … 06 | SCR-15 … 18 | TC-10, 11, 12 |
| M5 Jobs | FR-JOB-01 … 14 | API-JOB-01 … 10 | SCR-19 … 25 | TC-09, 13, 14, 15 |
| M6 Warranty | FR-WAR-01 … 07 | API-WAR-01 … 04 | SCR-26, 27 | TC-16, 17 |
| M7 Purchasing | FR-PO-01 … 11 | API-PO-01 … 06 | SCR-28 … 31 | TC-18 … 21 |
| M8 Appointments | FR-APT-01 … 06 | API-APT-01 … 05 | SCR-32 … 34 | TC-22 |
| M9 Reorder | FR-REO-01 … 15 | API-REO-01 … 06 | SCR-35 … 37 | TC-23 … 34 |
| M10 Dashboard | FR-DSH-01 … 09 | (aggregates) | SCR-02 | — |

**Totals:** 10 modules · 94 functional requirements · 22 non-functional requirements · 34 business rules · 21 database tables · 12 enumerations · 9 use cases · 37 screens · 37 priority test cases · 10 risks.

---

## Appendix B — Quick Reference Card

**Ports:** discovery 8761 · gateway 8080 · auth 8081 · catalog 8082 · inventory-ops 8083 · reorder 8084 · postgres 5432 · frontend 5173

**Schemas:** `auth_schema` (1 table) · `catalog_schema` (8) · `inventory_ops_schema` (11) · `reorder_schema` (1)

**Who owns what:**
- Users and tokens → auth-service
- Anything describing what a thing *is* → catalog-service
- Anything that *happens* to stock → inventory-ops-service
- What to buy next → reorder-service

**Golden rules:**
1. Never query another service's schema. Ever.
2. Every stock change writes a ledger row in the same transaction.
3. Never make a Feign call inside an open transaction.
4. Entities never cross the controller boundary.
5. Compatibility failure blocks the operation; reorder data failure skips the part.
6. `main` must always run with one `docker-compose up`.

---

*End of document — ASIS-SDS-001 v1.0*
