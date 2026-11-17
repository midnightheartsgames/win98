# Сайт pennygachi.men

С 17.11.2026 сайт живёт на виртуальном хостинге cloud4box (ISPmanager, пользователь user896926, сервер 185.154.20.52), а не на мини-ПК. Главная страница домена — визитка `web98-card/`: одно окно Win 98 без прокрутки с загрузками Win 98 и Star Rail 98 и ссылками на сайты о SR98. Прежние проекты в корне домена (ccc, mh-xray, mh-files и другие) на хостинг не переносились.

## Что где лежит

| На диске | На сайте |
| --- | --- |
| `web98-card/` | `/` |
| `web98-site/sr98/` | `/sr98/` (сайт игры, `play/` — игра в браузере, `StarRail98.apk`) |
| `web98-site/sr98wiki/` | `/sr98wiki/` (АстралВики 98) |
| `web98-site/kovcheg/` | `/kovcheg/` (Ковчег) |
| `npm run release -- win98 --full` | `/files/Win98.zip` и `/files/Win98-linux.tar.gz` |
| `npm run release` | `/update/` (для лаунчеров ещё и `/web98/update/`) |

`web98-card/.htaccess` отдаёт `/web98/update/...` из `/update/` без перенаправления (так ходят лаунчеры Win98.exe, StarRail98.exe и APK), остальные старые адреса `/web98/...` переводит на новые (`/web98/sr98/` → `/sr98/`, `/web98/Win98.zip` → `/files/Win98.zip`) и задаёт тип файлов `.apk`. Файлы в `/update/` заливает только `tools/release.cjs`, `site-deploy.py` их не трогает (как описано в разделе «Переезд на cloud4box» в `LAUNCHER.md`).

## Выкладка

Доступ только по FTP с TLS: shell у пользователя отключён. Логин и пароль лежат в `~/.netrc` (права 600) в строке `machine user896926.web-3.cloud4box.ru` и в git не попадают. Сертификат FTP самоподписанный, оба скрипта сверяют его отпечаток и не отправляют пароль, если он изменился.

```
python3 tools/site-deploy.py --dry-run
python3 tools/site-deploy.py
python3 tools/site-deploy.py --zip
```

Скрипт заливает только новые и изменённые файлы (размер и время изменения, время ставится через MFMT). `--zip` грузит архив под именем `files/Win98.zip.part` с докачкой и переименовывает его в конце. `--delete` убирает с хостинга файлы, которых больше нет на диске; папки `sr98`, `sr98wiki`, `kovcheg`, `files`, `update` и `web98` в корне он при этом не трогает. `--ls <папка>` показывает содержимое папки на хостинге.

## Домен

DNS домена в Cloudflare, запись `pennygachi.men` — A на 185.154.20.52 через прокси Cloudflare. На хостинге стоит самоподписанный сертификат ISPmanager, поэтому режим SSL в Cloudflare — Full. Для Full (strict) нужен сертификат Let's Encrypt в разделе «SSL-сертификаты» ISPmanager.
