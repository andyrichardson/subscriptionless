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

resource "aws_apigatewayv2_route" "connectRoute" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.defaultIntegration.id}"
}

resource "aws_apigatewayv2_route" "disconnectRoute" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.defaultIntegration.id}"
}


resource "aws_apigatewayv2_deployment" "ws" {
  api_id = aws_apigatewayv2_api.ws.id

  triggers = {
    redeployment = sha1(join(",", tolist([
      jsonencode(aws_apigatewayv2_integration.defaultIntegration),
      jsonencode(aws_apigatewayv2_route.defaultRoute),
    ])))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_stage" "ws" {
  api_id = aws_apigatewayv2_api.ws.id
  name   = "example"
}
