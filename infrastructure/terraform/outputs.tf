output "instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.causora.id
}

output "instance_public_ip" {
  description = "Ephemeral public IPv4 address. AWS bills public IPv4 addresses while allocated."
  value       = aws_instance.causora.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance."
  value       = aws_instance.causora.public_dns
}

output "api_public_ip" {
  description = "Stable public API address when public web ingress is enabled."
  value       = try(aws_eip.causora[0].public_ip, null)
}

output "ssm_start_session_command" {
  description = "Preferred credential-free management command once the instance is online."
  value       = "aws ssm start-session --target ${aws_instance.causora.id} --region ${var.aws_region}"
}

output "artifacts_bucket_name" {
  description = "Optional private artifact bucket name, or null when disabled."
  value       = try(aws_s3_bucket.artifacts[0].id, null)
}
