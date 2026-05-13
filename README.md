# WorkFlex — pracownicy, projekty i ewidencja godzin

## Stack

- **Backend** — NestJS 10 + Prisma 5 + PostgreSQL 16. Walidacja przez `class-validator` + globalny `ValidationPipe` (whitelist + forbidNonWhitelisted). Jest do testów jednostkowych.
- **Frontend** — Next.js 14 (App Router) + React 18 + TypeScript + Tailwind. **SWR** do data fetching z optymistycznymi mutacjami.
- **Infra** — `docker-compose.yml` z Postgresem do developmentu.

```
workmanager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/        jeden init z całym schematem
│   │   └── seed.ts            3 projekty, 6 pracowników, 17 wpisów godzin
│   └── src/
│       ├── common/
│       │   ├── pagination/    wspólna paginacja + whitelist sortowania
│       │   ├── audit/         AuditService używany przez wszystkie moduły
│       │   └── errors/        helper do mapowania Prisma P2002 → 409
│       ├── employees/         CRUD + summary
│       ├── projects/          CRUD
│       ├── time-entries/      CRUD
│       ├── audit-log/         read-only listing wszystkich zmian
│       └── prisma/            PrismaService
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx              pracownicy + filtry + summary
│       │   ├── projects/page.tsx     projekty
│       │   └── time-entries/page.tsx wpisy godzin
│       ├── components/
│       └── lib/
│           ├── api.ts                typed fetch
│           ├── hooks.ts              hooki SWR
│           └── format.ts
└── docker-compose.yml
```

## How to run

Potrzebny Node ≥ 18.18 i Docker (albo własny Postgres — wtedy podmieniam `DATABASE_URL`).

```bash
# 1) Baza
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy   # gotowa migracja init
npm run prisma:seed         # opcjonalnie — dane demo
npm run start:dev           # http://localhost:4000/api

# 3) Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Reset bazy do zera: `docker compose down -v && docker compose up -d`, potem znowu `migrate deploy` + `prisma:seed`.

Testy:

```bash
cd backend && npm test    # 16 testów na EmployeesService
```

## Model domeny

```
Project  ─┬─ Employee ─── TimeEntry
          │
          └─ TimeEntry  (FK do projektu w momencie wpisu)

