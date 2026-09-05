# Trippy — Terraform AWS Template

A reusable, **cost-optimized** Terraform template that provisions the Trippy
serverless backend on AWS. It mirrors the CDK stack in `../lib` but is designed
to be cheap to run and easy to fork for a new project.

Everything here is **pay-per-use and scales to zero** — an idle deployment
costs approximately nothing (only trivial storage/log charges).

## What it creates

| Resource | Purpose |
| --- | --- |
| 5 × DynamoDB tables (on-demand) | Trips, Messages, Itinerary, Connections, Users (+ GSIs) |
| 7 × Lambda functions (arm64) | `chat`, `plan`, `create_trip`, `get_trip`, `list_trips`, `connect`, `disconnect` |
| HTTP API (API Gateway v2) | REST endpoints (`/trips`, `/trips/{id}`, `/trips/{id}/plan`) |
| WebSocket API | Real-time group chat with Sam |
| IAM role + scoped policy | Least-privilege DynamoDB, Bedrock, Logs, ManageConnections |
| CloudWatch Log Groups | Short, configurable retention |

## Why it's cheap

This template deliberately **omits** the expensive always-on pieces from the
original design and leans entirely on serverless, scale-to-zero services:

- **No NAT Gateway / VPC** — the Lambdas only talk to DynamoDB and Bedrock over
  AWS's network, so they run outside a VPC. This removes a ~\$32/month NAT
  Gateway (plus per-GB data charges) that would otherwise run 24/7.
- **No ElastiCache/Redis** — the app code never used Redis, so the always-on
  `cache.t3.micro` (~\$12/month) is dropped entirely.
- **DynamoDB on-demand** — you pay per request, not for provisioned capacity;
  idle tables cost only pennies of storage.
- **arm64 (Graviton) Lambdas** — ~20% cheaper per ms than x86, and typically
  faster to boot for Node.
- **HTTP API instead of REST API** — ~70% cheaper per request.
- **No Lambda layer** — handlers are bundled with esbuild (`bundle.mjs`; the
  AWS SDK is already in the runtime), which simplifies packaging and speeds
  cold starts.
- **Short log retention** (`log_retention_days`, default 14) — avoids
  unbounded CloudWatch storage cost.
- **TTL** on messages and connections — old items self-delete, capping storage.

Rough idle cost: a few cents/month (DynamoDB storage + logs). Cost then scales
with actual traffic (Lambda invocations, API requests, Bedrock/Grok tokens).

## Prerequisites

- Terraform >= 1.5
- AWS credentials configured (e.g. `aws configure` or environment variables)
- Node.js 20+ (to bundle the Lambda handlers)
- For Claude: Amazon Bedrock model access enabled in your region.

## Usage

From the `infrastructure/` directory:

```bash
# 1. Install deps (provides esbuild for bundling) and build the Lambda zips
npm install
npm run tf:build

# 2. Initialize Terraform
terraform -chdir=terraform init

# 3. Review the plan (uses your AWS creds)
cp terraform/terraform.tfvars.example terraform/terraform.tfvars   # optional
terraform -chdir=terraform plan

# 4. Apply
terraform -chdir=terraform apply
```

Convenience wrappers (build + terraform in one step):

```bash
npm run tf:plan
npm run tf:apply
```

After apply, wire the app to the outputs:

```bash
terraform -chdir=terraform output http_api_url
terraform -chdir=terraform output websocket_url
```

## Using it as a template

- Change `project` / `environment` to rename and namespace all resources.
- Deploy multiple environments from the same code via separate workspaces or
  `-var environment=prod` with a distinct state key (see `backend.tf.example`).
- All tunables live in `variables.tf`; copy `terraform.tfvars.example` to get
  started.
- Secrets (`grok_api_key`, `openweather_api_key`, …) are `sensitive` and are
  best passed via `TF_VAR_*` environment variables or a secrets manager rather
  than committed to `terraform.tfvars`.

## Switching Sam's AI provider

```hcl
ai_provider = "grok"        # or "claude" (default)
# then: export TF_VAR_grok_api_key=xai-...
```

`claude` uses Amazon Bedrock via IAM (no key). `grok` calls the xAI API and
needs `grok_api_key`.

## Production hardening (optional, adds cost)

- `enable_point_in_time_recovery = true` and `dynamodb_deletion_protection = true`
- Lock `cors_allow_origins` to your real origins.
- Use remote state (`backend.tf.example`).
- Consider provisioned concurrency on `chat`/`plan` only if cold starts matter.

## Relationship to the CDK stack

`../lib` (CDK) and this template describe the same application. Pick one as the
source of truth for a given deployment; don't apply both to the same account
and region with the same names.
