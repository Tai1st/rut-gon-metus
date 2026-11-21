# Triển khai lên VPS — link.metus.vn

FE Next.js chạy bằng pm2 (cổng **3003**) phía sau nginx + Cloudflare, gọi backend `metus-zalo-be` cùng máy qua `http://127.0.0.1:4100`.

## Lần đầu

```bash
cd /var/www
git clone https://github.com/Tai1st/rut-gon-metus.git metus-link
cd metus-link

# Biến môi trường (INTERNAL_KEY phải trùng với backend trên cùng VPS)
printf 'ZALO_BE_URL=http://127.0.0.1:4100\n' > .env.local
grep '^INTERNAL_KEY=' /var/www/metus-zalo-be/.env >> .env.local

npm ci
npm run build
pm2 start node_modules/next/dist/bin/next --name metus-link -- start -p 3003
pm2 save

# nginx + HTTPS
cp deploy/nginx-link.metus.vn.conf /etc/nginx/sites-available/metus-link
ln -s /etc/nginx/sites-available/metus-link /etc/nginx/sites-enabled/metus-link
nginx -t && systemctl reload nginx
certbot --nginx -d link.metus.vn --redirect
```

DNS: bản ghi `link.metus.vn` trỏ về VPS (đang qua Cloudflare, giống `api-v3.metus.vn`).

## Tự động deploy (GitHub Actions)

Mỗi lần push `main`, workflow `.github/workflows/deploy.yml` build thử, rồi SSH vào VPS: `git pull`, `npm ci`, build,
`pm2 reload`, kiểm tra `http://127.0.0.1:3003/login`; build hoặc kiểm tra lỗi thì tự quay về bản `.next` trước đó.

Cần đặt 4 secrets trong repo (Settings → Secrets and variables → Actions), cùng giá trị với repo backend:
`VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY` (khóa riêng SSH, định dạng PEM/OpenSSH, khóa công khai tương ứng
phải nằm trong `~/.ssh/authorized_keys` của user trên VPS).

## Cập nhật thủ công

```bash
cd /var/www/metus-link
git pull origin main
npm ci
npm run build
pm2 reload metus-link
```

## Lưu ý

- Server Next chuyển IP thật của khách (`CF-Connecting-IP` / `X-Real-IP`) sang backend qua `X-Forwarded-For`,
  nên giới hạn đăng nhập/đăng ký của backend tính theo từng khách, không tính chung.
- Đăng ký tự do: bật/tắt đăng ký tự do bằng `LINKS_ALLOW_REGISTRATION` trong `.env` của backend.
