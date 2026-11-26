# FlowOptima — symulator przepływu produkcji

FlowOptima to lekka aplikacja działająca w przeglądarce, która pozwala zbudować linię z kolejnych stanowisk oraz oszacować wąskie gardło, przepustowość, czas partii, przezbrojenia i WIP. Jest przeznaczona do szybkiego porównywania scenariuszy; nie zastępuje symulacji zdarzeń dyskretnych ani systemu MES.

## Funkcje

- Edycja wielkości partii, dostępnego czasu zmiany i kosztu godzinowego.
- Dodawanie, usuwanie i edycja stanowisk.
- Wykrywanie stanowiska o największym obciążeniu dla partii.
- Szacowanie czasu realizacji, przepustowości godzinowej i WIP przed wąskim gardłem.
- Udział przezbrojeń pokazywany jako procent sumarycznego obciążenia stanowisk oraz koszt setupów.
- Szacowana liczba sztuk na zmianę, uwzględniająca dostępne minuty i jedno przezbrojenie wąskiego gardła.
- Import i eksport konfiguracji JSON. Dane pozostają w przeglądarce i nie są wysyłane do serwera.

## Model i ograniczenia

Silnik jest deterministycznym, uproszczonym modelem liniowego procesu. Obciążenie stanowiska dla partii wylicza się jako:

```text
obciążenie_i_min = (czas_cyklu_i_s × wielkość_partii / 60) + przezbrojenie_i_min
```

Wąskim gardłem jest stanowisko z największym obciążeniem partii. Czas partii to przybliżony czas wypełnienia potoku: liczba sztuk pomnożona przez cykl wąskiego gardła, plus cykle pozostałych stanowisk i przezbrojenie gardła. Przepustowość godzinowa to odwrotność cyklu wąskiego gardła. Szacowana produkcja na zmianę zakłada jedno przezbrojenie gardła w danej zmianie i stałe czasy cyklu. WIP jest orientacyjnym oszacowaniem uwzględniającym tylko stanowisko bezpośrednio przed gardłem.

Model nie uwzględnia awarii, zmienności czasów, równoległych maszyn, alternatywnych tras, transportu ani braków jakościowych. Wyniki należy traktować jako porównawcze szacunki, nie gwarantowane plany produkcyjne.

## Uruchomienie

Aplikacja nie wymaga instalacji zależności. Otwórz `index.html` bezpośrednio w przeglądarce albo uruchom prosty serwer lokalny:

```bash
python3 -m http.server 8000
```

Otwórz `http://localhost:8000`.

## Testy

Silnik obliczeniowy jest oddzielony od DOM, dlatego testy można uruchomić w Node.js (wymagana wersja obsługująca `node:test`):

```bash
npm test
```

Testy obejmują walidację konfiguracji, wybór wąskiego gardła, obliczenia obciążenia, SMED, kosztu i wpływu czasu zmiany.

## Import konfiguracji

Importowany JSON musi zawierać `batchSize`, `shiftMinutes`, `hourlyCost` oraz niepustą tablicę `stations`. Każde stanowisko wymaga niepustej nazwy (maksymalnie 80 znaków), `cycleTimeSec` i `setupTimeMin`. Wartości muszą mieścić się w zakresach: partia 1–10 000 szt., zmiana 1–1440 min, koszt 0–1 000 000 PLN/h, cykl 1–3600 s i przezbrojenie 0–1440 min. Maksymalny rozmiar importowanego pliku to 1 MB. Nieprawidłowa konfiguracja nie zastępuje bieżącego scenariusza.

## Struktura

- `index.html` — interfejs aplikacji.
- `app.js` — obsługa DOM, edycja stanu oraz import/eksport.
- `simulation.js` — walidacja i czysty silnik obliczeniowy.
- `simulation.test.js` — testy jednostkowe silnika.
- `style.css` — style.
