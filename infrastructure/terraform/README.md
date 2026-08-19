# Causora Phase 0 AWS infrastructure

This Terraform configuration prepares one low-cost ARM64 Amazon Linux 2023 host in `ap-south-1`. It does not deploy Causora application services.

## Design and security

- One VPC, one public subnet, one internet gateway, and one public route table.
- One `t4g.small` EC2 instance with a single encrypted 16 GiB gp3 root volume.
- IMDSv2 is required.
- An EC2 role and instance profile provide AWS Systems Manager access without stored AWS access keys.
- SSH is disabled by default. To enable it, set `allowed_ssh_cidr` to a trusted `/32` and provide an existing `key_name`. `0.0.0.0/0` is rejected.
- HTTP and HTTPS are disabled by default until a gateway/frontend is deployed.
- Kafka, PostgreSQL, Redis, Prometheus, and Spring service ports are never opened publicly.
- The optional private S3 artifacts bucket is disabled by default.
- There is no NAT gateway, Elastic IP, load balancer, RDS, MSK, EKS, or ElastiCache.

The instance bootstrap installs Docker, the Docker Compose plugin, Git, and Ansible, enables Docker, and creates `/opt/causora`. It does not clone or deploy the application.

## Cost-sensitive resources

Even while Causora services are idle, the EC2 instance, its gp3 root volume, and its automatically assigned public IPv4 address can incur hourly/monthly charges. Internet data transfer can also incur charges. If enabled, S3 incurs storage and request charges. VPC, subnet, route table, internet gateway, security group, IAM role, and instance profile do not normally have direct hourly charges.

Stop the EC2 instance when it is not needed to stop compute charges. EBS and public IPv4 charges may continue depending on allocation/state. Destroy the development stack when it is no longer needed.

## Workflow

Copy the example variables if customization is required:

```powershell
Copy-Item terraform.tfvars.example terraform.tfvars
```

Review any SSH CIDR carefully, then run:

```powershell
terraform fmt -recursive
terraform init
terraform validate
terraform plan
```

Do not run `terraform apply` until the plan and expected costs have been reviewed.
