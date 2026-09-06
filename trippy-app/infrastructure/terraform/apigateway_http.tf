# HTTP API (API Gateway v2) is ~70% cheaper per request than REST API and has
# a lower latency profile — a good fit for a cheap-to-run serverless backend.
resource "aws_apigatewayv2_api" "http" {
  name          = "${local.name_prefix}-http"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_allow_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
  }
}

resource "aws_apigatewayv2_stage" "http" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

locals {
  # route key => logical Lambda function key
  http_routes = {
    "POST /trips"               = "create_trip"
    "GET /trips"                = "list_trips"
    "GET /trips/{tripId}"       = "get_trip"
    "POST /trips/{tripId}/plan" = "plan"
  }
}

resource "aws_apigatewayv2_integration" "http" {
  for_each = toset(values(local.http_routes))

  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.fn[each.value].invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "http" {
  for_each = local.http_routes

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.http[each.value].id}"
}

resource "aws_lambda_permission" "http" {
  for_each = toset(values(local.http_routes))

  statement_id  = "AllowInvokeFromHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn[each.value].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
