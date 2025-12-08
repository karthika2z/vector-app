export const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const resampleTo24k = (source: Float32Array, sourceRate: number): Float32Array => {
  if (sourceRate === 24000) return source;
  const ratio = sourceRate / 24000;
  const length = Math.round(source.length / ratio);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const p = i * ratio;
    const k = Math.floor(p);
    const t = p - k;
    // Linear interpolation
    const p0 = source[k];
    const p1 = source[k + 1] || p0;
    result[i] = p0 + (p1 - p0) * t;
  }
  return result;
};
