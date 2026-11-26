# FlowOptima — edytowalny symulator przepływu produkcji

FlowOptima to lekka aplikacja przeglądarkowa do modelowania standardowych i branżowych procesów produkcyjnych. Umożliwia edycję parametrów, analizę wąskich gardeł, SMED, czasu partii i orientacyjnego WIP.

## Dostępne scenariusze

Aplikacja domyślnie uruchamia **standardowy proces produkcyjny**:

1. Przygotowanie materiału
2. Obróbka / produkcja
3. Montaż
4. Kontrola jakości
5. Pakowanie i wydanie

Dostępne są również przykładowe scenariusze:

- **Obróbka profili CNC** — obróbka, frezowanie, gięcie i kontrola.
- **Gniazdo montażowe** — kompletacja, montaż, nitowanie i test szczelności.

Wszystkie scenariusze są edytowalne. Wystarczy zmienić nazwy stanowisk, czasy cyklu, przezbrojenia, wielkość partii, koszt lub czas zmiany. Można dodawać i usuwać stanowiska, a następnie zapisać własną konfigurację do pliku JSON.

## Personalizacja

- Nazwę stanowiska można zmienić bezpośrednio na karcie stanowiska.
- Czas cyklu i przezbrojenia można regulować suwakami.
- Liczbę etapów można dowolnie zwiększać lub ograniczać.
- Po zmianach można wybrać eksport JSON i ponownie zaimportować konfigurację na innym urządzeniu.
- Każdy scenariusz można zastąpić własnym, importując poprawny plik konfiguracji.

## Model i ograniczenia

Obliczenia bazują na deterministycznym, uproszczonym modelu przepływu potokowego:

```text
obciążenie_i = (czas_cyklu_i_s × wielkość_partii / 60) + czas_przezbrojenia_i
```

Wąskim gardłem jest stanowisko o największym obciążeniu partii. Udział SMED to suma czasów przezbrojeń w stosunku do sumarycznego obciążenia wszystkich stanowisk. Produkcja na zmianę uwzględnia długość zmiany i odejmuje przezbrojenie wąskiego gardła.

Model nie uwzględnia awarii, zmienności, równoległych maszyn, alternatywnych ścieżek ani braków jakościowych. Wyniki są orientacyjnymi szacunkami do porównań scenariuszy.

## Uruchomienie

Nie są wymagane dodatkowe zależności ani kompilacja:

```bash
python3 -m http.server 8000
```

Otwórz `http://localhost:8000`.

## Testy

```bash
npm test
```

Testy sprawdzają walidację konfiguracji i obliczenia KPI silnika niezależnego od interfejsu DOM.

## Import i eksport JSON

Plik musi zawierać:

- `name` — opcjonalna nazwa własnego scenariusza,
- `batchSize` — wielkość partii,
- `shiftMinutes` — czas dostępny na zmianie,
- `hourlyCost` — koszt godzinowy,
- `stations` — co najmniej jedno stanowisko.

Każde stanowisko musi mieć `name`, `cycleTimeSec` i `setupTimeMin`. Maksymalny rozmiar pliku to 1 MB. Nieprawidłowa konfiguracja nie zastępuje bieżącego stanu aplikacji.

## Struktura

- `index.html` — interfejs i lista edytowalnych stanowisk,
- `app.js` — scenariusze, stan aplikacji i obsługa zdarzeń,
- `simulation.js` — walidacja i silnik obliczeniowy,
- `simulation.test.js` — testy jednostkowe,
- `style.css` — wygląd aplikacji.