AuditLog  (niezależna tabela historii)
```

Wszystkie encje poza `TimeEntry` mają `deletedAt` (soft delete). Stawki, godziny i budżety idą jako `Decimal` — przy mnożeniu używam `Prisma.Decimal`, bo nie chciałem gubić groszy na floatach.

| Tabela     | Co trzyma                                                                                          |
|------------|----------------------------------------------------------------------------------------------------|
| `Project`  | nazwa (unique), klient, budżet, daty start/end, status (ACTIVE/ARCHIVED), `deletedAt`              |
| `Employee` | imię, nazwisko, email (unique), stanowisko, `projectId` (FK), stawka, status, `deletedAt`          |
| `TimeEntry`| `employeeId`, `projectId`, data, godziny, opis                                                     |
| `AuditLog` | entity, entityId, action (CREATE/UPDATE/DELETE), `changes` JSON, `createdAt`                       |

## API

Wszystkie listy zwracają kopertę paginacji `{ data, page, limit, total, totalPages }`. Domyślnie `page=1`, `limit=20` (max 100). Sortowanie przez `?sort=pole:asc|desc` — pole jest whitelistowane per endpoint (żeby nie dało się np. sortować po hashu hasła, gdyby kiedyś taki dorzucić).

### Pracownicy

| Metoda | Ścieżka                                          | Uwagi                                                                  |
|--------|--------------------------------------------------|------------------------------------------------------------------------|
| GET    | `/api/employees`                                 | filtry: `?projectId=`, `?status=`. Soft-deleted ukryte.                |
| GET    | `/api/employees/:id`                             | 404 jeśli brak / soft-deleted.                                         |
| POST   | `/api/employees`                                 | 409 przy duplikacie emaila, 400 jeśli `projectId` nie istnieje.        |
| PATCH  | `/api/employees/:id`                             | częściowy update; audit zapisuje diff zmienionych pól.                 |
| DELETE | `/api/employees/:id`                             | soft delete — ustawia `deletedAt`.                                     |
| GET    | `/api/employees/summary?projectId=X&from=&to=`   | suma godzin × stawki z `TimeEntry`, opcjonalny zakres dat.             |

### Projekty

| Metoda | Ścieżka              | Uwagi                                                  |
|--------|----------------------|--------------------------------------------------------|
| GET    | `/api/projects`      | filtr `?status=`, paginacja, sort whitelist.           |
| POST   | `/api/projects`      | 409 przy duplikacie `name`.                            |
| PATCH  | `/api/projects/:id`  | częściowy update.                                      |
| DELETE | `/api/projects/:id`  | soft delete.                                           |

### Wpisy godzin

| Metoda | Ścieżka                  | Uwagi                                                                      |
|--------|--------------------------|----------------------------------------------------------------------------|
| GET    | `/api/time-entries`      | filtry: `?employeeId=`, `?projectId=`, `?from=`, `?to=`.                   |
| POST   | `/api/time-entries`      | `projectId` snapshotuję z aktualnego projektu pracownika.                  |
| DELETE | `/api/time-entries/:id`  | twardy delete, ale i tak ląduje w audit logu.                              |

### Audit log

| Metoda | Ścieżka                                       | Uwagi                                  |
|--------|-----------------------------------------------|----------------------------------------|
| GET    | `/api/audit-log?entity=&entityId=&action=`    | najnowsze na górze.                    |

Przykład response z summary:

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

## Frontend

Trzy strony pod wspólnym headerem z nawigacją:

- **`/` Employees** — tabela z sortowaniem po nagłówkach (klikam na „Name", „Rate / h", „Status"), filtrami po projekcie i statusie, paginacją. Pod filtrami karta **Project cost summary** z opcjonalnym zakresem dat (`from`/`to`) — pokazuje się po wybraniu projektu. Tworzenie/edycja/usuwanie w modalu. Email + projekt z dropdowna.
- **`/projects` Projects** — pełen CRUD projektów: nazwa, klient, budżet, daty, status. Sort + paginacja.
- **`/time-entries` Time entries** — lista wpisów z filtrami (projekt, pracownik, zakres dat). Dodawanie przez modal, usuwanie z confirm.

Każda mutacja idzie przez SWR:

- `optimisticData` — cache aktualizuje się natychmiast, UI nie czeka na backend,
- `rollbackOnError` — rollback, jak coś pójdzie nie tak (np. 409 na duplikat emaila),
- `revalidate: true` — po sukcesie odświeżam z serwera, żeby mieć stan kanoniczny.

Po każdej mutacji invaliduję też klucze `summary`, żeby karta kosztu od razu pokazała aktualną kwotę.

## Podjęte decyzje

- **Jedna migracja `init`** zawiera komplet schema (5 tabel + 3 enumy). Pierwotny MVP miał swój własny `init`, ale po reworku po prostu wyrzuciłem starą migrację — i tak nie było danych produkcyjnych, a klejenie ALTER-ów dla projektu rekrutacyjnego to overengineering.
- **`TimeEntry` ma własny `projectId`** (snapshot). Jakby pracownik kiedyś zmienił projekt, stare wpisy nadal liczą się do projektu, w którym powstawały. Bez tego summary historyczne by się rozjeżdżały.
- **`hourlyRate` nie jest snapshotowane na `TimeEntry`** — używam aktualnej stawki. To świadoma decyzja w zakresie zadania; gdyby trzeba było historycznej dokładności kosztu, dodałbym `rateSnapshot` na `TimeEntry` (jest w sekcji „co bym dorobił").
- **Soft delete jako `deletedAt`**, filtrowany w każdej liście serwisu, indeksowany osobnym indeksem. Audit log w momencie DELETE zapisuje pełny snapshot tuż przed ukryciem.
- **Audit log strategia diffa** — CREATE zapisuje pełen snapshot w `after`, UPDATE tylko zmienione pola (before/after), DELETE pełny stan w `before`. JSON, więc proste do wyszukiwania.
- **Pagination + sort whitelist są wspólne** (`common/pagination/`). Każdy serwis sam deklaruje, po jakich polach wolno sortować. To samo dla limitu paginacji (max 100, walidowane).
- **Email lowercase + trim**, podobnie pozostałe stringi (`firstName`, `lastName`, `position`, `project.name`). Walidacja przez `IsEmail()` od razu w DTO; konflikt unikalności łapię w try/catch wokół `prisma.create/update` i mapuję `P2002` → `ConflictException` z konkretnym komunikatem.
- **Brak autoryzacji**, CORS otwarty na `http://localhost:3000` — w briefie nie było wymagane, a nie chciałem dokładać tematów bez wartości dla recenzji.

