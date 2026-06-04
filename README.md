# 📅 Kalendarz Scanner v2.0

Aplikacja na Android do skanowania kalendarzy i zarządzania zadaniami.

## ✨ Co nowego w v2.0
- 📸 **4 sposoby dodawania**: aparat, galeria/plik, screenshot z Google Cal/Outlook
- 🔁 **Zadania cykliczne**: codziennie, co tydzień, co miesiąc, co rok
- 🇵🇱 **Polskie święta**: automatycznie w kalendarzu (z algorytmem Wielkanocy)
- 🔔 **Elastyczne powiadomienia**: 10 min, 30 min, 1h, 2h, 1 dzień, 2 dni, tydzień przed

## 🚀 Jak zbudować APK

1. Wejdź na **https://expo.dev** → utwórz konto
2. Otwórz to repo → **Code → Codespaces → Create codespace**
3. W terminalu:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview
   ```
4. Pobierz `.apk` z linku i zainstaluj na telefonie

## ⚙️ Konfiguracja

W pliku `src/screens/ScanScreen.js` zamień `ANTHROPIC_API_KEY_PLACEHOLDER` na swój klucz z https://console.anthropic.com
