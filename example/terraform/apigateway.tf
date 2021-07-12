resource "aws_apigatewayv2_api" "ws" {
  name                       = "websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}


resource "aws_apigatewayv2_integration" "defaultIntegration" {
  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.wsHandler.invoke_arn
}

resource "aws_apigatewayv2_route" "defaultRoute" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.defaultIntegration.id}"
}

