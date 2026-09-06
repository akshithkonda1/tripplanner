# Package each distinct handler bundle produced by bundle.mjs.
# Run `npm run tf:build` (from infrastructure/) before plan/apply.
data "archive_file" "bundle" {
  for_each = local.bundles

  type        = "zip"
  source_dir  = "${path.module}/build/dist/${each.value}"
  output_path = "${path.module}/build/zips/${each.value}.zip"
}

# Pre-create log groups so retention (and cost) is controlled explicitly,
# rather than letting Lambda create them with infinite retention.
resource "aws_cloudwatch_log_group" "lambda" {
  for_each = local.functions

  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "fn" {
  for_each = local.functions

  function_name = "${local.name_prefix}-${each.key}"
  role          = aws_iam_role.lambda.arn
  runtime       = var.lambda_runtime
  architectures = [var.lambda_architecture]
  handler       = each.value.handler
  memory_size   = each.value.memory
  timeout       = each.value.timeout

  filename         = data.archive_file.bundle[each.value.source].output_path
  source_code_hash = data.archive_file.bundle[each.value.source].output_base64sha256

  environment {
    variables = local.common_lambda_env
  }

  depends_on = [
    aws_iam_role_policy.lambda,
    aws_cloudwatch_log_group.lambda,
  ]
}
