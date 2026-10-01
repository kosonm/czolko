import SwiftUI
import SwiftData

struct DeckDetailView: View {
    @Bindable var deck: Deck
    var startEditingName = false

    @Environment(\.modelContext) private var context
    @State private var newPhrase = ""
    @State private var showBulkAdd = false
    @State private var playing = false
    @State private var editMode: EditMode = .inactive
    @FocusState private var focus: Field?

    private enum Field: Hashable { case name, newPhrase, phrase(Int) }

    private var playable: Int { deck.playablePhrases.count }

    var body: some View {
        List {
            Section {
                HStack(spacing: 12) {
                    TextField("🎲", text: $deck.emoji)
                        .font(.title)
                        .multilineTextAlignment(.center)
                        .frame(width: 56, height: 56)
                        .background(Color.accentColor.opacity(0.15), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .onChange(of: deck.emoji) { _, value in
                            if let last = value.last { deck.emoji = String(last) }
                        }
                    TextField("Nazwa talii", text: $deck.name)
                        .font(.title2.weight(.semibold))
                        .focused($focus, equals: .name)
                        .submitLabel(.done)
                }
                .padding(.vertical, 4)

                Button {
                    focus = nil
                    playing = true
                } label: {
                    Label("Graj", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .disabled(playable < 3)
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowBackground(Color.clear)
            } footer: {
                if playable < 3 {
                    Text("Dodaj co najmniej 3 hasła, żeby zagrać.")
                }
            }

            Section {
                ForEach(Array(deck.phrases.enumerated()), id: \.offset) { index, _ in
                    TextField("Hasło", text: phraseBinding(index))
                        .focused($focus, equals: .phrase(index))
                        .submitLabel(.next)
                        .onSubmit { focus = .newPhrase }
                }
                .onDelete { offsets in
                    deck.phrases.remove(atOffsets: offsets)
                }
                .onMove { source, destination in
                    deck.phrases.move(fromOffsets: source, toOffset: destination)
                }

                HStack {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(Color.accentColor)
                    TextField("Nowe hasło", text: $newPhrase)
                        .focused($focus, equals: .newPhrase)
                        .submitLabel(.next)
                        .onSubmit(addPhrase)
                }
            } header: {
                HStack {
                    Text(phraseCountLabel(playable))
                    Spacer()
                    Button("Dodaj wiele") { showBulkAdd = true }
                        .font(.footnote)
                        .textCase(nil)
                }
            }
        }
        .navigationTitle(deck.name.isEmpty ? "Nowa talia" : deck.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    ShareLink(item: deck.export, preview: SharePreview("\(deck.emoji) \(deck.name)")) {
                        Label("Eksportuj (JSON)", systemImage: "square.and.arrow.up")
                    }
                    Button { deck.phrases.shuffle() } label: {
                        Label("Przemieszaj", systemImage: "shuffle")
                    }
                    Button {
                        focus = nil
                        editMode = editMode.isEditing ? .inactive : .active
                    } label: {
                        Label(editMode.isEditing ? "Zakończ edycję" : "Zmień kolejność", systemImage: "line.3.horizontal")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .environment(\.editMode, $editMode)
        .sheet(isPresented: $showBulkAdd) {
            BulkAddSheet { lines in
                let existing = Set(deck.phrases.map { $0.lowercased() })
                deck.phrases.append(contentsOf: lines.filter { !existing.contains($0.lowercased()) })
            }
        }
        .fullScreenCover(isPresented: $playing) {
            GameView(deck: deck)
        }
        .onAppear {
            if startEditingName { focus = .name }
        }
        .onDisappear(perform: cleanup)
    }

    private func phraseBinding(_ index: Int) -> Binding<String> {
        Binding(
            get: { index < deck.phrases.count ? deck.phrases[index] : "" },
            set: { if index < deck.phrases.count { deck.phrases[index] = $0 } }
        )
    }

    private func addPhrase() {
        let trimmed = newPhrase.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        deck.phrases.append(trimmed)
        newPhrase = ""
        focus = .newPhrase
    }

    private func cleanup() {
        deck.phrases = deck.playablePhrases
        deck.name = deck.name.trimmingCharacters(in: .whitespaces)
        if deck.name.isEmpty && deck.phrases.isEmpty {
            context.delete(deck)
        }
    }
}
