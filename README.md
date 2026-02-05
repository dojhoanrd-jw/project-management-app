# Project Management Dashboard

Aplicación fullstack de gestión de proyectos y tareas construida con arquitectura serverless en AWS. Permite a los equipos gestionar proyectos, asignar tareas, dar seguimiento al progreso y colaborar a través de un dashboard intuitivo.


## Demo en Vivo

| Servicio | URL |
|----------|-----|
| Frontend | https://d3rx7s4hbv9ebb.cloudfront.net |
| API | https://5qhssdu85m.execute-api.us-east-2.amazonaws.com |

**Credenciales de prueba:**

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@demo.com | admin123 | Admin — acceso total, gestiona usuarios |
| sarah@demo.com | sarah123 | Project Manager — gestiona proyectos asignados |
| john@demo.com | john1234 | Member — visualiza proyectos y tareas asignadas |
| maria@demo.com | maria123 | Member — visualiza proyectos y tareas asignadas |

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, SWR, ECharts |
| Backend | Node.js 18, AWS Lambda, API Gateway (HTTP), Serverless Framework v4 |
| Base de datos | DynamoDB (diseño single-table, PAY_PER_REQUEST) |
| Autenticación | JWT (jsonwebtoken + bcryptjs) |
| Validación | Zod (backend), sistema de reglas custom (frontend) |
| Infraestructura | S3 + CloudFront (frontend), IaC vía serverless.yml, CI/CD con GitHub Actions |
| i18n | React Context custom (inglés / español) |

---

## Visión General de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      CloudFront (CDN)                   │
│              d3rx7s4hbv9ebb.cloudfront.net               │
│         ┌──────────────────────────────────┐            │
│         │  CloudFront Function (URL rewrite) │            │
│         └──────────────┬───────────────────┘            │
└────────────────────────┼────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   S3    │  Static export (Next.js)
                    │ Bucket  │  HTML + JS + CSS
                    └─────────┘
                                        ┌──────────────┐
    Browser (SWR) ──── HTTPS ──────────►│ API Gateway  │
                                        │  (HTTP API)  │
                                        └──────┬───────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                        ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐
                        │  Lambda   │  │   Lambda    │  │  Lambda   │
                        │  (Auth)   │  │ (Projects)  │  │  (Tasks)  │
                        └─────┬─────┘  └──────┬──────┘  └─────┬─────┘
                              │               │               │
                              └───────────────┼───────────────┘
                                              │
                                     ┌────────▼────────┐
                                     │    DynamoDB     │
                                     │  AppData-prod   │
                                     │  (Single Table) │
                                     └─────────────────┘
```

---

## Modelo de DynamoDB

### ¿Por qué diseño Single-Table?

Una sola tabla de DynamoDB (`AppData`) con claves compuestas permite:
- **Queries eficientes** — Todos los patrones de acceso se resuelven con `Query` (nunca `Scan`)
- **Baja latencia** — Datos relacionados co-ubicados en la misma partición
- **Eficiencia en costos** — Una tabla, un GSI, facturación PAY_PER_REQUEST
- **Simplicidad** — Sin joins, sin transacciones cross-table

### Esquema de Claves

**Tabla Principal (PK + SK):**

| PK | SK | Entidad | Propósito |
|----|-----|---------|-----------|
| `USER#<email>` | `PROFILE` | Usuario | Credenciales y perfil |
| `USER#<email>` | `MEMBER#<projectId>` | Membresía | Membresías del usuario en proyectos |
| `PROJECT#<projectId>` | `META` | Proyecto | Metadata del proyecto |
| `PROJECT#<projectId>` | `TASK#<taskId>` | Tarea | Tareas dentro de un proyecto |

**Índice Secundario Global (GSI1):**

| GSI1PK | GSI1SK | Propósito |
|--------|--------|-----------|
| `USERS` | `USER#<email>` | Listar todos los usuarios (Query, no Scan) |
| `PROJECT#<projectId>` | `MEMBER#<email>` | Listar miembros de un proyecto |
| `ASSIGNEE#<email>` | `TASK#<taskId>` | Listar tareas asignadas a un usuario |

### Patrones de Acceso

| Patrón | Operación | Clave Utilizada |
|--------|-----------|-----------------|
| Obtener perfil de usuario | `GetItem` | `PK=USER#email, SK=PROFILE` |
| Listar todos los usuarios | `Query GSI1` | `GSI1PK=USERS` |
| Obtener proyectos del usuario | `Query` | `PK=USER#email, SK begins_with MEMBER#` |
| Obtener proyecto + tareas | `Query` | `PK=PROJECT#id` (retorna META + todos los TASKs) |
| Obtener miembros del proyecto | `Query GSI1` | `GSI1PK=PROJECT#id, SK begins_with MEMBER#` |
| Obtener tareas del usuario | `Query GSI1` | `GSI1PK=ASSIGNEE#email` |

Todos los patrones de acceso usan **Query** con condiciones de clave. No hay table scans en el código de la aplicación.

---

## Endpoints de la API (22 en total)

