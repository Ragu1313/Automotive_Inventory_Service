# Automotive Service Inventory System — Complete Folder Structure

Monorepo. Six deployable Spring Boot applications + one React frontend.
Create the directories in this order; the tree below is the full target state.

**Base Java package:** `com.automotiveinventory.<service>`

---

## 1. Repository Root

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
├── docker/
│   └── init-schemas.sql
│
├── docker-compose.yml
├── .env
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

---

## 2. discovery-service  (port 8761)

Eureka server. Smallest app in the system — one class.

```
discovery-service/
├── pom.xml
├── Dockerfile
└── src/
    └── main/
        ├── java/com/automotiveinventory/discovery/
        │   └── DiscoveryServiceApplication.java        # @EnableEurekaServer
        └── resources/
            └── application.yml
```

---

## 3. api-gateway  (port 8080)

Spring Cloud Gateway. The only port the frontend knows.

```
api-gateway/
├── pom.xml
├── Dockerfile
├── .env.example
└── src/
    └── main/
        ├── java/com/automotiveinventory/gateway/
        │   ├── ApiGatewayApplication.java
        │   │
        │   ├── config/
        │   │   ├── RouteConfig.java                    # the routing table
        │   │   ├── CorsConfig.java                     # CORS configured ONCE, here
        │   │   └── SecurityConfig.java
        │   │
        │   ├── filter/
        │   │   ├── JwtValidationFilter.java            # global filter, runs first
        │   │   ├── CorrelationIdFilter.java            # generates X-Correlation-Id
        │   │   └── UserContextFilter.java              # adds X-User-Id / X-User-Role
        │   │
        │   ├── util/
        │   │   └── JwtUtil.java
        │   │
        │   └── exception/
        │       ├── GatewayExceptionHandler.java
        │       └── ErrorResponse.java
        │
        └── resources/
            ├── application.yml
            └── application-docker.yml
```

---

## 4. auth-service  (port 8081, schema `auth_schema`)

```
auth-service/
├── pom.xml
├── Dockerfile
├── .env.example
└── src/
    ├── main/
    │   ├── java/com/automotiveinventory/auth/
    │   │   ├── AuthServiceApplication.java
    │   │   │
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   ├── JwtConfig.java
    │   │   │   └── PasswordEncoderConfig.java
    │   │   │
    │   │   ├── controller/
    │   │   │   ├── AuthController.java                 # /api/auth/**
    │   │   │   ├── UserController.java                 # /api/users/**
    │   │   │   └── InternalUserController.java         # /internal/users/**
    │   │   │
    │   │   ├── service/
    │   │   │   ├── AuthService.java
    │   │   │   ├── UserService.java
    │   │   │   └── JwtService.java                     # sign / parse / validate
    │   │   │
    │   │   ├── repository/
    │   │   │   └── UserRepository.java
    │   │   │
    │   │   ├── entity/
    │   │   │   ├── User.java
    │   │   │   └── Role.java                           # enum
    │   │   │
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   ├── CreateUserRequest.java
    │   │   │   │   └── UpdateUserRequest.java
    │   │   │   └── response/
    │   │   │       ├── AuthResponse.java
    │   │   │       ├── UserResponse.java
    │   │   │       └── InternalUserResponse.java
    │   │   │
    │   │   ├── mapper/
    │   │   │   └── UserMapper.java
    │   │   │
    │   │   └── exception/
    │   │       ├── GlobalExceptionHandler.java
    │   │       ├── ErrorResponse.java
    │   │       ├── ResourceNotFoundException.java
    │   │       ├── DuplicateResourceException.java
    │   │       └── InvalidCredentialsException.java
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-docker.yml
    │       └── db/migration/
    │           ├── V1__initial_schema.sql
    │           └── V2__seed_admin_user.sql
    │
    └── test/java/com/automotiveinventory/auth/
        ├── service/
        │   ├── AuthServiceTest.java
        │   └── JwtServiceTest.java
        └── controller/
            └── AuthControllerTest.java
```

---

## 5. catalog-service  (port 8082, schema `catalog_schema`)

Organised by domain area, not by technical layer — it holds several unrelated entity families.

