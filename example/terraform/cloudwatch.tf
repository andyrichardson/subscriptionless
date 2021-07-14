resource "aws_cloudwatch_log_group" "gateway_handler" {
  name              = "/aws/lambda/${aws_lambda_function.gateway_handler.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "websocket_api" {
  name              = "/aws/apigateway/websocket-api"
  retention_in_days = 14
}
