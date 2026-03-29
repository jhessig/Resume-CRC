# Building My Cloud Resume: A Journey Through Azure, Terraform, and DevOps

**By Jeremy Hessig - March 28, 2026**

![Hello World](img/helloworld-20260328.jpg)

What started as a simple HTML page in June 2023 evolved into a fully automated, cloud-native resume platform — complete with infrastructure as code, CI/CD pipelines, serverless APIs, automated testing, security scanning, and monitoring. Here's the story of how I built it, what I learned, and the decisions I made along the way.

---

## The Spark: Static HTML and a Challenge (June–August 2023)

Like many cloud projects, mine began modestly. The [Cloud Resume Challenge](https://cloudresumechallenge.dev/) asks you to build a personal resume website and host it in the cloud, but the real challenge is everything underneath: DNS, CDN, serverless functions, databases, IaC, and CI/CD.

My first commits were pure frontend — an `index.html` skeleton, CSS styling, a certification table, and some JavaScript. Over the next few weeks I iterated on the layout, migrated to Bootstrap 5, added resume content, and polished the footer and contact links. By August 2023 I had a clean, responsive resume page ready to be hosted somewhere more interesting than `localhost`.

## Going Cloud-Native with Terraform (May–June 2024)

After a brief pause (and earning another certification in early 2024), I came back with a clear goal: **everything in Azure, everything as code.**

In late May 2024 I wrote my first Terraform configuration — a single `main.tf` that provisioned:

- **Azure Storage** with static website hosting
- **Azure CDN** for global content delivery
- **Azure DNS** for custom domain management

That one file was the foundation, but I quickly learned that a monolithic Terraform configuration doesn't scale. Within days I was refactoring: extracting variables into their own file, parameterizing resource names, and making the configuration reusable across environments.

### CI/CD from Day One

I didn't wait long to automate. The same week I refactored my Terraform variables, I added my first GitHub Actions workflow for continuous deployment. The initial pipeline was straightforward: checkout, `terraform init`, `terraform plan`, `terraform apply`.

But straightforward doesn't mean smooth. I spent a couple of days chasing down syntax errors in Terraform commands, fixing backend configuration issues, and learning the hard way that what works locally doesn't always work in a CI runner. Backend state configuration, variable injection, and environment differences are things you only truly learn by doing.

Shortly after, I had a working **smoke test workflow** that could stand up infrastructure, validate it, and tear it down — giving me confidence to iterate without fear of breaking production.

## The Branching Strategy: Dev → Test → Master

One architectural decision I'm particularly proud of is the **three-branch promotion model**:

- **`dev`** — active development, where all new work lands first
- **`test`** — integration branch where the smoke test workflow runs: deploy, validate, destroy
- **`master`** — production, deployed via the deploy workflow with no destruction

This mirrors real-world enterprise patterns. Code is never pushed directly to production. It flows through environments, picking up automated validation at each stage. The smoke test branch deploys ephemeral infrastructure with unique resource names (using Terraform's `random_string`), runs tests, and cleans up — keeping costs at zero for non-production work.

## Building the API: Azure Functions + Cosmos DB (June–August 2024)

A static resume is nice, but the Cloud Resume Challenge calls for a **visitor counter** — a serverless API backed by a database.

Starting in mid-June 2024, I built out the backend:

1. **Azure Function App** (Python on Linux) to serve as the API
2. **Azure Cosmos DB** (Table API) for persistent visitor count storage
3. **CORS configuration** to allow the frontend to call the API securely

This phase was one of the most educational parts of the project. Getting Cosmos DB's connection strings wired correctly, choosing between output bindings and direct SDK calls, and wrestling with Python runtime versions all required significant iteration. Each refactoring pass represented a deeper understanding of how Azure services interconnect.

The Function App evolved from a simple HTTP trigger to a properly structured application with:
- Named routes (`/api/visitor_count`)
- Anonymous authentication for public access
- Environment-driven configuration via Key Vault secrets
- Package deployment for reliable updates

## Security as a First-Class Citizen

I integrated **Checkov** — an infrastructure-as-code static analysis tool — directly into my smoke test pipeline. Every push is scanned for security misconfigurations before any resources are created.

The security journey was realistic and iterative:

- Initial scans flagged issues with storage account access, Cosmos DB network exposure, and missing encryption settings
- I addressed what I could immediately and documented the rest with `#checkov:skip` annotations that include explicit TODOs
- I hardened TLS settings, enabled retention policies, configured logging and metrics, and locked down network access where possible

This approach — **fix what you can, document what you can't, and never ignore a finding silently** — is exactly how security works in production environments.

## Testing: From Zero to Multi-Layer (August 2024 – August 2025)

Testing was a journey of its own:

### Unit Tests (Python/pytest)
I wrote unit tests for the visitor counter API using pytest, mocking the `TableServiceClient` to test business logic in isolation. Getting the import paths right across nested project structures took several attempts — a rite of passage for any Python developer working with Azure Functions locally and in CI.

### End-to-End Tests (Playwright)
I initially explored Cypress but migrated to **Playwright** for browser-based testing. The Playwright tests cover:
- **Frontend validation** — page structure, content rendering, 404 handling
- **API tests** — visitor count endpoint behavior
- **Performance tests** — response time baselines

The migration from Cypress to Playwright was quick to execute but represented significant research into which tool better fit my GitHub Actions environment and testing needs.

### Integration Testing via the Pipeline
The smoke test workflow itself acts as an integration test: if Terraform can successfully deploy all resources and the Playwright tests pass against live infrastructure, the entire stack is validated end-to-end.

## Key Vault Integration and Secrets Management (July–August 2025)

As the project matured, I moved sensitive configuration out of workflow environment variables and into **Azure Key Vault**. This was a significant refactoring effort:

- Terraform provisions Key Vault secrets for storage account details, API URLs, and connection strings
- Workflows retrieve secrets at runtime via Azure CLI
- Environment-specific Key Vault instances keep dev/test/prod isolated

The work was highly iterative — consolidating environment variables, improving Azure login integration, fixing quote handling, and adjusting blob upload paths. Secrets management is one of those areas where the details matter enormously.

## Monitoring and Alerting (August 2025)

Production infrastructure needs observability. I added **Azure Monitor** resources including:

- Metric alerts on the Function App (monitoring instance health)
- An action group with email and SMS notifications
- Webhook integration for external alert routing

This means if the visitor counter API goes down, I know about it — through multiple channels.

## The CDN Migration: Azure CDN → CloudFlare (August 2025)

One of my most impactful architectural changes came late in the project: **migrating from Azure CDN to CloudFlare**.

Microsoft announced that Azure CDN would begin its deprecation on August 15, 2025. The suggested migration path was Azure Front Door, but for a personal project the cost was prohibitive. I evaluated alternatives and landed on CloudFlare, which offered:

- Simpler DNS management with proxied records
- Automatic HTTPS with no certificate provisioning headaches
- A mature Terraform provider
- CDN functionality included at no additional cost

The migration itself was clean: add the CloudFlare provider, create DNS records pointing to Azure Storage's static website endpoint, and remove the Azure CDN resources entirely. It also simplified the Terraform configuration — the custom domain and certificate management that had been a recurring source of deployment inconsistencies with Azure CDN simply disappeared.

## Decoupling Frontend and Backend

As the project grew, it became clear that keeping the frontend and backend in a single repository was creating unnecessary coupling. The static resume site and the serverless API have fundamentally different deployment lifecycles, dependency chains, and testing strategies. Separating them into distinct repositories was a natural evolution — and the git history tells the story of how it happened.

### The Monolith Phase (June 2023 – Early 2025)

From the very first commit in June 2023, the backend repository held everything: HTML, CSS, JavaScript, certification images, Terraform configurations, Azure Function code, and CI/CD workflows. This was fine when the project was small, but as layers of infrastructure accumulated — Cosmos DB, Key Vault, monitoring, Checkov scans, Playwright tests — the repository became a tangle of unrelated concerns. A change to the resume's CSS had nothing to do with the Function App's Python runtime, yet they shared a repo, a commit history, and a deployment pipeline.

### Creating the Frontend Repository (January–February 2025)

In January 2025, I initialized this dedicated frontend repository with a README outlining the project's scope. A few weeks later, in February, I added the static website files — `index.html`, `resume.css`, `resume.js`, the 404 page, and all certification images — initially organized under a `static/` subdirectory. Almost immediately I refactored, flattening the files to the repository root for a simpler structure that mapped directly to the Azure Storage `$web` container.

At this point the frontend had its own home, but it didn't yet have its own deployment pipeline. The backend repository's workflows still handled uploading frontend files to blob storage by checking out the frontend repo as a secondary step.

### The Transitional Architecture (July 2025)

The backend workflows evolved to accommodate the split. In late July 2025, I enhanced the backend's deploy and smoke test workflows to check out the frontend repository using GitHub Actions' `repository` parameter, pull secrets from Key Vault, and upload the frontend files to Azure Storage. This cross-repo checkout pattern worked — the backend could still orchestrate a full deployment — but it meant the frontend's deployment was tightly coupled to the backend's pipeline. Any frontend-only change still required the backend workflow to run.

### Independent Frontend Deployment (August 2025)

On August 1, 2025, I added a dedicated **GitHub Actions deploy workflow** to this repository. The pipeline triggers on pushes to `master` and handles the full frontend deployment lifecycle independently:

1. **Checkout** the repository (with sparse checkout for images)
2. **Authenticate** to Azure via service principal credentials
3. **Inject the API URL** at deploy time by pulling it from Key Vault and using `sed` to replace a `{{API_URL}}` placeholder in `resume.js` — keeping the backend's endpoint configurable without hardcoding
4. **Upload** all files to the Azure Storage `$web` container using Key Vault–sourced storage credentials

The days that followed were a focused burst of iteration. I added the visitor count JavaScript functionality, wired it into the HTML, refactored the `updateVisitorCount` function for cleaner execution, enhanced the resume styling and 404 page with new fonts and CSS variables, and fixed Key Vault secret names in the workflow. Each change deployed independently — no backend pipeline involved.

When the CloudFlare migration landed on August 15, 2025, the frontend workflow's CDN purge step was simply removed. The deployment got *simpler*, not more complex — a direct benefit of the decoupled architecture.

### What the Split Achieved

- The **backend repository** owns the Azure Function App, Cosmos DB, Key Vault, monitoring, Terraform infrastructure, Checkov security scans, and Playwright end-to-end tests
- The **frontend repository** owns the HTML/CSS/JavaScript resume site, certification images, and its own deployment pipeline

This separation delivered concrete benefits: frontend changes deploy in seconds without running Terraform, the backend pipeline no longer needs to check out a second repository, and each repo's CI/CD is focused on its own concerns. It also mirrors the microservices pattern seen in production environments — independent services with independent lifecycles, connected only by a well-defined API contract (the `/api/visitor_count` endpoint and its CORS configuration).

## Adding a Build Log (March 2026)

With the resume site stable and the infrastructure humming, I turned to a question that had been nagging me: *where does this blog post actually live?* I'd been writing about the project, but the project itself had no place to publish writing. On March 13, 2026, I spent a focused session adding a **build log** — a lightweight, static blog system built entirely with vanilla JavaScript and Markdown.

### The Architecture

Rather than pulling in a static site generator like Hugo or Jekyll, I kept the approach consistent with the rest of the project: simple, hand-rolled, and easy to reason about. The blog lives in a `blog/` directory at the repository root and consists of:

- **`blog/index.html`** — the listing page, branded as "Build Log," with navigation back to the resume and links to GitHub/LinkedIn
- **`blog/post.html`** — a single-post viewer that loads content dynamically based on a `?post=` query parameter
- **`blog/blog-index.js`** — fetches a `posts.json` manifest, sorts posts newest-first, renders recent posts as cards, and groups older posts into a collapsible year-based archive
- **`blog/blog.js`** — loads an individual post's `index.md` file, parses it with the [marked](https://github.com/markedjs/marked) library (imported as an ES module from a CDN), and renders it as HTML
- **`blog/blog.css`** — styling for navigation, post cards, the archive toggle, and responsive layouts
- **`blog/posts/posts.json`** — the manifest: an array of post objects with `slug`, `title`, `date`, `readTime`, and `summary` fields

Posts themselves are stored as Markdown files under `blog/posts/{year}/{date-slug}/index.md`, with images co-located in an `img/` subdirectory alongside each post. This convention keeps assets organized and lets the renderer rewrite relative image paths (`img/photo.jpg` → `posts/2026/20260313-cloudresume/img/photo.jpg`) so they resolve correctly from the `post.html` viewer.

### Building It Iteratively

The feature came together in four commits, each building on the last:

1. **Initial blog scaffold** — created `index.html`, `post.html`, `blog.js`, and `blog.css` with basic Markdown loading via `marked`
2. **Dynamic post listing** — added `blog-index.js` and `posts.json` so the index page could discover and display posts without hardcoding links
3. **Rename and archive** — rebranded "Blog" to "Build Log" to better reflect the content's purpose, and added the collapsible archive with posts grouped by year
4. **Rendering hardening** — added slug validation (rejecting path traversal attempts like `..`), adjusted fetch paths for the nested directory structure, and implemented relative image URL rewriting in the Markdown renderer

### Design Decisions

A few choices are worth calling out:

- **No build step.** The blog requires no compilation, no bundling, no `npm install`. Markdown is parsed client-side using `marked` loaded from a CDN. Adding a new post means creating a Markdown file and adding an entry to `posts.json` — that's it.
- **Security-conscious rendering.** The post slug is validated against a strict regex (`/^[a-zA-Z0-9_/-]+$/`) and checked for `..` sequences before being used in a `fetch()` call. This prevents query-parameter manipulation from reading arbitrary files.
- **Progressive enhancement.** The listing page shows a "Loading posts..." message that's replaced once JavaScript fetches the manifest. If the fetch fails, the user sees a clear error rather than a blank page.
- **Consistent styling.** The blog pages import the existing `resume.css` alongside the new `blog.css`, sharing fonts (Roboto, Silkscreen), color variables, and the dark-themed aesthetic established by the resume site.

The first post published to the build log is this very blog post — the Azure Cloud Resume Challenge story, complete with a header image and the full development story rendered from Markdown.

[//]: # (Additional section needed after security upgrades)

## Looking Back: Themes and Takeaways

Looking back across two years of building this project, a few themes emerge:

**Iterative problem-solving.** Almost nothing worked on the first try. The gap between documentation and reality is where real learning happens, and I leaned into that gap deliberately.

**Progressive complexity.** The project grew from a single HTML file to a multi-service cloud architecture — but each layer was added deliberately, not all at once.

**Production-grade thinking.** Environment isolation, secrets management, security scanning, monitoring, and automated testing aren't resume padding — they're the practices that separate a demo from a deployable system.

**Willingness to refactor.** I migrated testing frameworks (Cypress → Playwright), CDN providers (Azure CDN → CloudFlare), and secrets management patterns (environment variables → Key Vault) when better solutions emerged. The best architecture is the one that evolves.

---

## Technical Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML, CSS, Bootstrap 5, JavaScript |
| **Hosting** | Azure Storage (Static Website) |
| **CDN/DNS** | CloudFlare (proxied DNS, automatic HTTPS) |
| **API** | Azure Functions (Python 3.12) |
| **Database** | Azure Cosmos DB (Table API) |
| **IaC** | Terraform (AzureRM + CloudFlare providers) |
| **CI/CD** | GitHub Actions (3-branch promotion model) |
| **Secrets** | Azure Key Vault |
| **Security** | Checkov static analysis |
| **Monitoring** | Azure Monitor (metric alerts, email/SMS/webhook) |
| **Testing** | pytest (unit), Playwright (E2E), pipeline integration tests |

---

## What's Next

[//]: # (This needs to be changed.)
The Cloud Resume Challenge gave me a framework, but the project has become a living platform for learning. Future improvements I'm considering include:

- **Flex Consumption migration.** The Linux Function App is currently configured for consumption-based pricing, which is EOL on September 30th, 2028. I have some time.
- **More Blog Posts.** There are quite a few projects I've worked on that I'd like to share. Getting those documented is one of my goals.
- **Decoupling API Code Deployments.** Infrastructure and API code deploys from the same repository. I'd like to decouple them the way the frontend was decoupled.
- **AWS and GCP Implementations.** Azure has been a great platform for me, and I'd like to explore other cloud providers to broaden my experience.

If you've made it this far, thanks for reading. The full source code is available on [GitHub](https://github.com/jhessig/Azure-CRC). Feel free to explore or reach out — I'm always happy to talk cloud.
