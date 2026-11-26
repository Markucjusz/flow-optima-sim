# flow-optima-sim# FlowOptima — Symulator Przepływu Produkcji (Digital Twin Lite)

**FlowOptima** to lekka, działająca w przeglądarce aplikacja typu *White-Label* służąca do modelowania linii produkcyjnych, identyfikacji wąskich gardeł (*Bottlenecks*) oraz analizy wpływu czasów przezbrojeń (SMED) na wydajność i koszty operacyjne.

🔗 **Wersja demonstracyjna (Live Demo):** `https://TWOJ-LOGIN.github.io/flow-optima-sim/`

---

## 🎯 Problem biznesowy
W produkcji seryjnej i jednostkowej (*Make-to-Order*) zmiany w kolejności zleceń lub wydłużenie przezbrojenia na jednej maszynie często powodują nieoczekiwane zatory i narastanie zapasów produkcji w toku (WIP). Testowanie zmian organizacyjnych bezpośrednio na hali jest kosztowne i ryzykowne.

**Rozwiązanie:** Narzędzie pozwala kierownikom, planistom i liderom zespołów zasymulować zachowanie procesu w kilka sekund przed podjęciem decyzji na hali – bez konieczności instalowania specjalistycznego oprogramowania.

---

## ⚙️ Główne funkcjonalności
* **Dynamiczna identyfikacja wąskiego gardła:** Automatyczne wykrywanie stanowiska o najwyższym obciążeniu całkowitym (czas obróbki partii + czas przezbrojenia).
* **Analiza wpływu SMED:** Natychmiastowe przeliczanie udziału oraz kosztu przezbrojeń w całkowitym czasie realizacji zlecenia.
* **Szacowanie bufora WIP:** Wyliczanie liczby detali gromadzących się przed najwolniejszym ogniwem procesu.
* **Architektura „Silnik + Konfiguracja” (100% prywatności):** Aplikacja nie wysyła żadnych danych na zewnętrzne serwery. Użytkownik może korzystać z wbudowanych scenariuszy demonstracyjnych lub wczytywać i zapisywać własne profile linii produkcyjnych w lokalnych plikach `.json`.

---

## 📐 Założenia matematyczne modelu
Symulator opiera się na deterministycznym modelu przepływu potokowego:

1. **Czas obciążenia stanowiska ($T_i$):**
   $$T_i = \left(\frac{t_{cykl, i} \cdot N}{60}\right) + t_{SMED, i}$$
   *(gdzie $N$ to wielkość partii, $t_{cykl}$ to czas obróbki 1 szt. w sekundach, a $t_{SMED}$ to czas przezbrojenia w minutach)*

2. **Czas realizacji partii ($Lead\ Time$):**
   $$LT = (N \cdot t_{cykl, max}) + \sum_{i \neq max} t_{cykl, i} + t_{SMED, max}$$

3. **Bufor produkcji w toku ($WIP$ przed wąskim gardłem):**
   Wyliczany na podstawie różnicy taktów pomiędzy stanowiskiem poprzedzającym a wąskim gardłem w trakcie trwania partii.

---

## 🛠️ Stack technologiczny
* **HTML5 / CSS3** (responsywny interfejs w ciemnym motywie industrialnym, Grid/Flexbox)
* **Vanilla JavaScript (ES6+)** (logika obliczeniowa, manipulacja DOM, obsługa `FileReader` API do importu/eksportu plików JSON)
* **GitHub Pages** (hosting statyczny bez kosztów utrzymania backendu)

---

## 🚀 Jak dostosować narzędzie do własnego procesu?
1. Uruchom aplikację w przeglądarce.
2. Zmień nazwy stanowisk, czasy cyklu oraz czasy przezbrojeń za pomocą suwaków (możesz dodawać i usuwać dowolną liczbę etapów).
3. Kliknij **„Eksportuj JSON”**, aby zapisać skonfigurowany profil linii na swoim dysku lokalnym do ponownego wykorzystania.
