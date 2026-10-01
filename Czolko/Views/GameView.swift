import SwiftUI

struct GameView: View {
    let deck: Deck

    @Environment(\.dismiss) private var dismiss
    @State private var model: GameViewModel

    init(deck: Deck) {
        self.deck = deck
        _model = State(initialValue: GameViewModel(phrases: deck.playablePhrases,
                                                   roundSeconds: AppSettings.roundSeconds))
    }

    var body: some View {
        ZStack {
            background
                .ignoresSafeArea()
                .animation(.easeOut(duration: 0.2), value: model.phase)

            switch model.phase {
            case .countdown(let n):
                countdown(n)
            case .playing:
                phraseScreen
            case .feedback(let correct):
                feedbackScreen(correct)
            case .finished:
                SummaryView(deck: deck, results: model.results) {
                    model.restart()
                } onClose: {
                    dismiss()
                }
            }

            if model.phase != .finished {
                VStack {
                    HStack {
                        Button { dismiss() } label: {
                            Image(systemName: "xmark")
                                .font(.headline)
                                .padding(10)
                                .background(.white.opacity(0.2), in: Circle())
                        }
                        Spacer()
                        timerBadge
                    }
                    .padding()
                    Spacer()
                }
            }
        }
        .foregroundStyle(.white)
        .statusBarHidden()
        .persistentSystemOverlays(.hidden)
        .onAppear {
            OrientationLock.set(.landscape)
            model.start()
        }
        .onDisappear {
            model.stop()
            OrientationLock.set(.portrait)
        }
    }

    private var background: some View {
        let colors: [Color] = switch model.phase {
        case .feedback(true): [Color(red: 0.1, green: 0.65, blue: 0.35), Color(red: 0.05, green: 0.5, blue: 0.3)]
        case .feedback(false): [Color(red: 0.85, green: 0.25, blue: 0.25), Color(red: 0.65, green: 0.15, blue: 0.2)]
        case .finished: [Color(red: 0.15, green: 0.15, blue: 0.25), Color(red: 0.08, green: 0.08, blue: 0.15)]
        default: [Color(red: 0.38, green: 0.25, blue: 0.85), Color(red: 0.2, green: 0.12, blue: 0.55)]
        }
        return LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    private var timerBadge: some View {
        Text("\(model.timeRemaining)")
            .font(.system(.title2, design: .rounded).weight(.bold))
            .monospacedDigit()
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(.white.opacity(0.2), in: Capsule())
            .opacity(isCountingDown ? 0 : 1)
    }

    private var isCountingDown: Bool {
        if case .countdown = model.phase { return true }
        return false
    }

    private func countdown(_ n: Int) -> some View {
        VStack(spacing: 16) {
            Text("Przyłóż telefon do czoła")
                .font(.title2.weight(.medium))
                .opacity(0.85)
            Text("\(n)")
                .font(.system(size: 140, weight: .black, design: .rounded))
                .contentTransition(.numericText(countsDown: true))
                .animation(.snappy, value: n)
            HStack(spacing: 32) {
                Label("w dół = trafione", systemImage: "arrow.down")
                Label("w górę = pas", systemImage: "arrow.up")
            }
            .font(.callout)
            .opacity(0.7)
            if !model.tiltAvailable {
                Text("Brak żyroskopu: dotknij prawą stronę = trafione, lewą = pas")
                    .font(.footnote)
                    .opacity(0.7)
            }
        }
        .multilineTextAlignment(.center)
        .padding()
    }

    private var phraseScreen: some View {
        HStack(spacing: 0) {
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture { model.register(correct: false) }
            Color.clear
                .contentShape(Rectangle())
                .onTapGesture { model.register(correct: true) }
        }
        .overlay {
            Text(model.currentPhrase)
                .font(.system(size: 96, weight: .heavy, design: .rounded))
                .minimumScaleFactor(0.25)
                .lineLimit(3)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 48)
                .padding(.vertical, 72)
                .allowsHitTesting(false)
                .id(model.currentPhrase)
                .transition(.scale(scale: 0.9).combined(with: .opacity))
        }
    }

    private func feedbackScreen(_ correct: Bool) -> some View {
        VStack(spacing: 12) {
            Image(systemName: correct ? "checkmark.circle.fill" : "arrow.uturn.forward.circle.fill")
                .font(.system(size: 110))
            Text(correct ? "Trafione!" : "Pas")
                .font(.system(size: 64, weight: .black, design: .rounded))
        }
        .transition(.scale.combined(with: .opacity))
    }
}
