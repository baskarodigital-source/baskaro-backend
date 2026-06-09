const IMAGE_SIGNATURES = [
  {
    mime: 'image/jpeg',
    test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    test: (b) => b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/gif',
    test: (b) => b.length >= 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  },
  {
    mime: 'image/webp',
    test: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
]

/** Detect image MIME from buffer header (extensionless Windows uploads). */
export function sniffImageMimeFromBuffer(buffer) {
  if (!buffer?.length) return null
  const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)
  return IMAGE_SIGNATURES.find((sig) => sig.test(b))?.mime || null
}

export function isImageBuffer(buffer) {
  return Boolean(sniffImageMimeFromBuffer(buffer))
}
