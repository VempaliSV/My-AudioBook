import * as pdfjsLib from 'pdfjs-dist';

// Set worker source URL for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ExtractedPdf {
  fullText: string;
  pages: { pageNum: number; text: string }[];
  totalPages: number;
}

export async function extractTextFromPdfFile(file: File): Promise<ExtractedPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const totalPages = pdf.numPages;
  const pages: { pageNum: number; text: string }[] = [];
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    pages.push({ pageNum: i, text: pageText });
    fullText += `\n--- Page ${i} ---\n` + pageText;
  }

  return {
    fullText,
    pages,
    totalPages,
  };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
