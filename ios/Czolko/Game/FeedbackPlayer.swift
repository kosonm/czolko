import AudioToolbox
import UIKit

enum FeedbackEvent {
    case tick, go, correct, pass, timeUp

    var systemSoundID: SystemSoundID {
        switch self {
        case .tick: 1057
        case .go: 1113
        case .correct: 1054
        case .pass: 1053
        case .timeUp: 1005
        }
    }
}

@MainActor
final class FeedbackPlayer {
    private let notification = UINotificationFeedbackGenerator()
    private let impact = UIImpactFeedbackGenerator(style: .medium)

    func prepare() {
        notification.prepare()
        impact.prepare()
    }

    func play(_ event: FeedbackEvent) {
        if AppSettings.soundsEnabled {
            AudioServicesPlaySystemSound(event.systemSoundID)
        }
        guard AppSettings.hapticsEnabled else { return }
        switch event {
        case .tick: impact.impactOccurred(intensity: 0.6)
        case .go: impact.impactOccurred(intensity: 1.0)
        case .correct: notification.notificationOccurred(.success)
        case .pass: notification.notificationOccurred(.warning)
        case .timeUp: notification.notificationOccurred(.error)
        }
    }
}