```
catalog-service/
├── pom.xml
├── Dockerfile
├── .env.example
└── src/
    ├── main/
    │   ├── java/com/automotiveinventory/catalog/
    │   │   ├── CatalogServiceApplication.java
    │   │   │
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   └── OpenApiConfig.java
    │   │   │
    │   │   ├── vehicle/
    │   │   │   ├── controller/
    │   │   │   │   ├── VehicleBrandController.java
    │   │   │   │   ├── VehicleModelController.java
    │   │   │   │   └── VehicleController.java
    │   │   │   ├── service/
    │   │   │   │   ├── VehicleBrandService.java
    │   │   │   │   ├── VehicleModelService.java
    │   │   │   │   └── VehicleService.java
    │   │   │   ├── repository/
    │   │   │   │   ├── VehicleBrandRepository.java
    │   │   │   │   ├── VehicleModelRepository.java
    │   │   │   │   └── VehicleRepository.java
    │   │   │   ├── entity/
    │   │   │   │   ├── VehicleBrand.java
    │   │   │   │   ├── VehicleModel.java
    │   │   │   │   ├── Vehicle.java
    │   │   │   │   └── FuelType.java                   # enum
    │   │   │   ├── dto/
    │   │   │   │   ├── request/
    │   │   │   │   └── response/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── customer/
    │   │   │   ├── controller/CustomerController.java
    │   │   │   ├── service/CustomerService.java
    │   │   │   ├── repository/CustomerRepository.java
    │   │   │   ├── entity/Customer.java
    │   │   │   ├── dto/
    │   │   │   └── mapper/CustomerMapper.java
    │   │   │
    │   │   ├── part/
    │   │   │   ├── controller/
    │   │   │   │   ├── PartController.java
    │   │   │   │   ├── PartCategoryController.java
    │   │   │   │   └── CompatibilityController.java
    │   │   │   ├── service/
    │   │   │   │   ├── PartService.java
    │   │   │   │   ├── PartCategoryService.java
    │   │   │   │   └── CompatibilityService.java
    │   │   │   ├── repository/
    │   │   │   │   ├── PartRepository.java
    │   │   │   │   ├── PartCategoryRepository.java
    │   │   │   │   └── PartCompatibilityRepository.java
    │   │   │   ├── entity/
    │   │   │   │   ├── Part.java
    │   │   │   │   ├── PartCategory.java
    │   │   │   │   └── PartCompatibility.java
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── supplier/
    │   │   │   ├── controller/SupplierController.java
    │   │   │   ├── service/SupplierService.java
    │   │   │   ├── repository/SupplierRepository.java
    │   │   │   ├── entity/Supplier.java
    │   │   │   ├── dto/
    │   │   │   └── mapper/SupplierMapper.java
    │   │   │
    │   │   ├── internal/
    │   │   │   ├── controller/InternalCatalogController.java   # /internal/** — Feign-facing
    │   │   │   └── dto/
    │   │   │       ├── CompatibilityResponse.java
    │   │   │       ├── PartSupplyInfoResponse.java
    │   │   │       └── InternalVehicleResponse.java
    │   │   │
    │   │   └── exception/
    │   │       ├── GlobalExceptionHandler.java
    │   │       ├── ErrorResponse.java
    │   │       ├── ResourceNotFoundException.java
    │   │       ├── DuplicateResourceException.java
    │   │       └── EntityInUseException.java
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-docker.yml
    │       └── db/migration/
    │           ├── V1__initial_schema.sql
    │           └── V2__seed_reference_data.sql          # brands, models, parts, compatibility
    │
    └── test/java/com/automotiveinventory/catalog/
        ├── part/
        │   ├── PartServiceTest.java
        │   └── CompatibilityServiceTest.java
        └── vehicle/
            └── VehicleServiceTest.java
```

---

## 6. inventory-ops-service  (port 8083, schema `inventory_ops_schema`)

The largest service. Four internal modules, one deployable, one transaction manager.

