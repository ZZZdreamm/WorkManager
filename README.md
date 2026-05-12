# WorkFlex — Employees & Projects

Mini-aplikacja do zarządzania pracownikami outsourcingowymi i projektami. Zadanie
rekrutacyjne dla WorkFlex.

## Stack

- **Backend** — NestJS 10 (TypeScript), Prisma 5, PostgreSQL 16,
  `class-validator` + globalny `ValidationPipe`, Jest do testów jednostkowych.
- **Frontend** — Next.js 14 (App Router, React 18, TypeScript), Tailwind CSS,
  natywny `fetch`.
- **Infra (dev)** — Docker Compose dla bazy.

```
workmanager/
├── backend/            NestJS + Prisma
├── frontend/           Next.js
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
npx prisma migrate dev --name init
npm run prisma:seed            # opcjonalnie — kilka rekordów demo
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

## Endpointy

| Metoda | Ścieżka                              | Opis                                                                  |
|--------|--------------------------------------|-----------------------------------------------------------------------|
| GET    | `/api/employees`                     | Lista pracowników. Opcjonalne filtry: `?project=X`, `?status=ACTIVE`. |
| GET    | `/api/employees/:id`                 | Pojedynczy pracownik.                                                 |
| POST   | `/api/employees`                     | Utworzenie pracownika.                                                |
| PATCH  | `/api/employees/:id`                 | Aktualizacja częściowa.                                               |
| DELETE | `/api/employees/:id`                 | Usunięcie.                                                            |
| GET    | `/api/employees/summary?project=X`   | Sumaryczny koszt projektu (suma `hoursWorked × hourlyRate`).          |

Statusy pracownika: `ACTIVE | INACTIVE | ON_LEAVE`.

Przykład response z `/summary`:

```json
{
  "project": "WorkFlex Portal",
  "employeeCount": 3,
  "totalHours": 320,
  "totalCost": 52000
}
```

## Testy

```bash
cd backend
npm test
```

Pokrywają kluczową logikę w `EmployeesService`:

- czysta funkcja `calculateSummary` (pusty projekt, precyzja `Decimal`,
  akceptacja `string`/`number`/`Decimal` jako stawki),
- filtrowanie listy (project + status, case-insensitive),
- `findOne` / `update` / `remove` — krótkie zwarcie i `NotFoundException` przy
  braku rekordu, trimowanie stringów, payloady częściowe.

Frontend nie ma testów — zakres zadania.

## Założenia projektowe

- **Pojedynczy model `Employee`** trzyma też pole `project` (string) oraz
  `hoursWorked`. Na potrzeby zadania to wystarczy — w pełnej domenie projekty i
  rejestracje czasu pracy byłyby osobnymi tabelami z FK i historią. Tutaj
  endpoint `summary` agreguje sobie pole-stringowe `project`.
- **`hourlyRate` jako `Decimal(10,2)`**. Mnożenie w `EmployeesService` używa
  `Prisma.Decimal`, żeby nie zgubić centów na floatach. Wynik zwracany do API
  jako `number` z dwoma miejscami po przecinku.
- **Walidacja po stronie backendu** jest źródłem prawdy. Frontend ma podstawowe
  walidacje formularza (HTML5 + ręczne sprawdzenia), ale wszystko leci do API i
  przy błędach 4xx pokazujemy treść wiadomości z backendu.
- **Filtr `project` jest case-insensitive** (`mode: 'insensitive'`) — naturalne
  zachowanie przy ręcznym wpisywaniu nazwy.
- **Statusy jako enum** w bazie i w typach front-/backendu — łatwiej rozszerzyć
  niż w przypadku stringów ad-hoc.
- **Brak autoryzacji, CORS otwarty na `localhost:3000`** — zgodne z briefem.

## Co dorobiłbym mając więcej czasu

- **Wyciągnięcie projektów do osobnej tabeli** z FK na `Employee`. Wtedy
  `summary` bierze projekt z `WHERE projectId = ?` zamiast equals-string, a do
  tego dostajemy edycję metadanych projektu (klient, budżet, daty).
- **Rejestrowanie czasu pracy jako osobny strumień** (`TimeEntry`) zamiast
  jednego skumulowanego pola `hoursWorked`. Pozwoliłoby liczyć koszt w
  zadanym przedziale czasowym i raportować klientowi.
- **Paginacja + sortowanie po stronie API** (`?page=`, `?limit=`, `?sort=`).
- **Optymistyczne aktualizacje na froncie** + biblioteka do data fetching
  (React Query / SWR). Obecnie po każdej mutacji robimy pełny refetch listy.
- **Walidacja unikalności** (np. nie można dodać dwóch pracowników o tych
  samych imionach w jednym projekcie — albo lepiej: kontroli przez `email`).
- **Audit log + soft delete** zamiast twardego `DELETE`.
- **Testy e2e** na backendzie (supertest na realnym `NestApplication` z testową
  bazą) i testy komponentów na froncie (Vitest + React Testing Library).
- **CI** (lint + test + build) i konteneryzacja całości w `docker-compose`.
- **i18n** w UI (obecnie etykiety po angielsku, walut formatuję w `pl-PL`).
