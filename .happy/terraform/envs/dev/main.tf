module stack {
  source                       = "./modules/ecs-stack"
  aws_account_id               = var.aws_account_id
  aws_role                     = var.aws_role
  happymeta_                   = var.happymeta_
  happy_config_secret          = var.happy_config_secret
  image_tag                    = var.image_tag
  priority                     = var.priority
  stack_name                   = var.stack_name
  deployment_stage             = "dev"
  delete_protected             = true
  require_okta                 = false
  frontend_url                 = "https://cellxgene.dev.single-cell.czi.technology"
  backend_url                  = "https://api.cellxgene.dev.single-cell.czi.technology"
  stack_prefix                 = ""
  batch_container_memory_limit = 28000
  wmg_batch_container_memory_limit = 248000
  wmg_desired_vcpus                = 128
  cg_desired_vcpus                 = 48
  cg_batch_container_memory_limit  = 92000
  backend_memory               = 8192
  frontend_memory              = 4096
  backend_instance_count       = 1
  backend_workers              = 1
  wait_for_steady_state = var.wait_for_steady_state
}