```
inventory-ops-service/
├── pom.xml
├── Dockerfile
├── .env.example
└── src/
    ├── main/
    │   ├── java/com/automotiveinventory/inventoryops/
    │   │   ├── InventoryOpsServiceApplication.java
    │   │   │
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   ├── FeignConfig.java
    │   │   │   └── Resilience4jConfig.java
    │   │   │
    │   │   ├── inventory/
    │   │   │   ├── controller/
    │   │   │   │   ├── InventoryController.java
    │   │   │   │   └── LocationController.java
    │   │   │   ├── service/
    │   │   │   │   ├── InventoryService.java
    │   │   │   │   ├── StockTransactionService.java
    │   │   │   │   └── LocationService.java
    │   │   │   ├── repository/
    │   │   │   │   ├── InventoryRepository.java
    │   │   │   │   ├── InventoryTransactionRepository.java
    │   │   │   │   └── LocationRepository.java
    │   │   │   ├── entity/
    │   │   │   │   ├── Inventory.java
    │   │   │   │   ├── InventoryTransaction.java
    │   │   │   │   ├── Location.java
    │   │   │   │   ├── TransactionType.java            # enum
    │   │   │   │   └── ReferenceType.java              # enum
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── servicejob/
    │   │   │   ├── controller/
    │   │   │   │   ├── ServiceJobController.java
    │   │   │   │   ├── JobPartController.java
    │   │   │   │   ├── WarrantyController.java
    │   │   │   │   └── InvoiceController.java
    │   │   │   ├── service/
    │   │   │   │   ├── ServiceJobService.java
    │   │   │   │   ├── JobPartService.java             # the part-issue transaction
    │   │   │   │   ├── WarrantyService.java
    │   │   │   │   ├── InvoiceService.java
    │   │   │   │   └── JobNumberGenerator.java
    │   │   │   ├── repository/
    │   │   │   │   ├── ServiceJobRepository.java
    │   │   │   │   ├── JobPartRepository.java
    │   │   │   │   ├── PartWarrantyRepository.java
    │   │   │   │   └── InvoiceRepository.java
    │   │   │   ├── entity/
    │   │   │   │   ├── ServiceJob.java
    │   │   │   │   ├── JobPart.java
    │   │   │   │   ├── PartWarranty.java
    │   │   │   │   ├── Invoice.java
    │   │   │   │   ├── JobStatus.java                  # enum
    │   │   │   │   ├── JobPartStatus.java              # enum
    │   │   │   │   ├── ClaimStatus.java                # enum
    │   │   │   │   └── InvoiceStatus.java              # enum
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── purchasing/
    │   │   │   ├── controller/PurchaseOrderController.java
    │   │   │   ├── service/
    │   │   │   │   ├── PurchaseOrderService.java
    │   │   │   │   ├── GoodsReceiptService.java        # the receipt transaction
    │   │   │   │   └── PoNumberGenerator.java
    │   │   │   ├── repository/
    │   │   │   │   ├── PurchaseOrderRepository.java
    │   │   │   │   └── PurchaseOrderItemRepository.java
    │   │   │   ├── entity/
    │   │   │   │   ├── PurchaseOrder.java
    │   │   │   │   ├── PurchaseOrderItem.java
    │   │   │   │   └── PurchaseOrderStatus.java        # enum
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── appointment/
    │   │   │   ├── controller/AppointmentController.java
    │   │   │   ├── service/AppointmentService.java
    │   │   │   ├── repository/AppointmentRepository.java
    │   │   │   ├── entity/
    │   │   │   │   ├── Appointment.java
    │   │   │   │   └── AppointmentStatus.java          # enum
    │   │   │   ├── dto/
    │   │   │   └── mapper/
    │   │   │
    │   │   ├── internal/
    │   │   │   ├── controller/InternalOpsController.java       # /internal/** — for reorder-service
    │   │   │   └── dto/
    │   │   │       ├── UsageHistoryResponse.java
    │   │   │       ├── StockSnapshotResponse.java
    │   │   │       ├── ServicedVehiclesResponse.java
    │   │   │       └── UpcomingAppointmentsResponse.java
    │   │   │
    │   │   ├── client/
    │   │   │   ├── CatalogClient.java                  # Feign → catalog-service
    │   │   │   ├── CatalogClientFallback.java
    │   │   │   ├── AuthClient.java                     # Feign → auth-service
    │   │   │   ├── AuthClientFallback.java
    │   │   │   └── dto/                                # response shapes from other services
    │   │   │
    │   │   ├── audit/
    │   │   │   ├── entity/AuditLog.java
    │   │   │   ├── repository/AuditLogRepository.java
    │   │   │   └── service/AuditService.java
    │   │   │
    │   │   └── exception/
    │   │       ├── GlobalExceptionHandler.java
    │   │       ├── ErrorResponse.java
    │   │       ├── ResourceNotFoundException.java
    │   │       ├── InsufficientStockException.java
    │   │       ├── PartNotCompatibleException.java
    │   │       ├── InvalidStatusTransitionException.java
    │   │       ├── BusinessRuleViolationException.java
    │   │       └── DownstreamUnavailableException.java
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-docker.yml
    │       └── db/migration/
    │           ├── V1__initial_schema.sql
    │           ├── V2__indexes.sql
    │           └── V3__seed_locations.sql
    │
    └── test/java/com/automotiveinventory/inventoryops/
        ├── inventory/
        │   ├── InventoryServiceTest.java
        │   └── StockTransactionServiceTest.java
        ├── servicejob/
        │   ├── JobPartServiceTest.java                 # compatibility + stock tests
        │   └── ServiceJobServiceTest.java              # status transition tests
        ├── purchasing/
        │   └── GoodsReceiptServiceTest.java
        └── client/
            └── CatalogClientFallbackTest.java          # WireMock
```

