import Foundation
import SwiftData
import SwiftUI
import UniformTypeIdentifiers

@Model
final class Deck {
    var name: String
    var emoji: String
    var phrases: [String]
    var createdAt: Date

    init(name: String, emoji: String, phrases: [String] = [], createdAt: Date = .now) {
        self.name = name
        self.emoji = emoji
        self.phrases = phrases
        self.createdAt = createdAt
    }

    var playablePhrases: [String] {
        phrases.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }

    var export: DeckExport {
        DeckExport(name: name, emoji: emoji, phrases: playablePhrases)
    }
}

struct DeckExport: Codable, Transferable {
    var name: String
    var emoji: String
    var phrases: [String]

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .json) { export in
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .withoutEscapingSlashes]
            return try encoder.encode(export)
        }
        .suggestedFileName { "\($0.name).json" }
    }

    func makeDeck() -> Deck {
        Deck(name: name, emoji: emoji.isEmpty ? "🎲" : emoji, phrases: phrases)
    }
}
