# WordTrip 🚐

**An offline-first language learning app that turns vocabulary building into a road trip.**

WordTrip is a flashcard app with spaced repetition, in the spirit of Anki, built for learning a language from zero up to fluency (CEFR B2). It starts with English for Portuguese speakers and is designed to support more languages later (Spanish is next).

> 🚧 **Status:** planning complete, version 1 (pilot) in development.

## Why another flashcard app?

Most flashcard apps show a word in your native language and ask for the translation. But words have many meanings: the Portuguese *carregar* can be *load*, *carry* or *charge*, and the card gives you no way to know which one it wants.

WordTrip fixes this by making **each card one specific meaning (sense)** of a word:

- An English dictionary definition plus an example sentence with a blank to fill in.
- An optional Portuguese translation, which lowers your score when used.
- IPA transcription on every word, in both American and British English, plus a dedicated track to learn to read IPA, with each sound compared to Portuguese.

## Features (planned for v1)

- **Context-based cards:** definition + fill-in-the-blank sentence, one card per sense.
- **Multiple choice → typing:** each sense moves from multiple choice to typing as you master it.
- **Weighted self-assessment:** you rate each card from 0 to 10, and the app adjusts that rating for typos, wrong answers, hints and translation use.
- **FSRS scheduling:** modern spaced repetition via [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs).
- **Review backlog protection:** a recovery mode, priority by forgetting risk, and a 7-day workload forecast.
- **Road-trip journey:** each CEFR level is a leg of a motorhome trip from Brazil through Latin America and North America to New York. Each phase is a city with its landmark illustration, and each city ends with a boss battle. You pick your character, name your motorhome and bring an optional pet.
- **Side trips:** free practice by topic (travel, food, shopping...) outside the main route; words keep their history when they reappear on the journey.
- **Explorer mode:** save words you meet in podcasts and books, pick the right sense from an offline dictionary (WordNet), and review them with spaced repetition.
- **Traffic-light progress:** red = learning, yellow = young, green = learned (21+ day interval).
- **Dashboard:** words learned, hardest words, study time, and performance by topic.
- **Pomodoro timer, daily plan, streaks, XP and personal rewards.**
- **100% offline and free:** your data stays on your device, with manual backup export/import.

## Tech stack

- Progressive Web App (installable on phone and desktop, works offline)
- Local storage with IndexedDB
- FSRS spaced repetition (ts-fsrs)
- Browser speech synthesis for audio
- Open data: WordNet, Wiktionary, Tatoeba, open frequency/CEFR lists
- Hosted for free on GitHub Pages

## How this project is built

I'm building this app with **AI-assisted development using [Claude Code](https://claude.com/claude-code)**. I define the product vision, learning design and requirements, and review every version, while Claude writes the code. It's also an experiment in how far a non-developer can take a real product with AI.

## Data sources and licenses

Word data comes from open sources, credited here once they are integrated: WordNet (Princeton), Wiktionary (CC BY-SA), Tatoeba (CC BY 2.0 FR) and open frequency lists.

## License

Code: [MIT](LICENSE). Word data: CC BY-SA 4.0, as required by its sources.
