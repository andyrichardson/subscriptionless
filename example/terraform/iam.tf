# Allow DB access
resource "aws_iam_policy" "dynamodb" {
  name = "subscriptionless-dynamodb"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["dynamodb:*"]
        Effect   = "Allow"
        Resource = [aws_dynamodb_table.connections.arn, aws_dynamodb_table.subscriptions.arn]
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
        Action   = ["execute-api:*"]
        Effect   = "Allow"
        Resource = [aws_apigatewayv2_api.ws]
      }
    ]
  })
}

# Allow invocation of state machine
resource "aws_iam_policy" "statemachine" {
  name = "subscriptionless-apigateway"
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
  name = "serverless_example_lambda"
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


  inline_policy {
    policy = aws_iam_policy.apigateway.arn
  }

  inline_policy {
    policy = aws_iam_policy.dynamodb.arn
  }

  inline_policy {
    policy = aws_iam_policy.statemachine.arn
  }
}

# Policy for ping/pong
resource "aws_iam_role" "machine" {
  name = "serverless_example_lambda"
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


  inline_policy {
    policy = aws_iam_policy.apigateway.arn
  }

  inline_policy {
    policy = aws_iam_policy.dynamodb.arn
  }
}

# Policy for sns handler
resource "aws_iam_role" "snsHandler" {
  name = "serverless_example_lambda"
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

  inline_policy {
    policy = aws_iam_policy.apigateway.arn
  }

  inline_policy {
    policy = aws_iam_policy.dynamodb.arn
  }
}
