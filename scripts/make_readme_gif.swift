#!/usr/bin/env swift

import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fatalError("Uso: make_readme_gif.swift <directorio-de-fotogramas> <salida.gif>")
}

let fileManager = FileManager.default
let frameDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let frameURLs = try fileManager.contentsOfDirectory(
    at: frameDirectory,
    includingPropertiesForKeys: nil
).filter { $0.pathExtension.lowercased() == "png" }
 .sorted { $0.lastPathComponent < $1.lastPathComponent }

guard let firstURL = frameURLs.first,
      let firstSource = CGImageSourceCreateWithURL(firstURL as CFURL, nil),
      let firstImage = CGImageSourceCreateImageAtIndex(firstSource, 0, nil) else {
    fatalError("No hay fotogramas PNG válidos en \(frameDirectory.path)")
}

let outputWidth = 960
let aspect = CGFloat(firstImage.height) / CGFloat(firstImage.width)
let outputHeight = Int((CGFloat(outputWidth) * aspect).rounded())
let canvas = CGSize(width: outputWidth, height: outputHeight)

try fileManager.createDirectory(at: output.deletingLastPathComponent(), withIntermediateDirectories: true)
guard let destination = CGImageDestinationCreateWithURL(
    output as CFURL,
    UTType.gif.identifier as CFString,
    frameURLs.count,
    nil
) else {
    fatalError("No se pudo crear \(output.path)")
}

CGImageDestinationSetProperties(destination, [
    kCGImagePropertyGIFDictionary: [kCGImagePropertyGIFLoopCount: 0]
] as CFDictionary)

func delay(for url: URL) -> Double {
    let stem = url.deletingPathExtension().lastPathComponent
    let milliseconds = Double(stem.split(separator: "-").last ?? "800") ?? 800
    return milliseconds / 1000
}

for url in frameURLs {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        fatalError("No se pudo leer \(url.path)")
    }

    guard let context = CGContext(
        data: nil,
        width: Int(canvas.width),
        height: Int(canvas.height),
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        fatalError("No se pudo preparar el fotograma")
    }

    context.interpolationQuality = .high
    context.draw(image, in: CGRect(origin: .zero, size: canvas))
    guard let rendered = context.makeImage() else {
        fatalError("No se pudo renderizar \(url.lastPathComponent)")
    }

    let duration = delay(for: url)
    CGImageDestinationAddImage(destination, rendered, [
        kCGImagePropertyGIFDictionary: [
            kCGImagePropertyGIFDelayTime: duration,
            kCGImagePropertyGIFUnclampedDelayTime: duration
        ]
    ] as CFDictionary)
}

guard CGImageDestinationFinalize(destination) else {
    fatalError("No se pudo finalizar \(output.path)")
}

print("GIF creado con \(frameURLs.count) fotogramas: \(output.path)")
