export async function compressImage(file: File, maxDimension = 1600, quality = 0.7): Promise<string> {
  const img = document.createElement("img");
  const reader = new FileReader();

  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  let { width, height } = img;
  if (width > height && width > maxDimension) {
    height = (height * maxDimension) / width;
    width = maxDimension;
  } else if (height > maxDimension) {
    width = (width * maxDimension) / height;
    height = maxDimension;
  }
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

export async function pdfFirstPageToDataUrl(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL("image/jpeg", 0.8);
}

export async function fileToImageDataUrl(file: File): Promise<string> {
  return file.type === "application/pdf" ? pdfFirstPageToDataUrl(file) : compressImage(file);
}