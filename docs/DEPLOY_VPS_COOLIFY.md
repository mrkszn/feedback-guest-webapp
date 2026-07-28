# Деплой feedback-guest-webapp: Vercel → VPS 178.105.54.29 (Coolify)

Целевая схема — всё на backend-VPS `178.105.54.29`:

```
DNS  *.feedback.n8nmrkszn-domen.org ──► 178.105.54.29
     feedback.n8nmrkszn-domen.org  ──► 178.105.54.29

     n8n-caddy (80/443, существующий edge)
       ├─ feedback.n8nmrkszn-domen.org          → 172.20.0.1:8310  (контейнер опросника)
       ├─ coolify.feedback.n8nmrkszn-domen.org  → 172.20.0.1:8300  (Coolify UI + вебхуки)
       └─ api-waiter.178-105-54-29.nip.io       → 172.20.0.1:8200  (guest/admin API — как было)

     Coolify (установлен, /data/coolify) — билдит образ из GitHub и катает контейнер 8310:80
```

Прокси самого Coolify **не используется** (80/443 заняты Caddy) — у сервера
`localhost` в Coolify выставить **Proxy = None**.

## Уже сделано (Claude, 2026-07-28)

- Ветка `feat/coolify-deploy` (PR #13): `Dockerfile` (node:22 → nginx:1.27,
  SPA-fallback, кэш-политики PWA), `deploy/nginx.conf`, `.dockerignore`.
  Сборка проверена локально.
- Coolify установлен вручную на `178.105.54.29`: `/data/coolify`, UI на
  `127.0.0.1:8300`. Первый аккаунт ещё НЕ создан.
- Файрвол: `coolify-portguard.service` → `/usr/local/sbin/coolify-portguard.sh`
  блокирует снаружи docker-порты 8300/6001/6002/8310 (docker publish обходит
  ufw, поэтому DOCKER-USER). Изнутри и через Caddy — доступно.
- CORS guest-API: `https://feedback.n8nmrkszn-domen.org` добавлен в
  `ALLOWED_GUEST_ORIGINS` (`/etc/telegram-waiter/.env`, бэкап
  `.env.bak-coolify-migration`), voice-api перезапущен, preflight проверен ✅.
  Vercel-origins сохранены — переходный период безопасен.
- Caddy-блоки подготовлены в `/root/caddy-feedback-blocks.snippet` — применяются
  после появления DNS (см. шаг 2).

## Шаг 1 — DNS (вы)

У DNS-провайдера домена `n8nmrkszn-domen.org` создать **две** записи:

| Тип | Имя | Значение |
|---|---|---|
| A | `*.feedback` | `178.105.54.29` |
| A | `feedback` | `178.105.54.29` |

(wildcard не покрывает «голое» `feedback.…`, поэтому записи две)

## Шаг 2 — Caddy vhosts (Claude применит сам, когда DNS раздастся)

Вручную это делается так (root@178.105.54.29):

```bash
cp /opt/n8n/Caddyfile /opt/n8n/Caddyfile.bak-feedback
cat /root/caddy-feedback-blocks.snippet >> /opt/n8n/Caddyfile
docker exec n8n-caddy-1 caddy validate --config /etc/caddy/Caddyfile
docker exec n8n-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

После этого `https://coolify.feedback.n8nmrkszn-domen.org` откроет Coolify
(сертификаты Caddy выпустит сам), а `https://feedback.…` будет отдавать 502 до
первого деплоя приложения — это нормально.

## Шаг 3 — Coolify: регистрация (вы, сразу же!)

Открыть `https://coolify.feedback.n8nmrkszn-domen.org` и **немедленно
зарегистрироваться** — до создания первого аккаунта форма регистрации открыта
любому, кто найдёт адрес.

Затем:

1. **Settings → Instance Settings**: Instance URL =
   `https://coolify.feedback.n8nmrkszn-domen.org` (нужно для корректных
   webhook-ссылок). Registration → выключить, если предложено.
2. **Servers → localhost → Proxy → выбрать None** (обязательно до первого
   деплоя, иначе Coolify попробует поднять Traefik на занятые 80/443).

## Шаг 4 — приложение (вы; или дайте Claude API-токен — сделает через API)

**+ New Resource → Public Repository** → `https://github.com/mrkszn/feedback-guest-webapp`

- Branch: `master` (после merge PR #13; для теста можно `feat/coolify-deploy`)
- **Build Pack: Dockerfile**
- **Environment Variables** (у обеих галочка *Build Variable* — Vite инлайнит
  их на этапе сборки):

  | Переменная | Значение |
  |---|---|
  | `VITE_API_BASE_URL` | `https://api-waiter.178-105-54-29.nip.io` |
  | `VITE_APP_MODE` | `non_targeted` |

- **Network → Ports Mappings**: `8310:80` (именно Mappings; Domain оставить
  пустым — маршрутизацию делает Caddy)
- **Deploy** → после сборки `https://feedback.n8nmrkszn-domen.org` должен
  открыться.

## Шаг 5 — автодеплой на push (CI/CD)

В приложении Coolify: **Webhooks** → скопировать GitHub Payload URL (будет на
базе `coolify.feedback.…`) и задать Secret. Затем добавить webhook в GitHub
(Settings → Webhooks → Add, событие `push`, content type `application/json`)
или через gh CLI:

```bash
gh api repos/mrkszn/feedback-guest-webapp/hooks -f name=web -F active=true \
  -f "events[]=push" -f config.url='<PAYLOAD_URL>' \
  -f config.content_type=json -f config.secret='<SECRET>'
```

После этого каждый push в `master` пересобирает и перекатывает приложение.

## Шаг 6 — смок-тест

1. `https://feedback.n8nmrkszn-domen.org` — entry открывается, в консоли нет
   CORS-ошибок.
2. Токен-ссылка `/?t=…` → `/feed` → биты → `/recap` → `/dig` → `/final`,
   finalize уходит в API.
3. Перезагрузка страницы посреди сессии — состояние восстанавливается.

## Шаг 7 — переключение с Vercel

- Обновить QR/ссылки с `*.vercel.app` на `https://feedback.n8nmrkszn-domen.org`.
- Vercel-проекты (`feedback-guest-webapp`, `feedback-guest-webapp2`) не
  удалять, пока все прод-ссылки не переключены; затем — пауза/удаление.
- После вывода Vercel можно вычистить его origins из `ALLOWED_GUEST_ORIGINS`
  (не обязательно).

## Справка: что где лежит на 178.105.54.29

| Что | Где |
|---|---|
| Coolify | `/data/coolify` (compose: `/data/coolify/source`), UI `127.0.0.1:8300` |
| Файрвол-щиток | `/usr/local/sbin/coolify-portguard.sh` + `coolify-portguard.service` |
| Caddyfile | `/opt/n8n/Caddyfile` (контейнер `n8n-caddy-1`) |
| Backend env | `/etc/telegram-waiter/.env` (бэкап `.env.bak-coolify-migration`) |
| Staged Caddy-блоки | `/root/caddy-feedback-blocks.snippet` |
