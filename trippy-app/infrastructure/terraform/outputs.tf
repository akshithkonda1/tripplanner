output "http_api_url" {
  description = "Base URL for the REST (HTTP) API. Set this as HTTP_API_URL in the app."
  value       = aws_apigatewayv2_stage.http.invoke_url
}

output "websocket_url" {
  description = "wss:// URL for the WebSocket API. Set this as WS_API_URL in the app."
  value       = "${aws_apigatewayv2_api.ws.api_endpoint}/${aws_apigatewayv2_stage.ws.name}"
}

output "dynamodb_tables" {
  description = "Map of DynamoDB table names created for the app."
  value       = local.tables
}

output "lambda_function_names" {
  description = "Deployed Lambda function names, keyed by logical role."
  value       = { for k, fn in aws_lambda_function.fn : k => fn.function_name }
}

output "region" {
  description = "AWS region the stack is deployed in."
  value       = local.region
}
