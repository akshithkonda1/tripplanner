# On-demand (PAY_PER_REQUEST) tables scale to zero when idle — you pay only
# for the requests and storage you actually use, which keeps a low-traffic app
# nearly free.

resource "aws_dynamodb_table" "trips" {
  name         = local.tables.trips
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "createdAt"
    type = "N"
  }

  # Query a user's trips.
  global_secondary_index {
    name            = "UserTripsIndex"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection
}

resource "aws_dynamodb_table" "messages" {
  name         = local.tables.messages
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  # Auto-expire old chat messages to avoid unbounded storage growth.
  ttl {
    attribute_name = "ttl"
    enabled        = var.message_ttl_enabled
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection
}

resource "aws_dynamodb_table" "itinerary" {
  name         = local.tables.itinerary
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection
}

resource "aws_dynamodb_table" "connections" {
  name         = local.tables.connections
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }
  attribute {
    name = "tripId"
    type = "S"
  }

  # Query all live connections for a trip (used to broadcast Sam's replies).
  global_secondary_index {
    name            = "TripConnectionsIndex"
    hash_key        = "tripId"
    projection_type = "ALL"
  }

  # Stale WebSocket connections self-clean via TTL.
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection
}

resource "aws_dynamodb_table" "users" {
  name         = local.tables.users
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  deletion_protection_enabled = var.dynamodb_deletion_protection
}