---

## 7. reorder-service  (port 8084, schema `reorder_schema`)

The differentiator. Each calculation step is its own class so it can be unit-tested in isolation.

```
reorder-service/
├── pom.xml
├── Dockerfile
├── .env.example
└── src/
    ├── main/
    │   ├── java/com/automotiveinventory/reorder/
    │   │   ├── ReorderServiceApplication.java
    │   │   │
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   ├── FeignConfig.java
    │   │   │   ├── SchedulerConfig.java
    │   │   │   └── Resilience4jConfig.java
    │   │   │
    │   │   ├── controller/
    │   │   │   └── ReorderRecommendationController.java
    │   │   │
    │   │   ├── service/
    │   │   │   ├── ReorderCalculationService.java      # orchestrates the 8 steps
    │   │   │   ├── ReorderScheduler.java               # @Scheduled nightly 02:00
    │   │   │   ├── RecommendationService.java          # list / acknowledge / dismiss
    │   │   │   └── ReasonSummaryBuilder.java           # Step 8 — string template
    │   │   │
    │   │   ├── calculation/
    │   │   │   ├── UsageCalculator.java                # Steps 1–2
    │   │   │   ├── VehicleMixCalculator.java           # Step 3
    │   │   │   ├── SafetyStockCalculator.java          # Steps 4–5
    │   │   │   └── DemandProjector.java                # Step 6
    │   │   │
    │   │   ├── repository/
    │   │   │   └── ReorderRecommendationRepository.java
    │   │   │
    │   │   ├── entity/
    │   │   │   ├── ReorderRecommendation.java
    │   │   │   ├── RecommendationStatus.java           # enum
    │   │   │   └── DataSufficiency.java                # enum
    │   │   │
    │   │   ├── client/
    │   │   │   ├── InventoryOpsClient.java             # Feign → inventory-ops-service
    │   │   │   ├── InventoryOpsClientFallback.java
    │   │   │   ├── CatalogClient.java                  # Feign → catalog-service
    │   │   │   ├── CatalogClientFallback.java
    │   │   │   └── dto/
    │   │   │
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   └── response/
    │   │   │
    │   │   ├── mapper/
    │   │   │   └── RecommendationMapper.java
    │   │   │
    │   │   └── exception/
    │   │       ├── GlobalExceptionHandler.java
    │   │       └── ErrorResponse.java
    │   │
    │   └── resources/
    │       ├── application.yml
    │       ├── application-docker.yml
    │       └── db/migration/
    │           └── V1__initial_schema.sql
    │
    └── test/java/com/automotiveinventory/reorder/
        ├── calculation/
        │   ├── UsageCalculatorTest.java
        │   ├── VehicleMixCalculatorTest.java
        │   ├── SafetyStockCalculatorTest.java
        │   └── DemandProjectorTest.java
        ├── service/
        │   └── ReorderCalculationServiceTest.java      # the full worked example → 18
        └── client/
            └── InventoryOpsClientFallbackTest.java     # WireMock
```

---