## Testy

16 testów jednostkowych na `EmployeesService` — najważniejszą logikę staram się trzymać czystą, więc testy nie potrzebują realnej bazy. Pokrywają:

- czystą funkcję `calculateSummary` — precyzja `Decimal`, deduplikacja pracowników, akceptacja `string|number|Decimal` jako stawki, forward zakresu dat,
- `list` z paginacją (`skip`/`take`), filtrami i defaultowym vs whitelistowanym sortowaniem,
- `findOne` rzucające `NotFoundException` dla nieistniejących/soft-deleted,
- `create` — trim, lowercase emaila, sprawdzenie projektu, audit zapisany,
- `update` — krótkie zwarcie jeśli brak rekordu, zmiana projektu wymaga walidacji nowego `projectId`,
- `remove` — soft delete (`deletedAt = new Date()`) zamiast hard delete + audit,
- `projectSummary` — 404 dla nieistniejącego projektu, 400 jeśli `from > to`, prawidłowa agregacja po `TimeEntry` z join do `Employee.hourlyRate`, pominięcie filtra dat jeśli `from`/`to` puste.

Frontu nie testuję — dla zakresu zadania uznałem to za niepotrzebne (build i ręczna sesja w przeglądarce wystarczają).

## Plany na dalszą implementację

Po implementacji punktów z poprzedniej listy doszły mi nowe pomysły:

- **Autoryzacja + RBAC** — JWT/sesja, role (admin / manager / employee). `userId` powinien też lecieć do `AuditLog.changes` zamiast bezimiennego zapisu.
- **Self-service ewidencji** — pracownik widzi i edytuje **tylko** swoje wpisy, manager akceptuje (`status: PENDING / APPROVED / REJECTED`).
- **Snapshot stawki na `TimeEntry`** — żeby zmiana `hourlyRate` w przyszłości nie zmieniała historycznych kosztów. Obecnie biorę aktualną stawkę.
- **Billable rate vs cost rate** — `Project.billableRate` (co klient płaci) i `Employee.hourlyRate` (co kosztuje). Raport marży, generowanie faktur PDF.
- **Walidacja overlapu** — nie więcej niż 24h dziennie per pracownik (na agregacie, nie pojedynczym wpisie).
- **Reporting layer** — materializowane widoki kosztu projektu w zakresach (tydzień / kwartał / rok) zamiast ad-hoc agregacji w `summary`.
- **Frontend UX** — wykresy (Recharts), bulk-edit/multi-select w tabeli, drilldown z karty projektu wprost do pracowników i wpisów filtrowanych tym projektem.
- **Webhooki + export** — eventy w stylu `employee.created`, export CSV/XLSX z list i summary.
- **i18n + waluty per projekt** — UI po pl/en, projekt może mieć walutę inną niż PLN.
- **Testy** — supertest e2e na realnym `NestApplication` z testową bazą + Playwright na ścieżce „dodaj projekt → dodaj pracownika → dodaj wpis → sprawdź summary".
- **CI/CD + observability** — GitHub Actions (lint + test + build), pino, Sentry, Prometheus + dashboard Grafana.
- **Dockerfile dla backendu i frontu** — żeby cały stack startował jednym `docker compose up`.
- **Retencja audit-loga** — partycjonowanie po `createdAt`, archiwizacja starszych do S3.
- **Migracje prod** — `prisma migrate deploy` z osobnym kontem o ograniczonych uprawnieniach, plan rollbacku dla nieodwracalnych zmian (kopia tabel + feature flag).
