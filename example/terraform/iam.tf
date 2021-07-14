# Allow DB access
resource "aws_iam_policy" "dynamodb" {
  name = "subscriptionless-dynamodb"
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
  name = "subscriptionless-apigateway"
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
  name = "lambda_logging_policy"
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

resource "aws_iam_role_policy_attachment" "logging_attatchment" {
  role       = aws_iam_role.wsHandler.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}


# Allow invocation of state machine
resource "aws_iam_policy" "statemachine" {
  name = "subscriptionless-statemachine"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["states:StartExecution"]
        Effect   = "Allow"
        Resource = [aws_sfn_state_machine.ping_state_machine.arn]
      }
    ]
  })
}

# Policy for ws handler
resource "aws_iam_role" "wsHandler" {
  name = "subscriptionless-wsHandler"
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
    aws_iam_policy.statemachine.arn,
    aws_iam_policy.lambda_logging.arn
  ]
}

# Policy for ping/pong
resource "aws_iam_role" "machine" {
  name = "subscriptionless-machine"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "states.amazonaws.com"
          ]
        }
      },
    ]
  })
  managed_policy_arns = [aws_iam_policy.apigateway.arn, aws_iam_policy.dynamodb.arn]
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
  managed_policy_arns = [aws_iam_policy.apigateway.arn, aws_iam_policy.dynamodb.arn]
}
