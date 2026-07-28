// 어두운 곳일수록 촘촘한 문자를, 밝은 곳일수록 성긴 문자를 사용합니다.
const RAMP = ' .:-=+*#%@';
// 모노스페이스 글자는 폭보다 높이가 커서, 세로 칸 수를 줄여 보정합니다.
const CHAR_ASPECT = 0.5;

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// cols: 원하는 가로 문자 수. 세로가 너무 긴 이미지(세로 사진 등)는 메시지 길이 제한을
// 넘지 않도록 maxChars 기준으로 자동으로 더 줄입니다.
export function imageToAscii(img, { cols = 70, maxChars = 3500 } = {}) {
  const ratio = img.height / img.width;
  let width = Math.max(10, Math.min(160, Math.round(cols)));
  let height = Math.max(1, Math.round(width * ratio * CHAR_ASPECT));

  if (height * (width + 1) > maxChars) {
    width = Math.max(10, Math.floor(Math.sqrt(maxChars / (ratio * CHAR_ASPECT))));
    height = Math.max(1, Math.round(width * ratio * CHAR_ASPECT));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let out = '';
  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      const brightness = alpha === 0 ? 255 : 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const idx = Math.min(RAMP.length - 1, Math.floor(((255 - brightness) / 255) * RAMP.length));
      line += RAMP[idx];
    }
    out += line + (y < height - 1 ? '\n' : '');
  }
  return out;
}
