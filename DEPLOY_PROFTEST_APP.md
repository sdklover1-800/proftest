# Deploy to proftest.app

## 1) DNS
- `A` record: `proftest.app` -> your server public IP
- `A` record: `www.proftest.app` -> your server public IP

## 2) Backend env
1. Copy `backend/.env.production.example` to `backend/.env`.
2. Set real values:
- `DATABASE_URL`
- `SECRET_KEY` (min 32 chars)
- `OPENAI_API_KEY` (optional)

Required domain settings:
- `BACKEND_CORS_ORIGINS=https://proftest.app,https://www.proftest.app`
- `BACKEND_TRUSTED_HOSTS=proftest.app,www.proftest.app`

## 3) Database schema
Migrations are owned by Alembic. From `backend/`:
```bash
# fresh database
alembic upgrade head

# database that already has the tables but no alembic_version
alembic stamp 42b3db3ee8f8
alembic upgrade head
```
Then load the question bank:
```bash
python scripts/import_all_questions.py
```
Never run `Base.metadata.create_all()` against a deployed database — it creates
tables without recording a revision, and migrations then have nothing to apply.

## 4) Build frontend
```bash
cd /var/www/proftest/frontend
npm ci
npm run build
```

## 5) Start backend with systemd
1. Copy service:
```bash
sudo cp /var/www/proftest/deploy/systemd/proftest-backend.service /etc/systemd/system/
```
2. Reload/start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable proftest-backend
sudo systemctl restart proftest-backend
sudo systemctl status proftest-backend
```

## 6) Configure nginx
1. Copy nginx config:
```bash
sudo cp /var/www/proftest/deploy/nginx/proftest.app.conf /etc/nginx/sites-available/proftest.app.conf
sudo ln -sf /etc/nginx/sites-available/proftest.app.conf /etc/nginx/sites-enabled/proftest.app.conf
```
2. Validate and reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7) TLS certificates
```bash
sudo certbot --nginx -d proftest.app -d www.proftest.app
```

## 8) Smoke checks
- `https://proftest.app/` -> frontend loads
- `https://proftest.app/healthz` -> `{"status":"ok"}`
- `https://proftest.app/api/v1/assessment/questions` -> backend responds

