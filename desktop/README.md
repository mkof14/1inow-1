# 1inow Desktop (macOS)

Electron-обёртка с **автообновлениями** через GitHub Releases (`update-electron-app`).

## Что положить в GitHub Secrets

| Secret | Где взять |
| --- | --- |
| `APPLE_ID` | Apple ID разработчика |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com → Security → App-Specific Passwords |
| `APPLE_TEAM_ID` | developer.apple.com → Membership → Team ID |
| `CSC_LINK` | `base64 -i DeveloperID.p12 \| pbcopy` — содержимое .p12 сертификата Developer ID Application |
| `CSC_KEY_PASSWORD` | пароль, который ты ввёл при экспорте .p12 |

`GITHUB_TOKEN` создаётся автоматически — отдельно ничего класть не надо.

## Перед первой сборкой

1. В `desktop/package.json` замени `REPLACE_OWNER` и `REPLACE_REPO` на свои значения GitHub.
2. Положи иконку `desktop/icons/icon.icns` (1024×1024, .icns). Можно сконвертировать
   из `public/icons/icon-1024.png` через `iconutil` на маке или онлайн-конвертером.
3. В `desktop/main.cjs` проверь `ONEINOW_URL` — по умолчанию `https://1inow.lovable.app`.
   Поменяй, если опубликуешь по другому адресу.

## Релиз

```bash
git tag v0.1.0
git push --tags
```

Workflow `.github/workflows/release-mac.yml` сам:
- соберёт `.dmg` и `.zip` под Apple Silicon и Intel,
- подпишет сертификатом Developer ID,
- нотаризует через Apple,
- зальёт `latest-mac.yml` + бинарники в GitHub Release.

## Авто-обновления

Установленное приложение каждый час дёргает `latest-mac.yml` из последнего релиза.
Если есть новая версия — скачивает в фоне и применяет при следующем запуске.
Без подписи и нотаризации авто-обновление на macOS не запустится — это требование Gatekeeper.

## Локальная сборка без подписи (для проверки)

```bash
cd desktop
npm install
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac-local
```

Получишь `.dmg` в `desktop/release/` — Gatekeeper потребует «Open Anyway» при первом запуске,
авто-обновления работать не будут.