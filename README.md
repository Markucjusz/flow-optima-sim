# flow-optima-sim — FlowOptima

Aplikacja typu Digital Twin Lite do modelowania przepływu produkcji w przeglądarce.

## Live Demo

https://Markucjusz.github.io/flow-optima-sim/

## Funkcje

- identyfikacja wąskiego gardła z uwzględnieniem dostępności stanowisk,
- przezbrojenia SMED i ich koszty,
- przestoje awaryjne o konfigurowanej częstotliwości i czasie trwania,
- zmienne czasy cyklu, dostępność, bufory i wielkość partii,
- zapis scenariuszy w pamięci lokalnej przeglądarki,
- eksport i walidowany import konfiguracji JSON,
- responsywny interfejs i komunikaty o błędach.

## Model

Czas obróbki jest korygowany o dostępność stanowiska:

```
czas efektywny = czas obróbki / (dostępność / 100)
czas przestojów = liczba przewidywanych awarii × czas awarii
obciążenie = czas efektywny + SMED + czas przestojów
```

Wąskie gardło to stanowisko o największym obciążeniu całkowitym. Wartości są deterministycznymi estymacjami na potrzeby porównań scenariuszy, a nie modelem Monte Carlo.

## Uruchomienie

Otwórz `index.html` bezpośrednio lub uruchom lokalny serwer:

```bash
python3 -m http.server 8000
```

Następnie przejdź pod adres `http://localhost:8000`.

## Technologie

HTML5, CSS3 i Vanilla JavaScript, bez zależności i backendu.
