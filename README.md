# DeepSeek Web Chat

一个基于 Vue 3 开发的 Web 聊天界面，用于调用 DeepSeek API 实现 AI 对话功能。
![image](https://github.com/user-attachments/assets/66041177-c7ce-433c-a3f5-fb45f6454f65)



## 背景说明

由于 DeepSeek 官网经常面临访问压力大的问题，但模型已开源，许多大厂都部署了该模型的服务。本项目采用腾讯云部署的 DeepSeek 模型实现。

> 🔗 API 文档：[腾讯云 DeepSeek API 文档](https://cloud.tencent.com/document/product/1772/115969)  
> 🎯 主要优势：服务稳定，响应快速，支持流式输出
>
> PS: 腾讯提供的DeepSeek接口为671b模型,API免费到2025年2月25日23:59:59

## 功能特点

- 💬 实时对话功能
- 🤔 显示 AI 思考过程
- 🔄 支持新对话
- 📱 响应式设计
- 🌈 优雅的动画效果

## 快速开始

##### 1.克隆项目

```bash
git clone https://github.com/momoxiaoshuai/deepseek-chat.git
cd deepseek-web-chat
```

##### 2.安装依赖

  ```bash
  npm install
  ```

##### 3.配置环境变量

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，设置你的 API 密钥：
```bash
VITE_DEEPSEEK_API_KEY=your-api-key-here
VITE_API_BASE_URL=/api
```

> ⚠️ 注意：不要将包含实际 API 密钥的 `.env` 文件提交到版本控制系统中

##### 4.本地开发

  ```bash
  npm run dev
  ```

##### 5.构建部署

  ```bash
  npm run build
  ```


## 部署说明

### Nginx 配置示例

```
nginx
server {
listen 80;
server_name your-domain.com; # 替换成你的域名或 IP
root /path/to/your/dist; # 替换成你的 dist 目录路径
index index.html;

# 处理前端路由

location / {
try_files $uri $uri/ /index.html last;
}

# API 代理配置

location /api/ {
proxy_pass https://api.lkeap.cloud.tencent.com/v1/;
proxy_ssl_server_name on;
proxy_ssl_protocols TLSv1.2;
proxy_set_header Host api.lkeap.cloud.tencent.com;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_connect_timeout 60s;
proxy_read_timeout 60s;
proxy_send_timeout 60s;

# 关闭缓冲，确保流式响应正常工作

proxy_buffering off;
}
error_log /var/log/nginx/deepseek_error.log;
access_log /var/log/nginx/deepseek_access.log;
}
```



### 部署步骤

1. 构建项目

  ```bash
  npm run build
  ```
2. 将 dist 目录上传到服务器

  ```bash
  scp -r dist/ user@your-server:/path/to/your/dist
  ```


3. 配置 Nginx
- 将上述 Nginx 配置保存到 `/etc/nginx/conf.d/deepseek.conf`
- 检查配置是否正确：`sudo nginx -t`
- 重启 Nginx：`sudo systemctl restart nginx`

## 环境要求

- Node.js >= 16
- npm >= 7
- 现代浏览器（支持 ES6+）

## 技术栈

- Vue 3
- Vite
- Nginx

## 注意事项

- API 密钥存储在 `.env` 文件中，确保该文件不会被提交到代码仓库
- 在生产环境中，建议使用环境变量或密钥管理服务来存储 API 密钥
- 生产环境建议使用 HTTPS
- 定期检查并更新依赖包
