# Деплой feedback-guest-webapp: Vercel → VPS (Coolify)

Инструкция по переносу гостевого веб-опросника на свой VPS под управлением
Coolify. Рассчитана на Coolify-инстанс с wildcard-доменом
`*.apps.n8nmrkszn-domen.org` (сервер `178.105.160.84`).

## Что уже готово (эта ветка)

- `Dockerfile` — multi-stage: `node:22-alpine` (Vite build) → `nginx:1.27-alpine`.
- `deploy/nginx.conf` — SPA history-fallback (зеркало `vercel.json` rewrites),
  immutable-кэш для `/assets/`, `no-cache` для PWA `sw.js` / `manifest.webmanifest`.
- `.dockerignore`.
- Локальная сборка проверена (`npm ci` + `npm run build` проходят).

Vite инлайнит `VITE_*` в бандл **на этапе сборки** — поэтому обе переменные
в Coolify обязательно помечайте как **Build Variable**.

## Шаги в Coolify

1. Смёржить PR ветки `feat/coolify-deploy` в `master`
   (для первого теста можно деплоить прямо ветку).
2. **+ New Resource → Public Repository** →
   `https://github.com/mrkszn/feedback-guest-webapp`, branch `master`,
   **Build Pack: Dockerfile**.
3. **Environment Variables** (обе — галочка *Build Variable*):

   | Переменная | Значение |
   |---|---|
   | `VITE_API_BASE_URL` | `https://api-waiter.178-105-54-29.nip.io` |
   | `VITE_APP_MODE` | `non_targeted` *(или `targeted`, если оставляем геймифицированную версию — режим задаётся только здесь)* |

4. **Network**: Ports Exposes = `80`.
   **Domain**: `https://feedback.apps.n8nmrkszn-domen.org`
   (любое имя внутри `*.apps.…` — TLS прокси Coolify выпустит сам).
5. **Deploy** и проверить, что открывается `https://feedback.apps.n8nmrkszn-domen.org`.

## Автодеплой на push (CI/CD)

В приложении: **Webhooks → GitHub** — скопировать Payload URL и задать Secret.
Затем в GitHub: `feedback-guest-webapp → Settings → Webhooks → Add webhook`:

- Payload URL — из Coolify;
- Content type — `application/json`;
- Secret — тот же;
- события — только `push`.

Через gh CLI (подставить URL и SECRET из Coolify):

```bash
gh api repos/mrkszn/feedback-guest-webapp/hooks -f name=web -F active=true \
  -f "events[]=push" -f config.url='<PAYLOAD_URL>' \
  -f config.content_type=json -f config.secret='<SECRET>'
```

После этого каждый push в `master` пересобирает и перекатывает контейнер.

## CORS на бэкенде (обязательно)

Guest-API пускает только origin'ы из allowlist — без этого фронт получит
«Load failed». На backend-VPS (`root@178.105.54.29`) отредактировать
`/etc/telegram-waiter/.env`: добавить новый origin через запятую к
`ALLOWED_GUEST_ORIGINS` (точное совпадение схемы+хоста, без слэша в конце):

```
ALLOWED_GUEST_ORIGINS=<текущие значения>,https://feedback.apps.n8nmrkszn-domen.org
```

Применить и проверить preflight:

```bash
sudo systemctl restart voice-api
```

```bash
curl -is -X OPTIONS https://api-waiter.178-105-54-29.nip.io/guest/auth \
  -H "Origin: https://feedback.apps.n8nmrkszn-domen.org" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control
```

В ответе должен быть `access-control-allow-origin: https://feedback.apps.…`.

## Смок-тест после деплоя

1. `/` — entry-экран открывается, консоль без CORS-ошибок.
2. Вход по токен-ссылке `/?t=…` → `/feed`.
3. Пройти биты, `/recap` → `/dig` → `/final`, finalize уходит на API.
4. Перезагрузка страницы посреди сессии — состояние восстанавливается
   (`GET /guest/sessions/{id}`).

## Переключение с Vercel

- Обновить все QR-коды/ссылки, которые ведут на `*.vercel.app`, на новый домен.
- Vercel-проекты не удалять, пока прод-ссылки не переключены; потом —
  пауза или удаление по желанию (могут остаться как staging).

## Примечание: второй Coolify на 178.105.54.29

В процессе миграции Coolify был установлен и на backend-VPS
(`/data/coolify`, UI на `127.0.0.1:8300`, снаружи закрыт
`coolify-portguard.service`). Если он не нужен, снос:

```bash
cd /data/coolify/source && docker compose --env-file .env \
  -f docker-compose.yml -f docker-compose.prod.yml down -v
docker network rm coolify
rm -rf /data/coolify
systemctl disable --now coolify-portguard.service
rm /etc/systemd/system/coolify-portguard.service && systemctl daemon-reload
# ufw status numbered → удалить правило «8300 … coolify UI» (ufw delete <N>)
# из /root/.ssh/authorized_keys убрать строку с комментарием root@coolify
```

Либо оставить его как локальный Coolify для управления деплоями именно
этого сервера — он изолирован (порт наружу закрыт, прод-сервисы не тронуты).
