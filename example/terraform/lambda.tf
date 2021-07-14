data "archive_file" "handler" {
  type        = "zip"
  source_file = "${path.module}/../dist/example.js"
  output_path = "${path.module}/.assets/handler.zip"
}

# Lambda for handling websocket events
resource "aws_lambda_function" "gateway_handler" {
  function_name    = "subscriptionless_gateway_event_handler"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "example.gatewayHandler"
  role             = aws_iam_role.gateway_handler.arn

  environment {
    variables = {
      CONNECTIONS_TABLE      = aws_dynamodb_table.connections.id
      SUBSCRIPTIONS_TABLE    = aws_dynamodb_table.subscriptions.id
      PING_STATE_MACHINE_ARN = aws_sfn_state_machine.ping_state_machine.arn
    }
  }
}

# Lambda for execution by ping/pong machine
resource "aws_lambda_function" "machine" {
  function_name    = "machine"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "example.stateMachineHandler"
  role             = aws_iam_role.state_machine_function.arn

  environment {
    variables = {
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.id
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.subscriptions.id
    }
  }
}

# Lambda for handling SNS events (optional)
resource "aws_lambda_function" "snsHandler" {
  function_name    = "snsHandler"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "example.snsHandler"
  role             = aws_iam_role.snsHandler.arn

  environment {
    variables = {
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.id
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.subscriptions.id
    }
  }
}

