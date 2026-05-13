# WorkFlex — Employees, Projects & Time tracking

Mini-aplikacja do zarządzania pracownikami outsourcingowymi, projektami oraz
ewidencją czasu pracy. Zadanie rekrutacyjne dla WorkFlex, rozszerzone o
funkcjonalności z listy „co bym dorobił mając więcej czasu".

## Stack

- **Backend** — NestJS 10 (TypeScript), Prisma 5, PostgreSQL 16,
  `class-validator` + globalny `ValidationPipe`, Jest do testów jednostkowych.
- **Frontend** — Next.js 14 (App Router, React 18, TypeScript), Tailwind CSS,
  **SWR** do data fetching z optymistycznymi mutacjami.
- **Infra (dev)** — Docker Compose dla bazy.

```
workmanager/
├── backend/            NestJS + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── common/          pagination utility, audit service, error helpers
│       ├── employees/       CRUD + summary
│       ├── projects/        CRUD
│       ├── time-entries/    CRUD
│       ├── audit-log/       read-only listing of all changes
│       └── prisma/
├── frontend/           Next.js
│   └── src/
│       ├── app/
│       │   ├── page.tsx              employees + filters + summary
│       │   ├── projects/page.tsx     projects CRUD
│       │   └── time-entries/page.tsx time entries CRUD
│       ├── components/
│       └── lib/
│           ├── api.ts                typed fetch client
│           ├── hooks.ts              SWR hooks
│           └── format.ts
└── docker-compose.yml  PostgreSQL 16 dla developmentu
```

## Wymagania

- Node.js ≥ 18.18
- Docker (do lokalnej Postgres) lub własna instancja PostgreSQL

## Uruchomienie

### 1. Baza danych

```bash
docker compose up -d
```

Postaw `workflex-postgres` na porcie `5432` (user: `workflex`, pass: `workflex`,
db: `workflex`).

Jeśli wolisz własną Postgres, ustaw `DATABASE_URL` w `backend/.env`.

### 2. Backend

```bash
cd backend
cp .env.example .env           # jeśli jeszcze nie istnieje
npm install
npx prisma migrate deploy      # zaaplikuj istniejącą migrację
npm run prisma:seed            # opcjonalnie — 3 projekty, 6 pracowników, 17 wpisów godzin
npm run start:dev
```

API słucha na `http://localhost:4000/api`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local     # jeśli jeszcze nie istnieje
npm install
npm run dev
```

UI dostępne pod `http://localhost:3000`.

## Model domeny

```
Project  ←──┬─ Employee  ──── TimeEntry
            │
            └─ TimeEntry (FK do projektu w momencie wpisu)

AuditLog (entity, entityId, action, changes JSON, createdAt)
```

- **Project** — `name` (unique), `client`, `budget` (Decimal), `startDate`,
  `endDate`, `status (ACTIVE | ARCHIVED)`, `deletedAt` (soft delete).
- **Employee** — `firstName`, `lastName`, `email` (unique), `position`,
  `projectId` (FK), `hourlyRate` (Decimal), `status (ACTIVE | INACTIVE |
  ON_LEAVE)`, `deletedAt` (soft delete).
- **TimeEntry** — `employeeId`, `projectId` (snapshot z momentu wpisu),
  `date`, `hours` (Decimal), `description`.
- **AuditLog** — historia zmian wszystkich encji (CREATE/UPDATE/DELETE z
  diffem before/after w JSON).

Statusy są enumami w bazie i typach. Stawki, budżety i godziny trzymane są
jako `Decimal` żeby nie tracić groszy/dziesiętnych podczas mnożenia.

## Endpointy

Wszystkie listy zwracają kopertę paginacji `{ data, page, limit, total,
totalPages }`. Lista akceptuje `?page=`, `?limit=` (max 100) i `?sort=` (np.
`?sort=hourlyRate:desc`) — pole sortowania jest whitelistowane per endpoint.

### Pracownicy

| Metoda | Ścieżka                                              | Opis |
|--------|------------------------------------------------------|------|
| GET    | `/api/employees`                                     | Lista. Filtry: `?projectId=`, `?status=`. Nieaktywne (soft-deleted) są ukryte. |
| GET    | `/api/employees/:id`                                 | Pojedynczy pracownik (404 dla soft-deleted). |
| POST   | `/api/employees`                                     | Tworzenie. 409 przy zduplikowanym `email`. |
| PATCH  | `/api/employees/:id`                                 | Częściowa aktualizacja (audit zapisuje diff). |
| DELETE | `/api/employees/:id`                                 | Soft delete (`deletedAt`). |
| GET    | `/api/employees/summary?projectId=X&from=&to=`       | Sumaryczny koszt projektu z `TimeEntry` × `hourlyRate`. `from`/`to` opcjonalne. |

### Projekty

| Metoda | Ścieżka                | Opis |
|--------|------------------------|------|
| GET    | `/api/projects`        | Lista. Filtr `?status=`. Soft-deleted ukryte. |
| GET    | `/api/projects/:id`    | Pojedynczy. |
| POST   | `/api/projects`        | Tworzenie. 409 przy zduplikowanej nazwie. |
| PATCH  | `/api/projects/:id`    | Częściowa aktualizacja. |
| DELETE | `/api/projects/:id`    | Soft delete. |

### Wpisy godzin

| Metoda | Ścieżka                                      | Opis |
|--------|----------------------------------------------|------|
| GET    | `/api/time-entries`                          | Lista. Filtry: `?employeeId=`, `?projectId=`, `?from=`, `?to=`. |
| POST   | `/api/time-entries`                          | Dodanie. `projectId` brany z aktualnego projektu pracownika. |
| DELETE | `/api/time-entries/:id`                      | Twardy delete (z audit logiem). |

