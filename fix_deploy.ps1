# LinkWeb 部署修复脚本
# 请先在本地 PowerShell 中执行

$hostname = "155.248.195.94"
$username = "root"
$password = "66596366As."

# 使用 plink 或 ssh 连接（如果系统没有 ssh，用下面命令替代）
# 或者直接在服务器上手动执行以下命令：

Write-Host "请通过 SSH 登录服务器后执行以下命令："
Write-Host ""
Write-Host "# 1. 检查 [...nextauth] 目录是否存在"
Write-Host "ls -la /opt/linkweb/src/app/api/auth/"
Write-Host ""
Write-Host "# 2. 如果不存在，在本地手动创建并上传"
Write-Host "# 或者运行以下命令重建"
Write-Host "cd /opt/linkweb && mkdir -p src/app/api/auth/[...nextauth]"