import Foundation

enum AppSettings {
    static let roundSecondsKey = "roundSeconds"
    static let soundsKey = "soundsEnabled"
    static let hapticsKey = "hapticsEnabled"
    static let seededKey = "seeded"

    static let roundOptions = [30, 60, 90, 120]

    static var roundSeconds: Int {
        let value = UserDefaults.standard.integer(forKey: roundSecondsKey)
        return value > 0 ? value : 60
    }

    static var soundsEnabled: Bool {
        UserDefaults.standard.object(forKey: soundsKey) as? Bool ?? true
    }

    static var hapticsEnabled: Bool {
        UserDefaults.standard.object(forKey: hapticsKey) as? Bool ?? true
    }
}
