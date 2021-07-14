# Allow DB access
resource "aws_iam_policy" "dynamodb" {
  name = "subscriptionless_dynamodb"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["dynamodb:*"]
        Effect = "Allow"
        Resource = [
          "${aws_dynamodb_table.connections.arn}*",
          "${aws_dynamodb_table.subscriptions.arn}*"
        ]
      }
    ]
  })
}

# Allow WebSocket API access
resource "aws_iam_policy" "apigateway" {
  name = "subscriptionless_apigateway"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["execute-api:*"]
        Effect = "Allow"
        Resource = [
          aws_apigatewayv2_api.ws.execution_arn,
          "${aws_apigatewayv2_api.ws.execution_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_logging" {
  name = "subscriptionless_lambda_logging"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["logs:*"]
        Effect   = "Allow"
        Resource = ["arn:aws:logs:*:*:*"]
      }
    ]
  })
}

# Allow invocation of state machine
resource "aws_iam_policy" "state_machine_invoke" {
  name = "subscriptionless_state_machine_invoke"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["states:StartExecution"]
        Effect = "Allow"
        Resource = [
          aws_sfn_state_machine.ping_state_machine.arn
        ]
      },
    ]
  })
}
resource "aws_iam_policy" "state_machine_lambda_invoke" {
  name = "subscriptionless_state_machine_lambda_invoke"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["lambda:InvokeFunction"]
        Effect   = "Allow"
        Resource = [aws_lambda_function.machine.arn]
      },
    ]
  })
}

# Policy for ws handler
resource "aws_iam_role" "gateway_handler" {
  name = "subscriptionless_gateway_handler"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com"
          ]
        }
      },
    ]
  })
  managed_policy_arns = [
    aws_iam_policy.apigateway.arn,
    aws_iam_policy.dynamodb.arn,
    aws_iam_policy.state_machine_invoke.arn,
    aws_iam_policy.lambda_logging.arn
  ]
}

# Policy for ping/pong
resource "aws_iam_role" "state_machine" {
  name = "subscriptionless_state_machine"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "states.amazonaws.com"
          ]
        }
      },
    ]
  })
  managed_policy_arns = [
    aws_iam_policy.state_machine_lambda_invoke.arn
  ]
}

resource "aws_iam_role" "state_machine_function" {
  name = "subscriptionless_state_machine_function"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
          ]
        }
      },
    ]
  })
  managed_policy_arns = [
    aws_iam_policy.apigateway.arn,
    aws_iam_policy.dynamodb.arn
  ]
}


# Policy for sns handler
resource "aws_iam_role" "snsHandler" {
  name = "subscriptionless-snsHandler"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = [
            "lambda.amazonaws.com"
          ]
        }
      },
    ]
  })
  managed_policy_arns = [
    aws_iam_policy.apigateway.arn,
    aws_iam_policy.dynamodb.arn
  ]
}