## 8. frontend  (React + Vite + Tailwind, dev port 5173)

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env
├── .env.example                                        # VITE_API_BASE_URL=http://localhost:8080
├── .eslintrc.cjs
├── index.html
│
├── public/
│   └── favicon.svg
│
└── src/
    ├── main.jsx
    ├── App.jsx
    │
    ├── api/                                            # every call points at the gateway
    │   ├── axiosClient.js                              # base URL + JWT interceptor + 401 handling
    │   ├── authApi.js
    │   ├── userApi.js
    │   ├── vehicleApi.js
    │   ├── customerApi.js
    │   ├── partApi.js
    │   ├── supplierApi.js
    │   ├── inventoryApi.js
    │   ├── serviceJobApi.js
    │   ├── warrantyApi.js
    │   ├── invoiceApi.js
    │   ├── purchaseOrderApi.js
    │   ├── appointmentApi.js
    │   └── reorderApi.js
    │
    ├── pages/
    │   ├── auth/
    │   │   └── LoginPage.jsx
    │   ├── dashboard/
    │   │   └── DashboardPage.jsx
    │   ├── users/
    │   │   ├── UserListPage.jsx
    │   │   └── UserFormPage.jsx
    │   ├── masterdata/
    │   │   ├── BrandsPage.jsx
    │   │   ├── ModelsPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   ├── VehiclesPage.jsx
    │   │   └── SuppliersPage.jsx
    │   ├── parts/
    │   │   ├── PartsListPage.jsx
    │   │   ├── PartFormPage.jsx
    │   │   ├── PartDetailPage.jsx
    │   │   ├── PartCategoriesPage.jsx
    │   │   └── CompatibilityPage.jsx
    │   ├── inventory/
    │   │   ├── StockListPage.jsx
    │   │   ├── StockAdjustPage.jsx
    │   │   ├── TransactionLedgerPage.jsx
    │   │   └── LocationsPage.jsx
    │   ├── jobs/
    │   │   ├── JobListPage.jsx
    │   │   ├── JobFormPage.jsx
    │   │   ├── JobDetailPage.jsx
    │   │   ├── IssuePartModal.jsx
    │   │   └── InstallReturnPanel.jsx
    │   ├── warranty/
    │   │   ├── WarrantyListPage.jsx
    │   │   └── WarrantyClaimPage.jsx
    │   ├── invoices/
    │   │   ├── InvoiceListPage.jsx
    │   │   └── InvoiceGeneratePage.jsx
    │   ├── purchasing/
    │   │   ├── PoListPage.jsx
    │   │   ├── PoFormPage.jsx
    │   │   ├── PoDetailPage.jsx
    │   │   └── GoodsReceiptPage.jsx
    │   ├── appointments/
    │   │   ├── AppointmentListPage.jsx
    │   │   └── AppointmentFormPage.jsx
    │   ├── reorder/
    │   │   ├── RecommendationListPage.jsx              # the differentiator's main screen
    │   │   ├── RecommendationDetailPage.jsx            # full calculation breakdown
    │   │   └── CreatePoFromRecommendationsPage.jsx
    │   └── error/
    │       ├── NotFoundPage.jsx
    │       └── ForbiddenPage.jsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── TopBar.jsx
    │   │   └── PageHeader.jsx
    │   ├── common/
    │   │   ├── DataTable.jsx
    │   │   ├── Pagination.jsx
    │   │   ├── SearchInput.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── ConfirmDialog.jsx
    │   │   ├── Modal.jsx
    │   │   ├── EmptyState.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── ErrorAlert.jsx
    │   ├── forms/
    │   │   ├── TextField.jsx
    │   │   ├── SelectField.jsx
    │   │   ├── NumberField.jsx
    │   │   ├── DateField.jsx
    │   │   ├── TextAreaField.jsx
    │   │   └── FormActions.jsx
    │   └── charts/
    │       ├── KpiCard.jsx
    │       ├── UsageTrendChart.jsx
    │       ├── StockLevelChart.jsx
    │       └── VehicleMixChart.jsx
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
    │   └── ProtectedRoute.jsx                          # role-gated route wrapper
    │
    ├── utils/
    │   ├── formatters.js                               # currency, date, quantity
    │   ├── validators.js
    │   └── constants.js                                # enum labels, roles, status colours
    │
    └── styles/
        └── index.css                                   # Tailwind directives
```

---

## 9. Quick Reference

| Application | Port | Schema | Owns |
|---|---|---|---|
| discovery-service | 8761 | — | Nothing (Eureka registry) |
| api-gateway | 8080 | — | Nothing (routing + JWT) |
| auth-service | 8081 | `auth_schema` | users |
| catalog-service | 8082 | `catalog_schema` | brands, models, customers, vehicles, suppliers, categories, parts, compatibility |
| inventory-ops-service | 8083 | `inventory_ops_schema` | locations, inventory, transactions, jobs, job_parts, warranties, invoices, POs, PO items, appointments, audit_logs |
| reorder-service | 8084 | `reorder_schema` | reorder_recommendations |
| frontend | 5173 | — | — |

### Package layout rules

- Every backend service uses the base package `com.automotiveinventory.<service>`
- `auth-service` and `reorder-service` are organised **by technical layer** (controller / service / repository / entity / dto)
- `catalog-service` and `inventory-ops-service` are organised **by domain module** first, then by layer inside each module — they are too large for a flat layer split
- `client/` holds Feign interfaces and their fallbacks; only these services have one: `inventory-ops-service` and `reorder-service`
- `internal/` holds `/internal/**` controllers — service-to-service only, never routed by the gateway
- Every service has its own `exception/` package with one `GlobalExceptionHandler`

### Build order

```
1. discovery-service      (nothing registers until this is up)
2. api-gateway
3. auth-service
4. catalog-service
5. inventory-ops-service
6. reorder-service
7. frontend
```
