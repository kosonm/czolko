import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @AppStorage(AppSettings.roundSecondsKey) private var roundSeconds = 60
    @AppStorage(AppSettings.soundsKey) private var sounds = true
    @AppStorage(AppSettings.hapticsKey) private var haptics = true
    @State private var confirmRestore = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Runda") {
                    Picker("Czas rundy", selection: $roundSeconds) {
                        ForEach(AppSettings.roundOptions, id: \.self) { seconds in
                            Text("\(seconds) s").tag(seconds)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                Section("Sygnały") {
                    Toggle("Dźwięki", isOn: $sounds)
                    Toggle("Wibracje", isOn: $haptics)
                }
                Section {
                    Button("Przywróć przykładowe talie") { confirmRestore = true }
                } footer: {
                    Text("Dodaje ponownie wbudowane talie. Twoje własne talie zostają.")
                }
                Section {
                    LabeledContent("Wersja", value: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "")
                }
            }
            .navigationTitle("Ustawienia")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Gotowe") { dismiss() }
                }
            }
            .confirmationDialog("Przywrócić przykładowe talie?", isPresented: $confirmRestore, titleVisibility: .visible) {
                Button("Przywróć") { SeedDecks.insertAll(context: context) }
            }
        }
    }
}
