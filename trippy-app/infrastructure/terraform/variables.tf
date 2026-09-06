variable "project" {
  description = "Short project name used as a prefix for resource names."
  type        = string
  default     = "trippy"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Extra tags merged into the provider default_tags."
  type        = map(string)
  default     = {}
}

# ---------------------------------------------------------------------------
# Lambda
# ---------------------------------------------------------------------------

variable "lambda_runtime" {
  description = "Lambda Node.js runtime."
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_architecture" {
  description = "Lambda CPU architecture. arm64 (Graviton) is ~20% cheaper and faster for this workload."
  type        = string
  default     = "arm64"

  validation {
    condition     = contains(["arm64", "x86_64"], var.lambda_architecture)
    error_message = "lambda_architecture must be either arm64 or x86_64."
  }
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention. Short retention keeps logging costs near zero."
  type        = number
  default     = 14
}

# ---------------------------------------------------------------------------
# DynamoDB
# ---------------------------------------------------------------------------

variable "dynamodb_billing_mode" {
  description = "PAY_PER_REQUEST (on-demand, scales to zero) or PROVISIONED."
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "dynamodb_billing_mode must be PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "enable_point_in_time_recovery" {
  description = "Enable DynamoDB PITR. Adds cost per GB; recommended for prod, off for cheap dev."
  type        = bool
  default     = false
}

variable "dynamodb_deletion_protection" {
  description = "Protect tables from accidental deletion. Recommended true for prod."
  type        = bool
  default     = false
}

variable "message_ttl_enabled" {
  description = "Enable TTL on the messages table (auto-expires old chat messages to save storage)."
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# AI provider (Sam)
# ---------------------------------------------------------------------------

variable "ai_provider" {
  description = "Default AI provider for Sam: claude (Bedrock) or grok (xAI)."
  type        = string
  default     = "claude"
}

variable "bedrock_model_ids" {
  description = "Bedrock foundation model IDs the Lambdas may invoke (used to scope the IAM policy)."
  type        = list(string)
  default = [
    "anthropic.claude-3-5-sonnet-20241022-v2:0",
    "anthropic.claude-3-opus-20240229-v1:0",
    "anthropic.claude-3-5-haiku-20241022-v1:0",
  ]
}

variable "grok_api_key" {
  description = "xAI API key (only needed when ai_provider = grok). Prefer passing via TF_VAR_grok_api_key or a secret store."
  type        = string
  default     = ""
  sensitive   = true
}

variable "grok_model" {
  description = "Grok model id override (default handled in app code)."
  type        = string
  default     = ""
}

variable "grok_planning_model" {
  description = "Grok planning model id override (default handled in app code)."
  type        = string
  default     = ""
}

variable "grok_api_url" {
  description = "xAI endpoint override (default handled in app code)."
  type        = string
  default     = ""
}

# ---------------------------------------------------------------------------
# External APIs
# ---------------------------------------------------------------------------

variable "weather_provider" {
  description = "Backend weather source. \"open-meteo\" (free, keyless, default) or \"mock\". The iOS app uses Apple WeatherKit natively."
  type        = string
  default     = "open-meteo"
}

variable "graphhopper_api_key" {
  description = "GraphHopper API key (optional; used for server-side routing)."
  type        = string
  default     = ""
  sensitive   = true
}

# ---------------------------------------------------------------------------
# API Gateway
# ---------------------------------------------------------------------------

variable "cors_allow_origins" {
  description = "Allowed CORS origins for the HTTP API. Lock this down in production."
  type        = list(string)
  default     = ["*"]
}

variable "websocket_stage_name" {
  description = "Stage name for the WebSocket API."
  type        = string
  default     = "production"
}
