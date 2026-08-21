#!/usr/bin/env swift

import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct Frame {
    let asset: String
    let delay: Double
    let x: CGFloat
    let y: CGFloat
    let scale: CGFloat

    init(_ asset: String, _ delay: Double, x: CGFloat = 0, y: CGFloat = 0, scale: CGFloat = 1) {
        self.asset = asset
        self.delay = delay
        self.x = x
        self.y = y
        self.scale = scale
    }
}

let fileManager = FileManager.default
let root = URL(fileURLWithPath: fileManager.currentDirectoryPath)
let imageDirectory = root.appendingPathComponent("assets/images", isDirectory: true)
let canvas = CGSize(width: 720, height: 820)

func loadImage(named name: String) -> CGImage {
    let url = imageDirectory.appendingPathComponent("\(name).png")
    guard
        let source = CGImageSourceCreateWithURL(url as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else {
        fatalError("No se pudo cargar \(url.path)")
    }
    return image
}

func renderedFrame(_ frame: Frame) -> CGImage {
    let source = loadImage(named: frame.asset)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue
    guard let context = CGContext(
        data: nil,
        width: Int(canvas.width),
        height: Int(canvas.height),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: bitmapInfo
    ) else {
        fatalError("No se pudo crear el lienzo")
    }

    context.clear(CGRect(origin: .zero, size: canvas))
    context.interpolationQuality = .high

    let sourceSize = CGSize(width: source.width, height: source.height)
    let safeArea = CGSize(width: 650, height: 770)
    let fitScale = min(safeArea.width / sourceSize.width, safeArea.height / sourceSize.height)
    let drawSize = CGSize(
        width: sourceSize.width * fitScale * frame.scale,
        height: sourceSize.height * fitScale * frame.scale
    )
    let drawRect = CGRect(
        x: (canvas.width - drawSize.width) / 2 + frame.x,
        y: 18 + frame.y,
        width: drawSize.width,
        height: drawSize.height
    )
    context.draw(source, in: drawRect)

    guard let result = context.makeImage() else {
        fatalError("No se pudo renderizar el fotograma")
    }
    return result
}

func makeGif(named name: String, frames: [Frame]) {
    let output = imageDirectory.appendingPathComponent(name)
    guard let destination = CGImageDestinationCreateWithURL(
        output as CFURL,
        UTType.gif.identifier as CFString,
        frames.count,
        nil
    ) else {
        fatalError("No se pudo crear \(output.path)")
    }

    let gifProperties: [CFString: Any] = [
        kCGImagePropertyGIFDictionary: [
            kCGImagePropertyGIFLoopCount: 0
        ]
    ]
    CGImageDestinationSetProperties(destination, gifProperties as CFDictionary)

    for frame in frames {
        let frameProperties: [CFString: Any] = [
            kCGImagePropertyGIFDictionary: [
                kCGImagePropertyGIFDelayTime: frame.delay,
                kCGImagePropertyGIFUnclampedDelayTime: frame.delay
            ]
        ]
        CGImageDestinationAddImage(destination, renderedFrame(frame), frameProperties as CFDictionary)
    }

    guard CGImageDestinationFinalize(destination) else {
        fatalError("No se pudo finalizar \(output.path)")
    }
    print("Creado: \(output.path) (\(frames.count) fotogramas)")
}

let idleFrames: [Frame] = [
    Frame("nimbo-guide", 0.20, y: 0),
    Frame("nimbo-guide", 0.20, y: 2, scale: 1.002),
    Frame("nimbo-guide", 0.20, y: 4, scale: 1.004),
    Frame("nimbo-guide", 0.20, y: 2, scale: 1.002),
    Frame("nimbo-guide", 0.70, y: 0),
    Frame("nimbo-blink-half", 0.07, y: 1),
    Frame("nimbo-blink-closed", 0.08, y: 1),
    Frame("nimbo-blink-half", 0.07, y: 1),
    Frame("nimbo-guide", 0.18, y: 0),
    Frame("nimbo-talking", 0.16, y: 2),
    Frame("nimbo-guide", 0.14, y: 0),
    Frame("nimbo-talking", 0.16, y: 2),
    Frame("nimbo-guide", 0.55, y: 0),
    Frame("nimbo-wave-low", 0.16, x: -1, y: 1),
    Frame("nimbo-wave-high", 0.18, x: 1, y: 3, scale: 1.004),
    Frame("nimbo-wave-low", 0.16, x: -1, y: 1),
    Frame("nimbo-wave-high", 0.18, x: 1, y: 3, scale: 1.004),
    Frame("nimbo-wave-low", 0.18, x: -1, y: 1),
    Frame("nimbo-guide", 0.60, y: 0),
    Frame("nimbo-curious", 0.48, x: 1, y: 2),
    Frame("nimbo-guide", 0.22, y: 0),
    Frame("nimbo-blink-half", 0.07, y: 1),
    Frame("nimbo-blink-closed", 0.08, y: 1),
    Frame("nimbo-blink-half", 0.07, y: 1),
    Frame("nimbo-guide", 0.60, y: 0)
]

let celebrationFrames: [Frame] = [
    Frame("nimbo-proud", 0.30, y: 0),
    Frame("nimbo-proud", 0.26, y: 4, scale: 1.006),
    Frame("nimbo-celebrating", 0.34, y: 8, scale: 1.012),
    Frame("nimbo-proud", 0.24, y: 4, scale: 1.006),
    Frame("nimbo-celebrating", 0.34, y: 8, scale: 1.012),
    Frame("nimbo-proud", 0.65, y: 0),
    Frame("nimbo-blink-half", 0.07, y: 1),
    Frame("nimbo-blink-closed", 0.08, y: 1),
    Frame("nimbo-blink-half", 0.07, y: 1),
    Frame("nimbo-proud", 0.52, y: 0)
]

makeGif(named: "nimbo-alive.gif", frames: idleFrames)
makeGif(named: "nimbo-celebrating.gif", frames: celebrationFrames)
