# file-service

远程文件服务，提供 2 个 GET + 2 个 POST 接口，使用环境变量 token 鉴权。

## 环境变量

- PORT: 监听端口，默认 8080
- ROOT_DIR: 文件根目录，默认 process.cwd()
- MAX_BODY_MB: 最大请求体大小，默认 100
- FILE_SERVICE_TOKEN: 鉴权 token（必填）

## 鉴权

- Header: Authorization: Bearer <FILE_SERVICE_TOKEN>

## 接口

- GET /list?path=...  列目录，返回 JSON
- GET /download?path=...  下载文件，返回二进制
- POST /mkdir  JSON { path, recursive? }
- POST /upload?path=...&overwrite=0|1&mkdirs=0|1  二进制 body

## 运行

```bash
npm install
FILE_SERVICE_TOKEN=your-token \
npm run dev
```

## Docker

```bash
docker build -t file-service .
```

或使用脚本:

```bash
./push_docker_image.sh --tag latest
```
