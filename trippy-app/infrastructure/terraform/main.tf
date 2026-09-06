data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name_prefix = "${var.project}-${var.environment}"
  account_id  = data.aws_caller_identity.current.account_id
  region      = data.aws_region.current.name

  # DynamoDB table names (kept close to the original CDK stack).
  tables = {
    trips       = "${local.name_prefix}-trips"
    messages    = "${local.name_prefix}-messages"
    itinerary   = "${local.name_prefix}-itinerary"
    connections = "${local.name_prefix}-connections"
    users       = "${local.name_prefix}-users"
  }

  # Environment variables shared by every Lambda. NOTE: AWS_REGION is injected
  # by the Lambda runtime automatically and must not be set here.
  common_lambda_env = {
    TRIPS_TABLE         = aws_dynamodb_table.trips.name
    MESSAGES_TABLE      = aws_dynamodb_table.messages.name
    ITINERARY_TABLE     = aws_dynamodb_table.itinerary.name
    CONNECTIONS_TABLE   = aws_dynamodb_table.connections.name
    USERS_TABLE         = aws_dynamodb_table.users.name
    AI_PROVIDER         = var.ai_provider
    GROK_API_KEY        = var.grok_api_key
    GROK_MODEL          = var.grok_model
    GROK_PLANNING_MODEL = var.grok_planning_model
    GROK_API_URL        = var.grok_api_url
    WEATHER_PROVIDER    = var.weather_provider
    GRAPHHOPPER_API_KEY = var.graphhopper_api_key
  }

  # One entry per Lambda function. `source` maps to a bundled artifact
  # (see build/build.mjs); several functions can share one bundle by pointing
  # at different named exports via `handler`.
  functions = {
    chat = {
      source  = "chatHandler"
      handler = "index.handler"
      memory  = 512
      timeout = 30
    }
    plan = {
      source  = "tripPlanner"
      handler = "index.handler"
      memory  = 1024
      timeout = 60
    }
    create_trip = {
      source  = "tripManagement"
      handler = "index.createTrip"
      memory  = 256
      timeout = 15
    }
    get_trip = {
      source  = "tripManagement"
      handler = "index.getTrip"
      memory  = 256
      timeout = 15
    }
    list_trips = {
      source  = "tripManagement"
      handler = "index.getUserTrips"
      memory  = 256
      timeout = 15
    }
    connect = {
      source  = "connectionHandler"
      handler = "index.connectHandler"
      memory  = 256
      timeout = 15
    }
    disconnect = {
      source  = "connectionHandler"
      handler = "index.disconnectHandler"
      memory  = 256
      timeout = 15
    }
  }

  # Distinct bundles to build/zip.
  bundles = toset([for f in local.functions : f.source])

  # ARNs of all tables + their indexes, for the DynamoDB IAM policy.
  table_arns = [
    aws_dynamodb_table.trips.arn,
    aws_dynamodb_table.messages.arn,
    aws_dynamodb_table.itinerary.arn,
    aws_dynamodb_table.connections.arn,
    aws_dynamodb_table.users.arn,
  ]
  table_index_arns = [for arn in local.table_arns : "${arn}/index/*"]
}
