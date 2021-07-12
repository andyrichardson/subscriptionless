data "aws_iam_policy_document" "state_machine_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = [
        "states.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "state_machine" {
  name               = "state_machine"
  assume_role_policy = data.aws_iam_policy_document.state_machine_assume.json

  inline_policy {
    policy = aws_iam_policy.apigateway.arn
  }

  inline_policy {
    policy = aws_iam_policy.dynamodb.arn
  }
}



resource "aws_sfn_state_machine" "ping_state_machine" {
  name     = "my-state-machine"
  role_arn = aws_iam_role.state_machine.arn
  definition = jsonencode({
    StartAt = "Wait"
    States = {
      Wait = {
        Type        = "Wait"
        SecondsPath = "$.seconds"
        Next        = "Eval"
      }
      Eval = {
        Type     = "Task"
        Resource = aws_lambda_function.machine.arn
        Next     = "Choose"
      }
      Choose = {
        Type = "Choice"
        Choices = [{
          Not = {
            Variable     = "$.state"
            StringEquals = "ABORT"
          }
          Next = "Wait"
        }]
        Default = "End"
      }
    }
  })
}
