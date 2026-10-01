import Foundation
import SwiftData

enum SeedDecks {
    static func seedIfNeeded(context: ModelContext) {
        guard !UserDefaults.standard.bool(forKey: AppSettings.seededKey) else { return }
        insertAll(context: context)
        UserDefaults.standard.set(true, forKey: AppSettings.seededKey)
    }

    static func insertAll(context: ModelContext) {
        for (offset, deck) in all.enumerated() {
            context.insert(Deck(name: deck.name, emoji: deck.emoji, phrases: deck.phrases,
                                createdAt: .now.addingTimeInterval(TimeInterval(offset))))
        }
    }

    static let all: [DeckExport] = [
        DeckExport(name: "Zwierzęta", emoji: "🦒", phrases: [
            "Słoń", "Żyrafa", "Pingwin", "Kangur", "Krokodyl", "Delfin", "Papuga", "Wiewiórka",
            "Jeż", "Flamingo", "Hipopotam", "Chomik", "Orzeł", "Rekin", "Lew", "Zebra",
            "Ośmiornica", "Bocian", "Sowa", "Koala",
        ]),
        DeckExport(name: "Filmy i seriale", emoji: "🎬", phrases: [
            "Shrek", "Titanic", "Harry Potter", "Gwiezdne wojny", "Król Lew", "Matrix", "Ranczo",
            "Kiler", "Seksmisja", "Chłopaki nie płaczą", "Władca Pierścieni", "Gra o tron",
            "Stranger Things", "Kevin sam w domu", "Piraci z Karaibów", "Park Jurajski",
            "Dzień świra", "Rejs", "Sami swoi", "Avatar",
        ]),
        DeckExport(name: "Zawody", emoji: "👩‍🚒", phrases: [
            "Strażak", "Kucharz", "Fryzjer", "Dentysta", "Pilot", "Nauczyciel", "Mechanik",
            "Programista", "Chirurg", "Policjant", "Listonosz", "Hydraulik", "Fotograf",
            "Kierowca autobusu", "Weterynarz", "Pszczelarz", "Kominiarz", "Sędzia", "Barman",
            "Ratownik",
        ]),
        DeckExport(name: "Jedzenie", emoji: "🥟", phrases: [
            "Pierogi", "Pizza", "Sushi", "Bigos", "Żurek", "Lody", "Spaghetti", "Schabowy", "Kebab",
            "Pączek", "Gofry", "Rosół", "Oscypek", "Naleśniki", "Hamburger", "Zapiekanka", "Sernik",
            "Placki ziemniaczane", "Kiszony ogórek", "Popcorn",
        ]),
        DeckExport(name: "Pokaż to!", emoji: "🤸", phrases: [
            "Jazda na rowerze", "Mycie zębów", "Pływanie", "Granie na gitarze", "Jedzenie spaghetti",
            "Odkurzanie", "Robienie selfie", "Skakanie na skakance", "Kichanie", "Łowienie ryb",
            "Prasowanie", "Taniec w deszczu", "Wspinaczka", "Gra w tenisa", "Zasypianie",
            "Pieczenie ciasta", "Parkowanie samochodu", "Zakładanie skarpetek", "Łapanie komara",
            "Czytanie gazety",
        ]),
        DeckExport(name: "Sławne osoby", emoji: "⭐️", phrases: [
            "Robert Lewandowski", "Adam Małysz", "Iga Świątek", "Fryderyk Chopin",
            "Maria Skłodowska-Curie", "Mikołaj Kopernik", "Jan Paweł II", "Lech Wałęsa", "Doda",
            "Kuba Wojewódzki", "Michael Jackson", "Elon Musk", "Albert Einstein",
            "Leonardo da Vinci", "Taylor Swift", "Cristiano Ronaldo", "Robert Kubica",
            "Andrzej Sapkowski", "Madonna", "Napoleon",
        ]),
    ]
}
