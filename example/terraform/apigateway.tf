# Account-level throttle burst quota. Quota codes are identical across regions.
# `aws service-quotas list-service-quotas --service apigateway`
data "aws_servicequotas_service_quota" "throttling_burst_limit" {
  service_code = "apigateway"
  quota_code   = "L-CDF5615A"
}
# Account-level throttle rate quota. Quota codes are identical across regions.
# `aws service-quotas list-service-quotas --service apigateway`
data "aws_servicequotas_service_quota" "throttling_rate_limit" {
  service_code = "apigateway"
  quota_code   = "L-8A5B8E43"
}

resource "aws_apigatewayv2_api" "ws" {
  name                       = "websocket-api"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.ws.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.default_integration.id}"
}

resource "aws_apigatewayv2_integration" "default_integration" {
  api_id           = aws_apigatewayv2_api.ws.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.gateway_handler.invoke_arn
}

resource "aws_lambda_permission" "apigateway_invoke_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.gateway_handler.function_name
  principal     = "apigateway.amazonaws.com"
}

resource "aws_apigatewayv2_deployment" "ws" {
  api_id = aws_apigatewayv2_api.ws.id

  triggers = {
    redeployment = sha1(join(",", tolist([
      jsonencode(aws_apigatewayv2_integration.default_integration),
      jsonencode(aws_apigatewayv2_route.default_route),
      jsonencode(aws_apigatewayv2_route.connect_route),
      jsonencode(aws_apigatewayv2_route.disconnect_route),
    ])))
  }

  depends_on = [
    aws_apigatewayv2_route.default_route,
    aws_apigatewayv2_route.connect_route,
    aws_apigatewayv2_route.disconnect_route
  ]
}

resource "aws_apigatewayv2_stage" "ws" {
  api_id        = aws_apigatewayv2_api.ws.id
  name          = "example"
  deployment_id = aws_apigatewayv2_deployment.ws.id

  default_route_settings {
    logging_level            = "INFO"
    detailed_metrics_enabled = true
    throttling_burst_limit   = coalesce(1000, data.aws_servicequotas_service_quota.throttling_burst_limit.value)
    throttling_rate_limit    = coalesce(5000, data.aws_servicequotas_service_quota.throttling_rate_limit.value)
  }

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.websocket_api.arn
    format = jsonencode({
      requestId    = "$context.requestId"
      ip           = "$context.identity.sourceIp"
      caller       = "$context.identity.caller"
      user         = "$context.identity.user"
      requestTime  = "$context.requestTime"
      eventType    = "$context.eventType"
      routeKey     = "$context.routeKey"
      status       = "$context.status"
      connectionId = "$context.connectionId"
      errorMessage = "$context.integrationErrorMessage"
    })
  }
}
