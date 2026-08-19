variable "aws_region" {
  description = "AWS region in which to create the Phase 0 infrastructure."
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment tag."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the Causora VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the single public subnet."
  type        = string
  default     = "10.20.1.0/24"
}

variable "availability_zone" {
  description = "Optional availability zone. When null, AWS selects an available zone in the region."
  type        = string
  default     = null
}

variable "instance_type" {
  description = "Low-cost ARM/Graviton EC2 instance type."
  type        = string
  default     = "t4g.small"
}

variable "root_volume_size_gib" {
  description = "Size of the single gp3 root volume in GiB."
  type        = number
  default     = 16

  validation {
    condition     = var.root_volume_size_gib >= 8 && var.root_volume_size_gib <= 30
    error_message = "root_volume_size_gib must be between 8 and 30 GiB for this low-cost environment."
  }
}

variable "allowed_ssh_cidr" {
  description = "Optional trusted IPv4 CIDR allowed to use SSH. Leave null to create no SSH ingress rule. Never use 0.0.0.0/0."
  type        = string
  default     = null

  validation {
    condition     = var.allowed_ssh_cidr == null || (can(cidrhost(var.allowed_ssh_cidr, 0)) && var.allowed_ssh_cidr != "0.0.0.0/0")
    error_message = "allowed_ssh_cidr must be a valid, restricted CIDR and cannot be 0.0.0.0/0."
  }
}

variable "key_name" {
  description = "Optional name of an existing EC2 key pair. Required only when SSH access is enabled."
  type        = string
  default     = null

  validation {
    condition     = var.allowed_ssh_cidr == null || var.key_name != null
    error_message = "key_name must be set when allowed_ssh_cidr enables SSH."
  }
}

variable "enable_public_web" {
  description = "Allow public HTTP and HTTPS ingress for the future frontend/gateway. Disabled until those services are deployed."
  type        = bool
  default     = false
}

variable "enable_artifacts_bucket" {
  description = "Create a private, encrypted S3 bucket for future artifacts/backups. Disabled by default to avoid storage/request charges."
  type        = bool
  default     = false
}

variable "artifacts_bucket_name" {
  description = "Globally unique S3 bucket name. Required only when enable_artifacts_bucket is true."
  type        = string
  default     = null

  validation {
    condition     = !var.enable_artifacts_bucket || var.artifacts_bucket_name != null
    error_message = "artifacts_bucket_name must be set when enable_artifacts_bucket is true."
  }
}