### Autenticación
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login con email + contraseña, retorna JWT |
| PUT | `/auth/change-password` | Sí | Cambiar contraseña del usuario actual |

### Usuarios (solo Admin)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/users` | Sí | Listar usuarios (filtrado por rol) |
| POST | `/users` | Sí | Crear nuevo usuario |
| PUT | `/users/{email}` | Sí | Actualizar nombre/rol del usuario |
| DELETE | `/users/{email}` | Sí | Eliminar usuario |

### Proyectos
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/projects` | Sí | Listar proyectos del usuario |
| POST | `/projects` | Sí | Crear proyecto con miembros |
| GET | `/projects/{id}` | Sí | Obtener detalle del proyecto + tareas |
| PUT | `/projects/{id}` | Sí | Actualizar proyecto |
| DELETE | `/projects/{id}` | Sí | Eliminar proyecto + todas sus tareas |
| POST | `/projects/{id}/members` | Sí | Agregar miembro al proyecto |
| DELETE | `/projects/{id}/members/{email}` | Sí | Remover miembro |

### Tareas
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/tasks` | Sí | Listar todas las tareas del usuario |
| GET | `/tasks/me` | Sí | Listar tareas asignadas al usuario actual |
| POST | `/tasks` | Sí | Crear tarea en un proyecto |
| PUT | `/tasks/{id}` | Sí | Actualizar estado/detalles de tarea |
| DELETE | `/tasks/{id}` | Sí | Eliminar tarea |

### Dashboard
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/dashboard/overview?period=7d` | Sí | Métricas: totales, crecimiento, vencidas |
| GET | `/dashboard/progress` | Sí | Salud y completitud de proyectos |
| GET | `/dashboard/projects-summary` | Sí | Métricas de tareas por proyecto |
| GET | `/dashboard/today-tasks` | Sí | Tareas de hoy por categoría |
| GET | `/dashboard/workload?period=7d` | Sí | Distribución de carga por miembro |

---

## Funcionalidades Implementadas

### Requeridas
- [x] **Login** — Email + contraseña, autenticación JWT, manejo de errores, estados de carga
- [x] **Protección de rutas** — Validación de token en rutas protegidas, auto-redirect
- [x] **Dashboard** — Métricas dinámicas, tabla resumen de proyectos, tareas del día, gráfico de carga
- [x] **Proyectos CRUD** — Crear, listar, editar, eliminar con validación
- [x] **Tareas CRUD** — Crear, listar, editar, eliminar con selects dinámicos de proyecto/asignado
- [x] **Validación de formularios** — Client-side (reglas custom) + server-side (Zod)
- [x] **Estados de carga** — Skeleton loaders, spinners en botones, estados disabled
- [x] **Manejo de errores** — Toast notifications, error boundaries, clases de error para API

### Más allá de los Requerimientos
- [x] **Gestión de usuarios** — CRUD completo (solo admin)
- [x] **Control de acceso por roles** — Admin, Project Manager, Member con permisos diferenciados
- [x] **Miembros de proyecto** — Agregar/remover miembros, abandonar proyecto, verificación de membresía
- [x] **Flujo de aprobación de tareas** — Solo owner/PM pueden aprobar tareas
- [x] **Analíticas del dashboard** — Filtro por período (7d/1m/3m/6m/1y), cálculos de crecimiento, visualizaciones con ECharts
- [x] **Página de ajustes** — Cambio de contraseña con verificación de contraseña actual
- [x] **i18n** — Inglés y español, selector de idioma en login y header, persistencia en localStorage
- [x] **Infraestructura como Código** — Stack completo definido en serverless.yml (Lambda, API Gateway, DynamoDB, S3, CloudFront, OAC)
- [x] **CI/CD** — GitHub Actions: auto-deploy backend + build/upload frontend + invalidación de CloudFront al hacer push a main
- [x] **CloudFront** — CDN con Origin Access Control, reescritura de URLs SPA vía CloudFront Function

---

## Estructura del Proyecto

```
project-management-app/
├── backend/
│   ├── src/
│   │   ├── auth/           # Login, middleware JWT, validación
│   │   ├── users/          # CRUD de usuarios (solo admin)
│   │   ├── projects/       # CRUD de proyectos + gestión de miembros
│   │   ├── tasks/          # CRUD de tareas + flujo de aprobación
│   │   ├── dashboard/      # 5 endpoints de analíticas
│   │   ├── shared/         # Cliente DynamoDB, errores, helpers de respuesta, RBAC
│   │   └── scripts/        # Seed de datos, migraciones
│   ├── serverless.yml      # IaC: Lambda, API Gateway, DynamoDB, S3, CloudFront
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router (páginas + layouts)
│   │   │   ├── (app)/      # Grupo de rutas protegidas (dashboard, projects, tasks, users, settings)
│   │   │   ├── page.tsx    # Página de login
│   │   │   └── layout.tsx  # Layout raíz con providers
│   │   ├── features/       # Módulos por feature (auth, dashboard, projects, tasks, users, settings)
│   │   ├── components/     # UI reutilizable (23 componentes), layout (Header, Sidebar), iconos
│   │   ├── context/        # I18nProvider, AlertProvider, SWRProvider
│   │   ├── hooks/          # useValidation, useFormState, useFilterState, useModalState
│   │   ├── lib/            # Cliente API, auth utils, constantes, clases de error, tipos
│   │   └── i18n/           # Archivos de traducción (en.ts, es.ts — 300+ claves cada uno)
│   └── next.config.ts      # Configuración de static export
├── .github/workflows/      # Pipeline CI/CD
└── package.json            # Monorepo con npm workspaces
```

---

## Configuración para Desarrollo Local

### Prerequisitos
- Node.js 18+
- Docker (para DynamoDB Local)

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd project-management-app
npm run install:all
```

