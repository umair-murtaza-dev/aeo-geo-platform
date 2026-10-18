-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('NONE', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'CLIENT_VIEWER');

-- CreateEnum
CREATE TYPE "OrganizationKind" AS ENUM ('AGENCY', 'BUSINESS');

-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScheduleCadence" AS ENUM ('MANUAL', 'HOURLY', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ObservationSurface" AS ENUM ('MODEL_API', 'GROUNDED_SEARCH', 'CONSUMER_SEARCH');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "AuditJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('OPEN', 'ACCEPTED', 'DISMISSED', 'IMPLEMENTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CohortRole" AS ENUM ('BASELINE', 'CONTROL', 'TREATMENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'CSV');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMPTZ(6),
    "image" TEXT,
    "password_hash" TEXT,
    "platform_role" "PlatformRole" NOT NULL DEFAULT 'NONE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "OrganizationKind" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_workspaces" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_memberships" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_domains" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "hostname" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brand_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_locations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "region" TEXT,
    "city" TEXT,
    "locale" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brand_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_prompts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "PromptStatus" NOT NULL DEFAULT 'DRAFT',
    "current_version_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monitoring_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_versions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "prompt_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prompt_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_schedules" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "prompt_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "location_id" UUID,
    "provider_id" TEXT,
    "cadence" "ScheduleCadence" NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT,
    "surface" "ObservationSurface",
    "engine_id" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "next_run_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monitoring_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_runs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "schedule_id" UUID,
    "prompt_version_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotency_key" TEXT NOT NULL,
    "provider_id" TEXT,
    "surface" "ObservationSurface",
    "engine_id" TEXT,
    "locale" TEXT,
    "scheduled_for" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "error_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "monitoring_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_providers" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_secret_refs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "provider_id" TEXT NOT NULL,
    "secret_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "provider_secret_refs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_observations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "provider_id" TEXT NOT NULL,
    "surface" "ObservationSurface" NOT NULL,
    "engine_id" TEXT NOT NULL,
    "locale" TEXT,
    "market" TEXT,
    "executed_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "prompt_version_id" UUID NOT NULL,
    "raw_response_ref" TEXT,
    "raw_response_sha256" CHAR(64),
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "total_tokens" INTEGER,
    "estimated_cost_amount" DECIMAL(18,6),
    "estimated_cost_currency" CHAR(3),
    "actual_cost_amount" DECIMAL(18,6),
    "actual_cost_currency" CHAR(3),
    "latency_ms" INTEGER,
    "error_category" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_citations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "domain" TEXT,
    "position" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observation_citations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_mentions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "brand_id" UUID,
    "competitor_id" UUID,
    "mentioned" BOOLEAN NOT NULL,
    "excerpt" TEXT,
    "position" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "metric" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_jobs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "domain_id" UUID,
    "status" "AuditJobStatus" NOT NULL DEFAULT 'QUEUED',
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "audit_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_findings" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "audit_job_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "evidence_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optimization_recommendations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "finding_id" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "optimization_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_tasks" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "recommendation_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "implementation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_interventions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "experiment_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "applied_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "experiment_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_cohorts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "experiment_id" UUID NOT NULL,
    "role" "CohortRole" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "experiment_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_observations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "cohort_id" UUID NOT NULL,
    "observation_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_results" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "experiment_id" UUID NOT NULL,
    "metric" TEXT NOT NULL,
    "estimate" DECIMAL(18,6) NOT NULL,
    "lower_bound" DECIMAL(18,6),
    "upper_bound" DECIMAL(18,6),
    "confidence_level" DECIMAL(5,4),
    "computed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "brand_id" UUID,
    "title" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "period_start" TIMESTAMPTZ(6),
    "period_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "storage_ref" TEXT,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" CHAR(3) NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "limit_int" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "current_period_start" TIMESTAMPTZ(6),
    "current_period_end" TIMESTAMPTZ(6),
    "stripe_customer_ref" TEXT,
    "stripe_subscription_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount_minor" INTEGER,
    "currency" CHAR(3),
    "external_ref" TEXT,
    "payload" JSONB,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organization_memberships_user_id_idx" ON "organization_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organization_id_user_id_key" ON "organization_memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "client_workspaces_organization_id_idx" ON "client_workspaces"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_workspaces_organization_id_id_key" ON "client_workspaces"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "client_workspaces_organization_id_slug_key" ON "client_workspaces"("organization_id", "slug");

-- CreateIndex
CREATE INDEX "workspace_memberships_user_id_idx" ON "workspace_memberships"("user_id");

-- CreateIndex
CREATE INDEX "workspace_memberships_organization_id_idx" ON "workspace_memberships"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberships_workspace_id_user_id_key" ON "workspace_memberships"("workspace_id", "user_id");

-- CreateIndex
CREATE INDEX "brands_organization_id_idx" ON "brands"("organization_id");

-- CreateIndex
CREATE INDEX "brands_workspace_id_idx" ON "brands"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_organization_id_id_key" ON "brands"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_workspace_id_slug_key" ON "brands"("workspace_id", "slug");

-- CreateIndex
CREATE INDEX "brand_domains_organization_id_idx" ON "brand_domains"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_domains_brand_id_hostname_key" ON "brand_domains"("brand_id", "hostname");

-- CreateIndex
CREATE INDEX "brand_locations_organization_id_idx" ON "brand_locations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_locations_organization_id_id_key" ON "brand_locations"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_locations_brand_id_name_key" ON "brand_locations"("brand_id", "name");

-- CreateIndex
CREATE INDEX "competitors_organization_id_idx" ON "competitors"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_brand_id_name_key" ON "competitors"("brand_id", "name");

-- CreateIndex
CREATE INDEX "monitoring_prompts_organization_id_idx" ON "monitoring_prompts"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_prompts_organization_id_id_key" ON "monitoring_prompts"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_prompts_brand_id_slug_key" ON "monitoring_prompts"("brand_id", "slug");

-- CreateIndex
CREATE INDEX "prompt_versions_organization_id_idx" ON "prompt_versions"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_prompt_id_version_key" ON "prompt_versions"("prompt_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_versions_organization_id_id_key" ON "prompt_versions"("organization_id", "id");

-- CreateIndex
CREATE INDEX "monitoring_schedules_organization_id_enabled_next_run_at_idx" ON "monitoring_schedules"("organization_id", "enabled", "next_run_at");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_runs_idempotency_key_key" ON "monitoring_runs"("idempotency_key");

-- CreateIndex
CREATE INDEX "monitoring_runs_organization_id_created_at_idx" ON "monitoring_runs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_runs_brand_id_created_at_idx" ON "monitoring_runs"("brand_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_runs_organization_id_id_key" ON "monitoring_runs"("organization_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_secret_refs_organization_id_provider_id_key" ON "provider_secret_refs"("organization_id", "provider_id");

-- CreateIndex
CREATE INDEX "ai_observations_organization_id_executed_at_idx" ON "ai_observations"("organization_id", "executed_at");

-- CreateIndex
CREATE INDEX "ai_observations_brand_id_executed_at_idx" ON "ai_observations"("brand_id", "executed_at");

-- CreateIndex
CREATE INDEX "ai_observations_run_id_idx" ON "ai_observations"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_observations_organization_id_id_key" ON "ai_observations"("organization_id", "id");

-- CreateIndex
CREATE INDEX "observation_citations_organization_id_idx" ON "observation_citations"("organization_id");

-- CreateIndex
CREATE INDEX "observation_citations_observation_id_idx" ON "observation_citations"("observation_id");

-- CreateIndex
CREATE INDEX "brand_mentions_organization_id_idx" ON "brand_mentions"("organization_id");

-- CreateIndex
CREATE INDEX "brand_mentions_observation_id_idx" ON "brand_mentions"("observation_id");

-- CreateIndex
CREATE INDEX "brand_mentions_brand_id_idx" ON "brand_mentions"("brand_id");

-- CreateIndex
CREATE INDEX "usage_records_organization_id_metric_occurred_at_idx" ON "usage_records"("organization_id", "metric", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_jobs_organization_id_created_at_idx" ON "audit_jobs"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "audit_jobs_organization_id_id_key" ON "audit_jobs"("organization_id", "id");

-- CreateIndex
CREATE INDEX "audit_findings_audit_job_id_idx" ON "audit_findings"("audit_job_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_findings_organization_id_id_key" ON "audit_findings"("organization_id", "id");

-- CreateIndex
CREATE INDEX "optimization_recommendations_organization_id_idx" ON "optimization_recommendations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "optimization_recommendations_organization_id_id_key" ON "optimization_recommendations"("organization_id", "id");

-- CreateIndex
CREATE INDEX "implementation_tasks_organization_id_idx" ON "implementation_tasks"("organization_id");

-- CreateIndex
CREATE INDEX "experiments_organization_id_idx" ON "experiments"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_organization_id_id_key" ON "experiments"("organization_id", "id");

-- CreateIndex
CREATE INDEX "experiment_interventions_organization_id_idx" ON "experiment_interventions"("organization_id");

-- CreateIndex
CREATE INDEX "experiment_cohorts_experiment_id_idx" ON "experiment_cohorts"("experiment_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_cohorts_organization_id_id_key" ON "experiment_cohorts"("organization_id", "id");

-- CreateIndex
CREATE INDEX "experiment_observations_organization_id_idx" ON "experiment_observations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_observations_cohort_id_observation_id_key" ON "experiment_observations"("cohort_id", "observation_id");

-- CreateIndex
CREATE INDEX "experiment_results_experiment_id_computed_at_idx" ON "experiment_results"("experiment_id", "computed_at");

-- CreateIndex
CREATE INDEX "reports_organization_id_idx" ON "reports"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "reports_organization_id_id_key" ON "reports"("organization_id", "id");

-- CreateIndex
CREATE INDEX "report_exports_organization_id_idx" ON "report_exports"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_plan_id_key_key" ON "entitlements"("plan_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organization_id_key" ON "subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE INDEX "billing_events_organization_id_occurred_at_idx" ON "billing_events"("organization_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_workspaces" ADD CONSTRAINT "client_workspaces_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_organization_id_workspace_id_fkey" FOREIGN KEY ("organization_id", "workspace_id") REFERENCES "client_workspaces"("organization_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_organization_id_workspace_id_fkey" FOREIGN KEY ("organization_id", "workspace_id") REFERENCES "client_workspaces"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_domains" ADD CONSTRAINT "brand_domains_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_locations" ADD CONSTRAINT "brand_locations_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_prompts" ADD CONSTRAINT "monitoring_prompts_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_organization_id_prompt_id_fkey" FOREIGN KEY ("organization_id", "prompt_id") REFERENCES "monitoring_prompts"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_versions" ADD CONSTRAINT "prompt_versions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_schedules" ADD CONSTRAINT "monitoring_schedules_organization_id_prompt_id_fkey" FOREIGN KEY ("organization_id", "prompt_id") REFERENCES "monitoring_prompts"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_schedules" ADD CONSTRAINT "monitoring_schedules_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_schedules" ADD CONSTRAINT "monitoring_schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "brand_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_schedules" ADD CONSTRAINT "monitoring_schedules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_runs" ADD CONSTRAINT "monitoring_runs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "monitoring_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_runs" ADD CONSTRAINT "monitoring_runs_organization_id_prompt_version_id_fkey" FOREIGN KEY ("organization_id", "prompt_version_id") REFERENCES "prompt_versions"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_runs" ADD CONSTRAINT "monitoring_runs_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_runs" ADD CONSTRAINT "monitoring_runs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_secret_refs" ADD CONSTRAINT "provider_secret_refs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_secret_refs" ADD CONSTRAINT "provider_secret_refs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_organization_id_run_id_fkey" FOREIGN KEY ("organization_id", "run_id") REFERENCES "monitoring_runs"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_observations" ADD CONSTRAINT "ai_observations_organization_id_prompt_version_id_fkey" FOREIGN KEY ("organization_id", "prompt_version_id") REFERENCES "prompt_versions"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_citations" ADD CONSTRAINT "observation_citations_organization_id_observation_id_fkey" FOREIGN KEY ("organization_id", "observation_id") REFERENCES "ai_observations"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_organization_id_observation_id_fkey" FOREIGN KEY ("organization_id", "observation_id") REFERENCES "ai_observations"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_jobs" ADD CONSTRAINT "audit_jobs_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_organization_id_audit_job_id_fkey" FOREIGN KEY ("organization_id", "audit_job_id") REFERENCES "audit_jobs"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "optimization_recommendations" ADD CONSTRAINT "optimization_recommendations_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "audit_findings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_tasks" ADD CONSTRAINT "implementation_tasks_organization_id_recommendation_id_fkey" FOREIGN KEY ("organization_id", "recommendation_id") REFERENCES "optimization_recommendations"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_organization_id_brand_id_fkey" FOREIGN KEY ("organization_id", "brand_id") REFERENCES "brands"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_interventions" ADD CONSTRAINT "experiment_interventions_organization_id_experiment_id_fkey" FOREIGN KEY ("organization_id", "experiment_id") REFERENCES "experiments"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_cohorts" ADD CONSTRAINT "experiment_cohorts_organization_id_experiment_id_fkey" FOREIGN KEY ("organization_id", "experiment_id") REFERENCES "experiments"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_observations" ADD CONSTRAINT "experiment_observations_organization_id_cohort_id_fkey" FOREIGN KEY ("organization_id", "cohort_id") REFERENCES "experiment_cohorts"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_observations" ADD CONSTRAINT "experiment_observations_organization_id_observation_id_fkey" FOREIGN KEY ("organization_id", "observation_id") REFERENCES "ai_observations"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_organization_id_experiment_id_fkey" FOREIGN KEY ("organization_id", "experiment_id") REFERENCES "experiments"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_organization_id_workspace_id_fkey" FOREIGN KEY ("organization_id", "workspace_id") REFERENCES "client_workspaces"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_organization_id_report_id_fkey" FOREIGN KEY ("organization_id", "report_id") REFERENCES "reports"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One primary hostname per brand. Prisma cannot express a partial unique index.
CREATE UNIQUE INDEX "brand_domains_one_primary_idx" ON "brand_domains" ("brand_id") WHERE "is_primary" = true;

-- A mention refers to the tracked brand, a competitor, or neither. Not both.
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_single_target_chk" CHECK (
  NOT ("brand_id" IS NOT NULL AND "competitor_id" IS NOT NULL)
);

