data "archive_file" "handler" {
  type        = "zip"
  source_file = "${path.module}/../dist/example.js"
  output_path = "${path.module}/.assets/handler.zip"
}

# Lambda for handling websocket events
resource "aws_lambda_function" "wsHandler" {
  function_name    = "wsHandler"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "exports.wsHandler"
  role             = aws_iam_role.wsHandler.arn

  environment {
    variables = {
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.subscriptions.arn
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.arn
    }
  }
}

# Lambda for execution by ping/pong machine
resource "aws_lambda_function" "machine" {
  function_name    = "machine"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "exports.machine"
  role             = aws_iam_role.machine.arn

  environment {
    variables = {
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.subscriptions.arn
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.arn
    }
  }
}

# Lambda for handling SNS events (optional)
resource "aws_lambda_function" "snsHandler" {
  function_name    = "snsHandler"
  runtime          = "nodejs14.x"
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  handler          = "exports.snsHandler"
  role             = aws_iam_role.snsHandler.arn

  environment {
    variables = {
      SUBSCRIPTIONS_TABLE = aws_dynamodb_table.subscriptions.arn
      CONNECTIONS_TABLE   = aws_dynamodb_table.connections.arn
    }
  }
}

