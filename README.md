# FlowOptima — edytowalny symulator przepływu produkcji

FlowOptima to aplikacja przeglądarkowa do szybkiego modelowania liniowego procesu produkcyjnego. Wybierz przykładowy scenariusz, dostosuj parametry partii i stanowisk, a następnie porównaj szacowane wąskie gardło, przepustowość, czas partii, przezbrojenia, koszt i WIP.

## Scenariusze startowe

Aplikacja otwiera się na **Procesie produkcyjnym — standardowym**: przygotowanie materiału → obróbka → montaż → kontrola jakości → pakowanie. Dostępne są również przykłady obróbki, montażu i pakowania. Każdy profil jest w pełni edytowalny — zmień nazwy, czasy, liczbę stanowisk albo parametry zlecenia.

Profile są przykładami do adaptacji, a nie normami ani założeniami uniwersalnymi. Dopasuj je do danych i sposobu pracy konkretnego zakładu.

## Personalizacja i przechowywanie

- **Zapisz jako własny profil** tworzy nazwany profil w lokalnej pamięci przeglądarki. Zmiany w aktywnym profilu własnym są zapisywane automatycznie.
- Profile własne pozostają w tej samej przeglądarce i na tym samym urządzeniu; nie są wysyłane do serwera.
- **Eksportuj JSON** zapisuje konfigurację do pliku, który można zachować lub przenieść.
- **Importuj JSON** wczytuje i waliduje plik. Nieprawidłowy plik nie zastępuje bieżącej konfiguracji.
- Wbudowane przykłady pozostają niezmienione; edycję zachowasz jako własny profil albo eksport JSON.

Wymagany format konfiguracji to `batchSize`, `shiftMinutes`, `hourlyCost` oraz niepusta tablica `stations`. Każde stanowisko zawiera `name`, `cycleTimeSec` i `setupTimeMin`. Zakresy wejściowe są walidowane przez `simulation.js`; maksymalny rozmiar importu to 1 MB.

## Model i ograniczenia

Silnik jest deterministycznym, uproszczonym modelem liniowego procesu:

```text
obciążenie stanowiska = czas cyklu [s] × wielkość partii / 60 + setup [min]
```

Wąskim gardłem jest stanowisko z największym obciążeniem partii. Czas realizacji to przybliżony czas wypełnienia potoku, przepustowość godzinowa wynika z cyklu wąskiego gardła, a WIP jest szacowany tylko dla stanowiska bezpośrednio przed gardłem. Prognoza produkcji na zmianę zakłada jedno przezbrojenie na wąskim gardle i stały czas cyklu.

Model nie uwzględnia awarii, zmienności czasów, równoległych maszyn, alternatywnych tras, transportu ani braków jakościowych. Wyniki są orientacyjne i nie stanowią gwarantowanego planu produkcyjnego.

## Uruchomienie

Nie są wymagane zależności do uruchomienia aplikacji. Otwórz `index.html` bezpośrednio albo uruchom lokalny serwer:

```bash
python3 -m http.server 8000
```

Następnie otwórz `http://localhost:8000`.

## Testy

Wymagany Node.js z obsługą `node:test`:

```bash
npm test
```

Testy jednostkowe obejmują walidację, KPI oraz profile startowe.

## Pliki

- `index.html` — interfejs i selektor scenariuszy.
- `app.js` — obsługa interfejsu, edycja profili i import/eksport.
- `scenarios.js` — katalog przykładowych scenariuszy.
- `simulation.js` — walidacja konfiguracji i silnik obliczeniowy.
- `simulation.test.js` — testy jednostkowe.
- `style.css` — style aplikacji.
