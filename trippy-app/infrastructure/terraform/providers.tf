provider "aws" {
  region = var.aws_region

  # Tag every taggable resource for cost allocation and ownership. Enable
  # these tags as Cost Allocation Tags in the Billing console to break down
  # spend by project/environment.
  default_tags {
    tags = merge(
      {
        Project     = var.project
        Environment = var.environment
        ManagedBy   = "Terraform"
      },
      var.tags
    )
  }
}
