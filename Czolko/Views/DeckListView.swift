import SwiftUI
import SwiftData

struct DeckListView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Deck.createdAt) private var decks: [Deck]

    @State private var showSettings = false
    @State private var showImporter = false
    @State private var playingDeck: Deck?
    @State private var newDeck: Deck?
    @State private var importError: String?

    var body: some View {
        NavigationStack {
            Group {
                if decks.isEmpty {
                    ContentUnavailableView("Brak talii", systemImage: "rectangle.stack.badge.plus",
                                           description: Text("Dodaj pierwszą talię przyciskiem +"))
                } else {
                    List {
                        ForEach(decks) { deck in
                            DeckRow(deck: deck) { playingDeck = deck }
                        }
                        .onDelete(perform: delete)
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Czółko")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button { showSettings = true } label: { Image(systemName: "gearshape") }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button { addDeck() } label: { Label("Nowa talia", systemImage: "plus") }
                        Button { showImporter = true } label: { Label("Importuj z pliku", systemImage: "square.and.arrow.down") }
                    } label: {
                        Image(systemName: "plus")
                    } primaryAction: {
                        addDeck()
                    }
                }
            }
            .navigationDestination(item: $newDeck) { deck in
                DeckDetailView(deck: deck, startEditingName: true)
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .fullScreenCover(item: $playingDeck) { deck in
                GameView(deck: deck)
            }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json]) { result in
                importDeck(result)
            }
            .alert("Nie udało się zaimportować", isPresented: Binding(
                get: { importError != nil }, set: { if !$0 { importError = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(importError ?? "")
            }
        }
        .onAppear { SeedDecks.seedIfNeeded(context: context) }
    }

    private func addDeck() {
        let deck = Deck(name: "", emoji: "🎲")
        context.insert(deck)
        newDeck = deck
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { context.delete(decks[index]) }
    }

    private func importDeck(_ result: Result<URL, Error>) {
        do {
            let url = try result.get()
            let accessed = url.startAccessingSecurityScopedResource()
            defer { if accessed { url.stopAccessingSecurityScopedResource() } }
            let data = try Data(contentsOf: url)
            let export = try JSONDecoder().decode(DeckExport.self, from: data)
            context.insert(export.makeDeck())
        } catch {
            importError = error.localizedDescription
        }
    }
}

private struct DeckRow: View {
    let deck: Deck
    let onPlay: () -> Void

    var body: some View {
        NavigationLink {
            DeckDetailView(deck: deck)
        } label: {
            HStack(spacing: 14) {
                Text(deck.emoji)
                    .font(.title)
                    .frame(width: 48, height: 48)
                    .background(Color.accentColor.opacity(0.15), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(deck.name.isEmpty ? "Bez nazwy" : deck.name)
                        .font(.headline)
                    Text(phraseCountLabel(deck.playablePhrases.count))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: onPlay) {
                    Image(systemName: "play.fill")
                        .font(.body.weight(.semibold))
                        .padding(10)
                        .background(Color.accentColor, in: Circle())
                        .foregroundStyle(.white)
                }
                .buttonStyle(.borderless)
                .disabled(deck.playablePhrases.count < 3)
                .opacity(deck.playablePhrases.count < 3 ? 0.3 : 1)
            }
            .padding(.vertical, 4)
        }
    }
}

func phraseCountLabel(_ count: Int) -> String {
    let rem10 = count % 10, rem100 = count % 100
    if count == 1 { return "1 hasło" }
    if (2...4).contains(rem10) && !(12...14).contains(rem100) { return "\(count) hasła" }
    return "\(count) haseł"
}
