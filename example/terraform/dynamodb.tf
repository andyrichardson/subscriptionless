# Connections state
resource "aws_dynamodb_table" "connections" {
  name           = "subscriptionless_connections"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# Subscriptions state
resource "aws_dynamodb_table" "subscriptions" {
  name           = "subscriptionless_subscriptions"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "id"
  range_key      = "topic"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "topic"
    type = "S"
  }

  attribute {
    name = "connectionId"
    type = "S"
  }

  global_secondary_index {
    name            = "ConnectionIndex"
    hash_key        = "connectionId"
    write_capacity  = 1
    read_capacity   = 1
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "TopicIndex"
    hash_key        = "topic"
    write_capacity  = 1
    read_capacity   = 1
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
