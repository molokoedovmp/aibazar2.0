# Автоматический деплой AI Bazar

После настройки каждый push в ветку `main` запускает GitHub Actions. Workflow:

1. устанавливает зависимости и проверяет TypeScript;
2. синхронизирует репозиторий с сервером;
3. собирает новый Docker-образ;
4. выполняет `prisma migrate deploy`;
5. синхронизирует категории и AI-инструменты из `data/db-export`;
6. перезапускает контейнер и ждёт успешной health-проверки.

Если сборка, миграция или синхронизация каталога завершается ошибкой, следующий этап не запускается.

## 1. Узнать данные подключения к существующему серверу

Подключитесь к серверу обычной командой, которой уже пользуетесь:

```bash
ssh -p 22 USER@SERVER_IP
```

Здесь и далее замените:

- `USER` — имя пользователя сервера;
- `SERVER_IP` — IP-адрес или домен сервера;
- `22` — фактический SSH-порт, если он отличается.

После входа выполните на сервере:

```bash
whoami
cd /opt/aibazar2.0
pwd
test -w . && echo "Директория доступна для записи"
test -f .env && echo ".env найден"
docker compose version
docker ps
rsync --version
```

Все проверки должны выполниться без `Permission denied`. Новая директория и новая база не создаются. Существующий `/opt/aibazar2.0/.env` исключён из синхронизации и не перезаписывается.

Если только Docker требует `sudo`, добавьте пользователя в группу Docker, подставив результат `whoami` вместо `USER`, а затем выйдите с сервера и подключитесь снова:

```bash
sudo usermod -aG docker USER
exit
```

Если нет `rsync`, установите его на сервере:

```bash
sudo apt update
sudo apt install -y rsync
```

Перед первым автоматическим деплоем убедитесь, что в серверной директории нет единственных копий важных файлов или незакоммиченных правок: workflow синхронизирует её с Git через `rsync --delete`. `.env`, `.git`, `node_modules` и `.next` защищены исключениями.

## 2. Создать отдельный SSH-ключ для GitHub Actions

Следующие команды выполняются **на вашем компьютере Windows в PowerShell**, не на сервере.

Создайте отдельный ключ:

```powershell
ssh-keygen -t ed25519 -C "github-actions-aibazar" -f "$env:USERPROFILE\.ssh\aibazar_actions"
```

Когда появится запрос `Enter passphrase`, два раза нажмите Enter, оставив пароль пустым. Получатся два файла:

- `aibazar_actions` — приватный ключ, его нельзя публиковать;
- `aibazar_actions.pub` — публичный ключ для сервера.

Добавьте публичный ключ на сервер, заменив `USER`, `SERVER_IP` и порт:

```powershell
Get-Content "$env:USERPROFILE\.ssh\aibazar_actions.pub" | ssh -p 22 USER@SERVER_IP "umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

Проверьте вход новым ключом и доступ к проекту:

```powershell
ssh -i "$env:USERPROFILE\.ssh\aibazar_actions" -p 22 USER@SERVER_IP "cd /opt/aibazar2.0 && test -w . && docker ps && echo DEPLOY_OK"
```

В конце должно появиться `DEPLOY_OK`. Пока эта проверка не работает, GitHub Actions тоже не сможет выполнить деплой.

## 3. Получить значения для секретов

В PowerShell выведите приватный ключ:

```powershell
Get-Content -Raw "$env:USERPROFILE\.ssh\aibazar_actions"
```

Скопируйте весь вывод, включая строки `BEGIN OPENSSH PRIVATE KEY` и `END OPENSSH PRIVATE KEY`. Это значение секрета `SSH_KEY`. Никому его не отправляйте и не добавляйте в Git.

Затем получите публичный отпечаток сервера:

```powershell
ssh-keyscan -H -p 22 SERVER_IP
```

Скопируйте строки, начинающиеся с имени/IP сервера. Это значение `SSH_KNOWN_HOSTS`.

## 4. Добавить окружение и секреты в GitHub

1. Откройте репозиторий проекта на GitHub.
2. Нажмите `Settings`.
3. В левом меню нажмите `Environments`.
4. Нажмите `New environment`.
5. Введите точное имя `production` и нажмите `Configure environment`.
6. Найдите блок `Environment secrets`.
7. Нажимайте `Add environment secret` и создайте каждый секрет из таблицы.

| Имя секрета | Что вставить |
| --- | --- |
| `SSH_HOST` | IP или домен без `https://`, например `123.123.123.123` |
| `SSH_USER` | результат серверной команды `whoami`, например `root` или `deploy` |
| `SSH_PORT` | SSH-порт, обычно `22` |
| `SSH_KEY` | полный приватный ключ из `Get-Content -Raw` |
| `SSH_KNOWN_HOSTS` | полный вывод `ssh-keyscan -H -p 22 SERVER_IP` |
| `APP_DIR` | точное значение `/opt/aibazar2.0` |

Имена должны совпадать с таблицей, регистр букв важен. Это именно секреты окружения `production`, потому что deploy-задача workflow использует `environment: production`.

## 5. Проверить существующую Prisma-базу

После изменения `prisma/schema.prisma` локально создайте миграцию:

```bash
npx prisma migrate dev --name short_migration_name
```

Затем добавьте в commit и схему, и созданную директорию миграции:

```bash
git add prisma/schema.prisma prisma/migrations
```

На production нельзя автоматически генерировать миграции через `migrate dev` или применять `db push`. Сервер безопасно применяет только уже созданные и сохранённые в Git миграции командой `prisma migrate deploy`.

Если production-база существовала до появления папки `prisma/migrations`, перед первым автоматическим деплоем проверьте её один раз:

```bash
cd /opt/aibazar2.0
docker compose run --rm --no-deps web npx prisma migrate status
```

При сообщении о необходимости baseline не выполняйте `migrate reset`: эта команда удаляет данные. Сначала сделайте резервную копию и отметьте уже существующие миграции через `prisma migrate resolve --applied` после сверки структуры базы.

## 6. Отправить workflow в GitHub и запустить первый деплой

Эти команды выполняются **на вашем компьютере в папке проекта**:

```bash
git add .
git commit -m "Настройка автоматического деплоя"
git push origin main
```

Затем:

1. откройте репозиторий на GitHub;
2. перейдите во вкладку `Actions`;
3. откройте `Verify and deploy production`;
4. дождитесь зелёного статуса задач `Verify source` и `Deploy to server`.

Workflow также можно запустить вручную: `Actions → Verify and deploy production → Run workflow → Run workflow`.

После успешного запуска проверьте сервер:

```bash
cd /opt/aibazar2.0
docker compose ps
docker compose logs --tail=100 web
```

Приложение внутри Docker слушает порт `3000`, а `docker-compose.yml` публикует его на серверном порту `3001`.
