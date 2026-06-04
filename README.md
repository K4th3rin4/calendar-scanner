# 📅 Kalendarz Scanner

Aplikacja na Android do skanowania papierowych kalendarzy i zarządzania zadaniami.

## ✨ Funkcje

- 📸 Skanowanie zdjęcia kalendarza (aparat lub galeria)
- 🤖 Automatyczne odczytywanie wpisów przez AI (Claude)  
- 📅 Interaktywny kalendarz miesięczny z kolorowymi punktami
- ✏️ Edycja, dodawanie i usuwanie wpisów
- 🔔 Powiadomienia z przypomnieniami
- 🏷️ Typy wpisów: Zadanie, Urlop, Praca, Przypomnienie, Inne

---

## 🚀 Jak zbudować i zainstalować APK (krok po kroku)

### Krok 1: Skonfiguruj klucz API Anthropic

W pliku `src/screens/ScanScreen.js` znajdź linię:
```
'x-api-key': 'ANTHROPIC_API_KEY_PLACEHOLDER',
```
Zamień `ANTHROPIC_API_KEY_PLACEHOLDER` na swój klucz z https://console.anthropic.com

### Krok 2: Zbuduj APK przez Expo (bezpłatnie, bez komputera)

1. Wejdź na **https://expo.dev** i utwórz konto (darmowe)
2. Zainstaluj EAS CLI lokalnie lub użyj GitHub Codespaces:
   - Otwórz to repo na GitHub
   - Kliknij **Code** → **Codespaces** → **Create codespace on main**
   - W terminalu wpisz:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android --profile preview
   ```
3. Po ~10 minutach dostaniesz link do pobrania pliku `.apk`

### Krok 3: Zainstaluj APK na telefonie

1. Pobierz plik `.apk` na telefon (lub prześlij przez Bluetooth/Google Drive)
2. Na Androidzie wejdź w **Ustawienia → Bezpieczeństwo → Nieznane źródła** (zezwól)
3. Otwórz plik `.apk` i zainstaluj

---

## 📁 Struktura projektu

```
calendar-scanner/
├── App.js                    # Główny plik aplikacji
├── app.json                  # Konfiguracja Expo
├── eas.json                  # Konfiguracja budowania
├── src/
│   ├── screens/
│   │   ├── ScanScreen.js     # Skanowanie zdjęcia
│   │   ├── CalendarScreen.js # Kalendarz miesięczny  
│   │   ├── AgendaScreen.js   # Lista wszystkich wpisów
│   │   └── SettingsScreen.js # Ustawienia
│   └── utils/
│       ├── storage.js        # Zapisywanie danych
│       └── notifications.js  # Powiadomienia
```
