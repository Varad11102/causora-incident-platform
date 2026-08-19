locals {
  common_tags = {
    Project     = "Causora"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Resolve the latest AWS-owned Amazon Linux 2023 ARM64 image at plan/apply time.
data "aws_ami" "amazon_linux_2023_arm64" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-kernel-6.1-arm64"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_vpc" "causora" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "causora-${var.environment}-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.causora.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = { Name = "causora-${var.environment}-public" }
}

resource "aws_internet_gateway" "causora" {
  vpc_id = aws_vpc.causora.id

  tags = { Name = "causora-${var.environment}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.causora.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.causora.id
  }

  tags = { Name = "causora-${var.environment}-public" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "causora" {
  name_prefix = "causora-${var.environment}-"
  description = "Public access for the Causora host; internal service ports remain closed"
  vpc_id      = aws_vpc.causora.id

  dynamic "ingress" {
    for_each = var.allowed_ssh_cidr == null ? [] : [var.allowed_ssh_cidr]
    content {
      description = "SSH from explicitly trusted CIDR"
      protocol    = "tcp"
      from_port   = 22
      to_port     = 22
      cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = var.enable_public_web ? toset([80, 443]) : toset([])
    content {
      description = ingress.value == 80 ? "HTTP for future gateway/frontend" : "HTTPS for future gateway/frontend"
      protocol    = "tcp"
      from_port   = ingress.value
      to_port     = ingress.value
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  egress {
    description = "Outbound package downloads and AWS API access"
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "causora-${var.environment}-host" }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role" "ec2" {
  name_prefix = "causora-${var.environment}-ec2-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = { Name = "causora-${var.environment}-ec2" }
}

# Systems Manager provides credential-free instance management. Its AWS-managed
# policy avoids embedding access keys while limiting the host to SSM operations.
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "causora-${var.environment}-ec2-"
  role        = aws_iam_role.ec2.name

  tags = { Name = "causora-${var.environment}-ec2" }
}

# Cost-sensitive: this continuously billed instance is the primary Phase 0 cost.
# No NAT gateway, load balancer, managed database, Kafka, or cache is created.
resource "aws_instance" "causora" {
  ami                         = data.aws_ami.amazon_linux_2023_arm64.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.causora.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = var.key_name

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gib
    encrypted             = true
    delete_on_termination = true
  }

  user_data = <<-USER_DATA
    #!/bin/bash
    set -euxo pipefail

    dnf update -y
    # Amazon Linux 2023 provides curl-minimal by default. Installing the full
    # curl package conflicts with it and would abort the entire bootstrap.
    dnf install -y docker git ansible-core

    install -d -m 0755 /usr/local/lib/docker/cli-plugins
    curl --fail --location --retry 3 \
      https://github.com/docker/compose/releases/download/v2.35.1/docker-compose-linux-aarch64 \
      --output /usr/local/lib/docker/cli-plugins/docker-compose
    chmod 0755 /usr/local/lib/docker/cli-plugins/docker-compose

    systemctl enable --now docker
    usermod -aG docker ec2-user
    install -d -o ec2-user -g ec2-user -m 0755 /opt/causora

    # A small swapfile gives the 2 GiB Phase 1 host protection from transient
    # build and JVM startup spikes without increasing the EC2 instance size.
    if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then
      if [ ! -f /swapfile ]; then
        dd if=/dev/zero of=/swapfile bs=1M count=1024 status=progress
        chmod 600 /swapfile
        mkswap /swapfile
      fi
      swapon /swapfile
    fi
    grep -q '^/swapfile ' /etc/fstab || printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
  USER_DATA

  tags = { Name = "causora-${var.environment}" }

  depends_on = [aws_iam_role_policy_attachment.ssm]
}

# Optional and disabled by default. S3 incurs storage and request charges only
# when enabled and used; public access is blocked and objects are encrypted.
resource "aws_s3_bucket" "artifacts" {
  count = var.enable_artifacts_bucket ? 1 : 0

  bucket        = var.artifacts_bucket_name
  force_destroy = false

  tags = { Name = "causora-${var.environment}-artifacts" }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  count = var.enable_artifacts_bucket ? 1 : 0

  bucket                  = aws_s3_bucket.artifacts[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  count = var.enable_artifacts_bucket ? 1 : 0

  bucket = aws_s3_bucket.artifacts[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
