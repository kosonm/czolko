import CoreMotion

final class TiltDetector {
    enum Tilt { case down, up }

    var onTilt: ((Tilt) -> Void)?

    private let manager = CMMotionManager()
    private var armed = true
    private let triggerThreshold = 0.55
    private let resetThreshold = 0.3

    var isAvailable: Bool { manager.isDeviceMotionAvailable }

    func start() {
        guard isAvailable, !manager.isDeviceMotionActive else { return }
        armed = false
        manager.deviceMotionUpdateInterval = 1.0 / 30.0
        manager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self, let z = motion?.gravity.z else { return }
            if armed {
                if z > triggerThreshold {
                    armed = false
                    onTilt?(.down)
                } else if z < -triggerThreshold {
                    armed = false
                    onTilt?(.up)
                }
            } else if abs(z) < resetThreshold {
                armed = true
            }
        }
    }

    func stop() {
        manager.stopDeviceMotionUpdates()
    }
}
