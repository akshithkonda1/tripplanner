# WebSocket API powers real-time group chat with Sam. Pay-per-message +
# connection-minute pricing, so it costs nothing while idle.
resource "aws_apigatewayv2_api" "ws" {
  name                       = "${local.name_prefix}-ws"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_stage" "ws" {
  api_id      = aws_apigatewayv2_api.ws.id
  name        = var.websocket_stage_name
  auto_deploy = true
}

locals {
  # WebSocket route key => logical Lambda function key.
  # $default handles data messages (the chat handler switches on the action).
  ws_routes = {
    "$connect"    = "connect"
    "$disconnect" = "disconnect"
    "$default"    = "chat"
  }
}

resource "aws_apigatewayv2_integration" "ws" {
  for_each = toset(values(local.ws_routes))

  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.fn[each.value].invoke_arn
}

resource "aws_apigatewayv2_route" "ws" {
  for_each = local.ws_routes

  api_id    = aws_apigatewayv2_api.ws.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.ws[each.value].id}"
}

resource "aws_lambda_permission" "ws" {
  for_each = toset(values(local.ws_routes))

  statement_id  = "AllowInvokeFromWebSocketApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn[each.value].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws.execution_arn}/*/*"
}
