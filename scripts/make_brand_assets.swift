#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let fileManager = FileManager.default
let root = URL(fileURLWithPath: fileManager.currentDirectoryPath)
let sourceURL = root.appendingPathComponent("assets/brand/nimbo-mark-imagegen-source.png")

let accent: (UInt8, UInt8, UInt8) = (0xD7, 0xF6, 0x4A)
let navy: (UInt8, UInt8, UInt8) = (0x10, 0x1D, 0x2C)

guard
    let source = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
    let sourceImage = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
    fatalError("No se pudo cargar \(sourceURL.path)")
}

let width = sourceImage.width
let height = sourceImage.height
let bytesPerRow = width * 4
var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue

guard let sourceContext = CGContext(
    data: &pixels,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: colorSpace,
    bitmapInfo: bitmapInfo
) else {
    fatalError("No se pudo crear el contexto de color")
}

sourceContext.interpolationQuality = .high
sourceContext.draw(sourceImage, in: CGRect(x: 0, y: 0, width: width, height: height))

// La propuesta elegida de ImageGen tenía la paleta inversa. Se intercambian
// los dos campos de color de forma determinista para conservar su silueta y
// entregar exactamente los tokens de marca, sin gradientes ni ruido.
for offset in stride(from: 0, to: pixels.count, by: 4) {
    let alpha = pixels[offset + 3]
    if alpha == 0 { continue }

    let red = Double(pixels[offset])
    let green = Double(pixels[offset + 1])
    let blue = Double(pixels[offset + 2])
    let luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
    let replacement = luminance > 112 ? navy : accent

    pixels[offset] = replacement.0
    pixels[offset + 1] = replacement.1
    pixels[offset + 2] = replacement.2
}

guard let recoloredImage = sourceContext.makeImage() else {
    fatalError("No se pudo crear la marca recoloreada")
}

func scaledImage(_ image: CGImage, size: Int) -> CGImage {
    guard let context = CGContext(
        data: nil,
        width: size,
        height: size,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: bitmapInfo
    ) else {
        fatalError("No se pudo crear el lienzo de \(size) px")
    }

    context.clear(CGRect(x: 0, y: 0, width: size, height: size))
    context.interpolationQuality = .high
    context.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))
    guard let result = context.makeImage() else {
        fatalError("No se pudo escalar la marca a \(size) px")
    }
    return result
}

func writePNG(_ image: CGImage, to relativePath: String) {
    let outputURL = root.appendingPathComponent(relativePath)
    guard let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    ) else {
        fatalError("No se pudo crear \(outputURL.path)")
    }

    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        fatalError("No se pudo escribir \(outputURL.path)")
    }
    print("Creado: \(outputURL.path) (\(image.width)x\(image.height))")
}

writePNG(scaledImage(recoloredImage, size: 1024), to: "assets/brand/nimbo-mark.png")
writePNG(scaledImage(recoloredImage, size: 128), to: "assets/brand/nimbo-mark-128.png")
writePNG(scaledImage(recoloredImage, size: 180), to: "assets/apple-touch-icon.png")
writePNG(scaledImage(recoloredImage, size: 32), to: "assets/favicon-32.png")

