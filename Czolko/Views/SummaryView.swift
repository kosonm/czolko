import SwiftUI

struct SummaryView: View {
    let deck: Deck
    let results: [GameViewModel.Answer]
    let onRestart: () -> Void
    let onClose: () -> Void

    private var correct: Int { results.filter(\.correct).count }

    var body: some View {
        HStack(spacing: 24) {
            VStack(spacing: 8) {
                Text(deck.emoji)
                    .font(.system(size: 44))
                Text(deck.name)
                    .font(.headline)
                    .opacity(0.8)
                Text("\(correct)")
                    .font(.system(size: 120, weight: .black, design: .rounded))
                    .monospacedDigit()
                Text(correct == 1 ? "trafione hasło" : "trafionych haseł")
                    .font(.title3)
                    .opacity(0.8)
                Spacer(minLength: 0)
                HStack(spacing: 12) {
                    Button(action: onRestart) {
                        Label("Jeszcze raz", systemImage: "arrow.counterclockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.white)
                    .foregroundStyle(Color(red: 0.15, green: 0.15, blue: 0.25))
                    Button(action: onClose) {
                        Label("Zakończ", systemImage: "xmark")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.white)
                }
                .controlSize(.large)
            }
            .frame(maxWidth: .infinity)

            if !results.isEmpty {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(results) { result in
                            HStack(spacing: 12) {
                                Image(systemName: result.correct ? "checkmark.circle.fill" : "xmark.circle")
                                    .foregroundStyle(result.correct ? .green : .red.opacity(0.9))
                                Text(result.phrase)
                                    .lineLimit(1)
                                Spacer()
                            }
                            .font(.title3)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                    }
                }
                .scrollIndicators(.hidden)
                .frame(maxWidth: .infinity)
            }
        }
        .padding(24)
    }
}
