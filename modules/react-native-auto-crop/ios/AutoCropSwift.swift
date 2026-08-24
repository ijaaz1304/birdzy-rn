import Vision
import UIKit
import CoreImage

public class AutoCropSwift: NSObject {

    @objc
    public func cropImage(
        _ imageURI: String,
        paddingRatio: Double,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        let startedAt = Date().timeIntervalSince1970 * 1000
        let padding = Float(min(max(paddingRatio, 0), 0.5))

        #if targetEnvironment(simulator)
        resolve(buildFallback(
            originalUri: imageURI,
            startedAt: startedAt,
            reason: "simulator",
            paddingRatio: padding
        ))
        return
        #endif

        guard #available(iOS 17.0, *) else {
            resolve(buildFallback(
                originalUri: imageURI,
                startedAt: startedAt,
                reason: "REQUIRES_API_FALLBACK",
                paddingRatio: padding
            ))
            return
        }

        guard let url = URL(string: imageURI) else {
            resolve(buildFallback(
                originalUri: imageURI,
                startedAt: startedAt,
                reason: "invalid_url",
                paddingRatio: padding
            ))
            return
        }

        guard let originalImage = CIImage(contentsOf: url, options: [.applyOrientationProperty: true]) else {
            resolve(buildFallback(
                originalUri: imageURI,
                startedAt: startedAt,
                reason: "unable_to_load_image",
                paddingRatio: padding
            ))
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            autoreleasepool {
                guard let maskImage = self.createMask(from: originalImage) else {
                    DispatchQueue.main.async {
                        resolve(self.buildFallback(
                            originalUri: imageURI,
                            startedAt: startedAt,
                            reason: "no_subject_mask",
                            paddingRatio: padding
                        ))
                    }
                    return
                }

                guard let bounds = self.findSubjectBounds(in: maskImage) else {
                    DispatchQueue.main.async {
                        resolve(self.buildFallback(
                            originalUri: imageURI,
                            startedAt: startedAt,
                            reason: "no_foreground_pixels",
                            paddingRatio: padding
                        ))
                    }
                    return
                }

                let padded = self.expandBounds(bounds, paddingRatio: Double(padding), within: originalImage.extent)
                let cropped = originalImage.cropped(to: padded)
                let context = CIContext()

                guard let cgImage = context.createCGImage(cropped, from: cropped.extent) else {
                    DispatchQueue.main.async {
                        resolve(self.buildFallback(
                            originalUri: imageURI,
                            startedAt: startedAt,
                            reason: "render_failed",
                            paddingRatio: padding
                        ))
                    }
                    return
                }

                let uiImage = UIImage(cgImage: cgImage)
                let tempURL = URL(fileURLWithPath: NSTemporaryDirectory())
                    .appendingPathComponent("autocrop_\(Int(Date().timeIntervalSince1970)).jpg")

                guard let data = uiImage.jpegData(compressionQuality: 0.92) else {
                    DispatchQueue.main.async {
                        resolve(self.buildFallback(
                            originalUri: imageURI,
                            startedAt: startedAt,
                            reason: "encode_failed",
                            paddingRatio: padding
                        ))
                    }
                    return
                }

                do {
                    try data.write(to: tempURL, options: .atomic)
                    let paddedBounds = self.boundsFromRect(padded, origin: originalImage.extent.origin)
                    DispatchQueue.main.async {
                        resolve(self.buildSuccess(
                            imageURI: tempURL.absoluteString,
                            originalUri: imageURI,
                            startedAt: startedAt,
                            bounds: bounds,
                            padded: paddedBounds,
                            paddingRatio: padding
                        ))
                    }
                } catch {
                    DispatchQueue.main.async {
                        resolve(self.buildFallback(
                            originalUri: imageURI,
                            startedAt: startedAt,
                            reason: error.localizedDescription,
                            paddingRatio: padding
                        ))
                    }
                }
            }
        }
    }

    @objc
    public func flattenCutoutOnWhite(
        _ imageURI: String,
        quality: Double,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let url = URL(string: imageURI),
              let data = try? Data(contentsOf: url),
              let cutout = UIImage(data: data) else {
            reject("AutoCrop", "unable_to_load_image", NSError(domain: "AutoCrop", code: 1))
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            autoreleasepool {
                let size = cutout.size
                let renderer = UIGraphicsImageRenderer(size: size)
                let flattened = renderer.image { ctx in
                    UIColor.white.setFill()
                    ctx.fill(CGRect(origin: .zero, size: size))
                    cutout.draw(in: CGRect(origin: .zero, size: size))
                }

                let q = CGFloat(min(max(quality, 0.01), 1.0))
                let tempURL = URL(fileURLWithPath: NSTemporaryDirectory())
                    .appendingPathComponent("flatten_\(Int(Date().timeIntervalSince1970)).jpg")

                guard let jpeg = flattened.jpegData(compressionQuality: q) else {
                    DispatchQueue.main.async {
                        reject("AutoCrop", "encode_failed", NSError(domain: "AutoCrop", code: 2))
                    }
                    return
                }

                do {
                    try jpeg.write(to: tempURL, options: .atomic)
                    DispatchQueue.main.async {
                        resolve([
                            "uri": tempURL.absoluteString,
                            "applied": true,
                        ])
                    }
                } catch {
                    DispatchQueue.main.async { reject("AutoCrop", "save_failed", error) }
                }
            }
        }
    }

    @available(iOS 17.0, *)
    private func createMask(from inputImage: CIImage) -> CIImage? {
        let request = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(ciImage: inputImage)
        do {
            try handler.perform([request])
            if let result = request.results?.first {
                let mask = try result.generateScaledMaskForImage(
                    forInstances: result.allInstances,
                    from: handler
                )
                return CIImage(cvPixelBuffer: mask)
            }
        } catch {
            print("[AutoCrop] mask error: \(error)")
        }
        return nil
    }

    private struct CropBounds {
        let minX: Int
        let minY: Int
        let maxX: Int
        let maxY: Int
        var width: Int { maxX - minX + 1 }
        var height: Int { maxY - minY + 1 }
    }

    @available(iOS 17.0, *)
    private func findSubjectBounds(in maskImage: CIImage) -> CropBounds? {
        let context = CIContext()
        let extent = maskImage.extent.integral
        let width = Int(extent.width)
        let height = Int(extent.height)
        guard width > 0, height > 0,
              let cgImage = context.createCGImage(maskImage, from: extent) else {
            return nil
        }

        let bytesPerPixel = 4
        let bytesPerRow = width * bytesPerPixel
        guard let ctx = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }

        ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard let data = ctx.data else { return nil }
        let buffer = data.bindMemory(to: UInt8.self, capacity: width * height * bytesPerPixel)

        var minX = width
        var minY = height
        var maxX = -1
        var maxY = -1

        for y in 0..<height {
            for x in 0..<width {
                let idx = (y * width + x) * bytesPerPixel
                if buffer[idx] > 20 {
                    if x < minX { minX = x }
                    if x > maxX { maxX = x }
                    if y < minY { minY = y }
                    if y > maxY { maxY = y }
                }
            }
        }

        guard maxX >= 0, maxY >= 0 else { return nil }
        return CropBounds(minX: minX, minY: minY, maxX: maxX, maxY: maxY)
    }

    @available(iOS 17.0, *)
    private func expandBounds(
        _ bounds: CropBounds,
        paddingRatio: Double,
        within extent: CGRect
    ) -> CGRect {
        let boxW = CGFloat(bounds.width)
        let boxH = CGFloat(bounds.height)
        let padX = boxW * CGFloat(paddingRatio)
        let padY = boxH * CGFloat(paddingRatio)

        var rect = CGRect(
            x: extent.origin.x + CGFloat(bounds.minX) - padX,
            y: extent.origin.y + CGFloat(bounds.minY) - padY,
            width: boxW + padX * 2,
            height: boxH + padY * 2
        )
        rect = rect.intersection(extent)
        return rect.isNull ? extent : rect
    }

    private func boundsFromRect(_ rect: CGRect, origin: CGPoint) -> CropBounds {
        CropBounds(
            minX: Int(rect.origin.x - origin.x),
            minY: Int(rect.origin.y - origin.y),
            maxX: Int(rect.origin.x - origin.x + rect.width) - 1,
            maxY: Int(rect.origin.y - origin.y + rect.height) - 1
        )
    }

    private func boundsDict(_ bounds: CropBounds) -> [String: Any] {
        [
            "x": bounds.minX,
            "y": bounds.minY,
            "width": bounds.width,
            "height": bounds.height,
        ]
    }

    private func buildSuccess(
        imageURI: String,
        originalUri: String,
        startedAt: Double,
        bounds: CropBounds,
        padded: CropBounds,
        paddingRatio: Float
    ) -> [String: Any] {
        let now = Date().timeIntervalSince1970 * 1000
        return [
            "uri": imageURI,
            "originalUri": originalUri,
            "applied": true,
            "reason": "applied",
            "boundingBox": boundsDict(bounds),
            "paddedBoundingBox": boundsDict(padded),
            "paddingRatio": Double(paddingRatio),
            "cropWidth": padded.width,
            "cropHeight": padded.height,
            "durationMs": now - startedAt,
        ]
    }

    private func buildFallback(
        originalUri: String,
        startedAt: Double,
        reason: String,
        paddingRatio: Float
    ) -> [String: Any] {
        let now = Date().timeIntervalSince1970 * 1000
        return [
            "uri": originalUri,
            "originalUri": originalUri,
            "applied": false,
            "reason": reason,
            "paddingRatio": Double(paddingRatio),
            "durationMs": now - startedAt,
        ]
    }
}
