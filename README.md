# 🚀 TaskFlow

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![Fastify](https://img.shields.io/badge/Fastify-202020?style=for-the-badge&logo=fastify)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana)

> A highly scalable, real-time task management and collaboration platform built with a distributed architecture. 

**[Live Demo](https://task-flow-web-seven.vercel.app)** | **[API Documentation](#)** | **[Report a Bug](#)**

---

## 🏗 System Architecture

*Below is the high-level architecture demonstrating the separation of concerns between the edge-deployed frontend and the stateful, fully-monitored backend infrastructure.*

<div align="center">
  <img src="./docs/architecture-diagram.png" alt="TaskFlow System Architecture" width="800"/>
</div>

## 🧠 Engineering Highlights & Technical Challenges

Building TaskFlow required solving several enterprise-level distributed system challenges. 

### 1. Cross-Domain Authentication & Session Management
Separating the frontend (Serverless Edge) and backend (PaaS) introduced significant hurdles with modern browser privacy policies (Third-Party Cookies).
* **Challenge:** Google Chrome and Safari actively block cross-site cookies, resulting in dropped sessions between `vercel.app` and `onrender.com`.
* **Solution:** Engineered a robust, dynamic CORS pipeline within Fastify that explicitly mirrors the request origin. Configured `better-auth` to utilize secure, `SameSite="none"` cookies while dynamically instructing the Node server to trust upstream load balancer proxies. Intercepted raw Fastify headers using adapter functions to ensure the auth middleware could properly decrypt cross-domain payloads.

### 2. Distributed Observability (The LGTM Stack)
To ensure high availability and rapid debugging, the platform relies on a complete telemetry pipeline rather than standard console logging.
* **Logs:** Integrated `pino` with Grafana Loki, batching and streaming structured JSON logs asynchronously to prevent event-loop blocking.
* **Traces:** Implemented OpenTelemetry (OTel) auto-instrumentation. Injected a tracer pre-boot to map distributed request lifecycles (waterfall tracing) across Fastify, Prisma, and Redis, exporting data to Grafana Tempo via OTLP over HTTP.
* **Metrics:** Utilized Prometheus client libraries to expose a `/metrics` endpoint, tracking CPU/memory consumption, route response times, and custom business-logic counters (e.g., successful workspace generations).

### 3. Real-Time Collaboration & WebSockets
* **Architecture:** Leveraged `yjs` (CRDTs) and `@hocuspocus/server` running on a dedicated Fastify WebSocket route.
* **Persistence:** Built a custom database extension to serialize binary Yjs state directly into PostgreSQL via Prisma, ensuring concurrent user edits are perfectly synced and safely persisted without data loss.

---

## 🛠 Tech Stack

### Frontend (Client)
* **Framework:** Next.js (React)
* **State Management:** React Query (TanStack), Zustand
* **Styling:** Tailwind CSS, Radix UI

### Backend (API)
* **Core:** Node.js, Fastify, TypeScript
* **Database & ORM:** PostgreSQL, Prisma
* **Caching & Queues:** Redis, Upstash
* **Authentication:** Better Auth
* **Real-time Engine:** WebSockets, Hocuspocus (Yjs)

### DevOps & Observability
* **Hosting:** Vercel (Frontend), Render (Backend)
* **Telemetry:** OpenTelemetry, Grafana Cloud (Loki, Tempo, Mimir)
* **Bundler:** Tsup

---

## 💻 Local Development

### Prerequisites
* Node.js (v18+)
* pnpm
* PostgreSQL (Running locally or via Docker)
* Redis

### Quick Start

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/taskflow.git](https://github.com/yourusername/taskflow.git)
   cd taskflow