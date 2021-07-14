resource "aws_sfn_state_machine" "ping_state_machine" {
  name     = "ping-state-machine"
  role_arn = aws_iam_role.machine.arn
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
      End = {
        Type = "Pass"
        End  = true
      }
    }
  })
}
