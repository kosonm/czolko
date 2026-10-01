import Foundation
import Observation
import UIKit

@MainActor
@Observable
final class GameViewModel {
    enum Phase: Equatable {
        case countdown(Int)
        case playing
        case feedback(correct: Bool)
        case finished
    }

    struct Answer: Identifiable {
        let id = UUID()
        let phrase: String
        let correct: Bool
    }

    private(set) var phase: Phase = .countdown(3)
    private(set) var currentPhrase = ""
    private(set) var timeRemaining: Int
    private(set) var results: [Answer] = []

    var score: Int { results.filter(\.correct).count }
    var tiltAvailable: Bool { tilt.isAvailable }

    private let allPhrases: [String]
    private let roundSeconds: Int
    private var queue: [String] = []
    private var ticker: Task<Void, Never>?
    private var feedbackTask: Task<Void, Never>?
    private let tilt = TiltDetector()
    private let feedback = FeedbackPlayer()

    init(phrases: [String], roundSeconds: Int) {
        allPhrases = phrases
        self.roundSeconds = roundSeconds
        timeRemaining = roundSeconds
    }

    func start() {
        UIApplication.shared.isIdleTimerDisabled = true
        feedback.prepare()
        tilt.onTilt = { [weak self] direction in
            Task { @MainActor in self?.handle(direction) }
        }
        tilt.start()
        restart()
    }

    func stop() {
        ticker?.cancel()
        feedbackTask?.cancel()
        tilt.stop()
        UIApplication.shared.isIdleTimerDisabled = false
    }

    func restart() {
        ticker?.cancel()
        feedbackTask?.cancel()
        results = []
        queue = allPhrases.shuffled()
        timeRemaining = roundSeconds
        phase = .countdown(3)
        feedback.play(.tick)
        ticker = Task { [weak self] in
            while let self, !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                guard !Task.isCancelled else { return }
                tick()
            }
        }
    }

    func register(correct: Bool) {
        guard phase == .playing else { return }
        results.append(Answer(phrase: currentPhrase, correct: correct))
        feedback.play(correct ? .correct : .pass)
        phase = .feedback(correct: correct)
        feedbackTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(650))
            guard let self, !Task.isCancelled, case .feedback = phase else { return }
            nextPhrase()
        }
    }

    private func handle(_ direction: TiltDetector.Tilt) {
        register(correct: direction == .down)
    }

    private func tick() {
        switch phase {
        case .countdown(let n):
            if n > 1 {
                phase = .countdown(n - 1)
                feedback.play(.tick)
            } else {
                feedback.play(.go)
                nextPhrase()
            }
        case .playing, .feedback:
            timeRemaining -= 1
            if timeRemaining <= 0 { finish() }
        case .finished:
            break
        }
    }

    private func nextPhrase() {
        guard let phrase = queue.popLast() else {
            finish()
            return
        }
        currentPhrase = phrase
        phase = .playing
    }

    private func finish() {
        ticker?.cancel()
        feedbackTask?.cancel()
        phase = .finished
        feedback.play(.timeUp)
    }
}