### Audit log

| Metoda | Ścieżka                                          | Opis |
|--------|--------------------------------------------------|------|
| GET    | `/api/audit-log?entity=&entityId=&action=`       | Lista zmian, najnowsze na górze. |

### Przykład: response z `/employees/summary`

```json
{
  "projectId": "84974011-…",
  "projectName": "WorkFlex Portal",
  "from": "2026-04-01",
  "to": "2026-04-30",
  "employeeCount": 3,
  "totalHours": 320,
  "totalCost": 52400
}
```

## Testy

```bash
cd backend
npm test
```

16 testów jednostkowych w `EmployeesService` pokrywających:

- czystą funkcję `calculateSummary` (precyzja `Decimal`, deduplikacja
  pracowników, zakres dat),
- `list` z paginacją, filtrami i sortowaniem (whitelist),
- soft delete + audit (wszystkie mutacje zapisują wpis w `AuditLog`),
- email unique → `ConflictException`,
- validacja zakresu `from > to` → `BadRequestException`,
- `projectSummary` skleja `TimeEntry` z `Employee.hourlyRate` przy
  uwzględnieniu daty i flagi soft delete.

Frontend nie ma testów — zakres zadania.

## Założenia projektowe

- **Pojedyncza migracja `init`** zawiera komplet schema (5 tabel + 3 enumy).
  Reviewer dostaje `prisma migrate deploy` + `prisma:seed` i ma gotowe
  środowisko.
- **`hourlyRate` i `hours` w `Decimal`** — mnożenie kosztów idzie przez
  `Prisma.Decimal`, wynik konwertujemy na `number` z dwoma miejscami po
  przecinku dopiero w response.
- **`TimeEntry` ma własny `projectId`** (snapshot). Jeśli pracownik zmieni
  projekt, stare wpisy nadal liczone są do projektu, na który były wpisywane.
- **Soft delete** ukrywa rekord przez `deletedAt IS NOT NULL` we wszystkich
  domyślnych zapytaniach i indeksowane jest osobnym indeksem.
- **Audit log** pisze CREATE pełny snapshot, UPDATE tylko diff zmienionych
  pól, DELETE pełny snapshot ostatniego stanu (włącznie z `deletedAt`).
- **Pagination + sorting** są wspólną biblioteką w `common/pagination/`. Sort
  whitelistowany per service żeby nie dało się sortować po wrażliwych
  kolumnach.
- **SWR + optymistyczne mutacje** — każdy create/update/delete na froncie
  natychmiast aktualizuje cache (`optimisticData`), w razie błędu robi
  rollback (`rollbackOnError`), a po sukcesie wymusza revalidation z
  serwera. Sumaryczna karta projektu jest invalidowana po każdej mutacji
  pracownika/wpisu godzin.
- **Brak autoryzacji, CORS otwarty na `localhost:3000`** — zgodne z briefem.

## Co dorobiłbym dalej (kolejna iteracja)

Lista bieżących TODO-w jakie zostawiłbym właścicielowi produktu po tym
sprincie:

- **Autoryzacja i role** — JWT lub sesja z RBAC (admin, manager, employee).
  `userId` powinien też trafiać do `AuditLog.changes` zamiast bezimiennego
  zapisu.
- **Self-service ewidencji czasu** — pracownik widzi i edytuje **tylko**
  swoje wpisy, manager akceptuje (`status: PENDING | APPROVED | REJECTED`).
- **Snapshot `hourlyRate` na `TimeEntry`** — żeby zmiana stawki w przyszłości
  nie zmieniała historycznych kosztów (obecnie używamy aktualnej stawki).
- **Wynagrodzenia, marża, fakturowanie** — `BillableRate` na poziomie projektu
  (co klient płaci) vs `hourlyRate` (co kosztuje pracownik); raport marży i
  generowanie faktur PDF.
- **Webhooki i export** — wywołania na zewnątrz przy zmianach (`employee.created`)
  i export CSV/XLSX z listy + summary.
- **Reporting layer** — materializowane widoki dla kosztu projektu w
  zakresach dat (rok / kwartał / tydzień), żeby `summary` nie liczyło ad-hoc
  przy każdym odświeżeniu.
- **Frontend** — globalna nawigacja per projekt (drilldown z listy projektów
  do pracowników i ewidencji godzin filtrowanej tym projektem), wykresy
  (Recharts), bulk-edit, multi-select w tabeli.
- **Walidacja overlapu czasu pracy** — nie można zarejestrować > 24h dziennie
  per pracownik (na poziomie agregatu, nie pojedynczego wpisu).
- **i18n + lokalizacja walut** — UI po polsku/angielsku, projekty mogą mieć
  walutę inną niż PLN.
- **Testy** — supertest e2e na realnym `NestApplication` z testową bazą +
  Playwright na ścieżce „dodaj projekt → dodaj pracownika → dodaj wpis →
  sprawdź summary".
- **CI + observability** — GitHub Actions (lint + test + build), strukturalne
  logi (pino), Sentry, metryki Prometheus + dashboard Grafana.
- **Konteneryzacja całości** — Dockerfile dla backendu/frontu, `docker-compose
  up` startuje cały stack jednym poleceniem.
- **Migracje produkcyjne** — `prisma migrate deploy` z osobnym kontem DB o
  ograniczonych uprawnieniach; rollback strategy dla nieodwracalnych zmian
  (kopia tabel + feature flag).
- **Retencja audit-loga** — partycjonowanie po `createdAt`, automatyczna
  archiwizacja starszych wpisów do S3.
