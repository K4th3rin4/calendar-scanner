# 📅 Kalendarz Scanner

Aplikacja na Android do skanowania papierowych kalendarzy.

## Funkcje
- 📸 Skanowanie zdjęcia kalendarza (aparat lub galeria)
- 🤖 Automatyczne odczytywanie wpisów przez AI (Claude)
- 📅 Interaktywny kalendarz miesięczny
- ✏️ Edycja, dodawanie i usuwanie wpisów
- 🔔 Powiadomienia o wydarzeniach
- 🏷️ Typy: Zadanie, Urlop, Praca, Przypomnienie, Inne

## Instalacja na telefonie

### Opcja 1: EAS Build (zalecana)
1. Załóż konto na [expo.dev](https://expo.dev)
2. Dodaj secret `EXPO_TOKEN` w GitHub → Settings → Secrets
3. Push do main uruchomi automatyczny build
4. Pobierz APK z zakładki Actions lub Expo dashboard

### Opcja 2: Lokalnie
```bash
npm install -g @expo/cli eas-cli
npm install
eas login
eas build --platform android --profile preview
```

## Konfiguracja API
W pliku `src/screens/ScanScreen.js` zamień `ANTHROPIC_API_KEY_PLACEHOLDER` na swój klucz API Anthropic.