### 2. Configurar Variables de Entorno

**Backend** — Copiar y editar:
```bash
cp backend/.env.example backend/.env
```

```env
JWT_SECRET=your-secret-key-here
DYNAMO_LOCAL=true
```

**Frontend** — Copiar:
```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Iniciar DynamoDB Local y Poblar Datos

```bash
# Iniciar DynamoDB Local con Docker
docker run -d -p 8000:8000 amazon/dynamodb-local

# Crear la tabla + insertar datos de prueba (un solo comando)
cd backend && npm run setup:local
```

Esto crea la tabla `AppData-prod` con su esquema (PK, SK, GSI1) e inserta 4 usuarios, 4 proyectos y 15 tareas de ejemplo.

### 4. Iniciar Desarrollo

```bash
# Backend + frontend simultáneamente
npm run dev

# O por separado
npm run dev:backend    # API en http://localhost:3000
npm run dev:frontend   # Web en http://localhost:3001
```

El backend corre con `serverless-offline`, que emula API Gateway + Lambda localmente. Se conecta a DynamoDB Local en `http://localhost:8000`.

**Credenciales de prueba:** Ver la sección [Demo en Vivo](#demo-en-vivo).

---

## Despliegue

### Automático (CI/CD)

Un push a `main` activa GitHub Actions:
1. **Backend** — `serverless deploy --stage prod` (Lambda + API Gateway + DynamoDB)
2. **Frontend** — `next build` → `aws s3 sync` → invalidación de caché en CloudFront

### Manual

```bash
# Backend
cd backend
export JWT_SECRET=<tu-secreto>
npx serverless deploy --stage prod

# Frontend
cd frontend
NEXT_PUBLIC_API_URL=https://5qhssdu85m.execute-api.us-east-2.amazonaws.com npm run build
aws s3 sync out s3://project-manager-frontend-jhoan-prod --delete
aws cloudfront create-invalidation --distribution-id E39KC9J7BZ43EO --paths "/*"
```

---

## Decisiones Técnicas

### ¿Por qué Next.js con Static Export?

La app usa `output: 'export'` para generar un sitio completamente estático (HTML/CSS/JS). Esto permite alojar en S3 + CloudFront sin necesidad de un servidor Node.js, reduciendo costos y complejidad. Todo el data fetching ocurre client-side vía SWR, lo cual encaja perfecto con el modelo SPA.

### ¿Por qué Single-Table en DynamoDB?

En lugar de una tabla por entidad, todos los datos viven en `AppData` con claves compuestas (`PK/SK`). Esto permite:
- Obtener un proyecto y todas sus tareas en un solo Query (`PK=PROJECT#id`)
- Sin necesidad de joins — los datos relacionados están co-ubicados
- Un solo GSI resuelve tres patrones de acceso distintos (lista de usuarios, miembros del proyecto, tareas del asignado)

### ¿Por qué i18n custom en vez de react-i18next?

Con solo 2 idiomas y static export, una librería completa es innecesaria. Un React Context simple con archivos de traducción TypeScript (~300 claves cada uno) brinda el mismo resultado sin overhead en el bundle ni complejidad de SSR.

### ¿Por qué Zod para validación en el Backend?

Zod provee validación de tipos en runtime con mensajes de error claros. Cada endpoint valida la entrada antes de procesarla, previniendo que datos malformados lleguen a DynamoDB. Los schemas están co-ubicados con sus handlers para facilitar el mantenimiento.

### ¿Por qué SWR para Data Fetching?

SWR proporciona caché automático, revalidación, y estados de carga/error out of the box. Combinado con un cliente API custom que maneja inyección de JWT y auto-logout en 401, mantiene el data fetching simple y consistente en todas las páginas.

### ¿Por qué estructura por Features en el Frontend?

En lugar de agrupar por tipo (todos los componentes juntos, todos los hooks juntos), el código está organizado por feature (`features/projects/`, `features/tasks/`). Cada feature contiene su página, componentes y validación. El código compartido vive en `components/ui/`, `hooks/` y `lib/`.

### ¿Por qué Serverless Framework?

Serverless Framework v4 gestiona toda la infraestructura como código en un solo `serverless.yml`: funciones Lambda, API Gateway, tabla DynamoDB con GSI, bucket S3, distribución CloudFront con OAC, y reescritura de URLs SPA. Un solo `serverless deploy` crea todo.

---