import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { InventoryItem } from '../types/inventory';

export interface ScanResult {
  text: string;
  format?: string;
  timestamp: string;
}

export interface ItemMatchResult {
  item: InventoryItem;
  matchType: 'barcode' | 'sku' | 'supplierSku' | 'name_ocr' | 'keyword_ocr';
  rawText: string;
  confidence: number;
}

// Singleton reader instance
let codeReader: BrowserMultiFormatReader | null = null;

function getCodeReader(): BrowserMultiFormatReader {
  if (!codeReader) {
    codeReader = new BrowserMultiFormatReader();
  }
  return codeReader;
}

/**
 * Plays a pleasant synthesizer audio chime on successful barcode decode
 */
export function playScanSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // A6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Silent fail if audio context is blocked
  }
}

/**
 * Detect barcode using native BarcodeDetector API if available, or @zxing/library fallback
 */
export async function detectBarcodeFromVideo(video: HTMLVideoElement): Promise<ScanResult | null> {
  if (!video || video.readyState < 2) return null;

  // 1. Try Native BarcodeDetector (Chrome/Edge/Android)
  if ('BarcodeDetector' in window) {
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorClass({
        formats: [
          'code_128',
          'code_39',
          'code_93',
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
          'qr_code',
          'data_matrix',
          'itf',
          'codabar'
        ]
      });
      const detected = await detector.detect(video);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        return {
          text: detected[0].rawValue.trim(),
          format: detected[0].format || '1D/2D Barcode',
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      // Fall through to ZXing
    }
  }

  // 2. Fallback to ZXing MultiFormatReader via video element or image element
  try {
    const reader = getCodeReader();
    // Use decodeFromVideoElement if video is playing
    const result = await reader.decodeFromVideoElement(video);
    if (result && result.getText()) {
      return {
        text: result.getText().trim(),
        format: result.getBarcodeFormat() ? String(result.getBarcodeFormat()) : 'Barcode',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    // NotFoundException is expected when no barcode is currently in view
    if (!(err instanceof NotFoundException)) {
      // ignore ordinary scan frame misses
    }
  }

  return null;
}

/**
 * Detect barcode from a data URL or image element
 */
export async function detectBarcodeFromImage(imageSrcOrElement: string | HTMLImageElement): Promise<ScanResult | null> {
  // 1. If HTMLImageElement and BarcodeDetector exists
  if (typeof imageSrcOrElement !== 'string' && 'BarcodeDetector' in window) {
    try {
      const BarcodeDetectorClass = (window as any).BarcodeDetector;
      const detector = new BarcodeDetectorClass({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix']
      });
      const detected = await detector.detect(imageSrcOrElement);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        return {
          text: detected[0].rawValue.trim(),
          format: detected[0].format || 'Barcode',
          timestamp: new Date().toISOString()
        };
      }
    } catch (e) {
      // fall through
    }
  }

  // 2. ZXing Decode from Image
  try {
    const reader = getCodeReader();
    let imgElement: HTMLImageElement;

    if (typeof imageSrcOrElement === 'string') {
      imgElement = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve();
        imgElement.onerror = (e) => reject(e);
        imgElement.src = imageSrcOrElement;
      });
    } else {
      imgElement = imageSrcOrElement;
    }

    const result = await reader.decodeFromImageElement(imgElement);
    if (result && result.getText()) {
      return {
        text: result.getText().trim(),
        format: result.getBarcodeFormat() ? String(result.getBarcodeFormat()) : 'Barcode',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    // NotFoundException is normal if no barcode found
  }

  return null;
}

/**
 * Match a raw decoded barcode string, SKU, or label text to the best matching inventory item
 */
export function matchBarcodeOrTextToItem(rawText: string, items: InventoryItem[]): ItemMatchResult | null {
  if (!rawText || !items || items.length === 0) return null;

  const clean = rawText.trim();
  const lower = clean.toLowerCase();

  // 1. Direct Barcode Match (Exact match)
  const barcodeMatch = items.find(item => item.barcode && item.barcode.trim() === clean);
  if (barcodeMatch) {
    return {
      item: barcodeMatch,
      matchType: 'barcode',
      rawText: clean,
      confidence: 1.0
    };
  }

  // 2. Direct SKU Match
  const skuMatch = items.find(item => item.sku && item.sku.toLowerCase() === lower);
  if (skuMatch) {
    return {
      item: skuMatch,
      matchType: 'sku',
      rawText: clean,
      confidence: 0.98
    };
  }

  // 3. Supplier SKU Match
  const supplierSkuMatch = items.find(item => item.supplierSku && item.supplierSku.toLowerCase() === lower);
  if (supplierSkuMatch) {
    return {
      item: supplierSkuMatch,
      matchType: 'supplierSku',
      rawText: clean,
      confidence: 0.95
    };
  }

  // 4. Barcode partial / numeric match (e.g. leading zero strip or UPC vs EAN-13 padding)
  const numericClean = clean.replace(/\D/g, '');
  if (numericClean.length >= 6) {
    const numericMatch = items.find(item => {
      if (!item.barcode) return false;
      const itemNum = item.barcode.replace(/\D/g, '');
      return itemNum === numericClean || itemNum.endsWith(numericClean) || numericClean.endsWith(itemNum);
    });
    if (numericMatch) {
      return {
        item: numericMatch,
        matchType: 'barcode',
        rawText: clean,
        confidence: 0.92
      };
    }
  }

  // 5. SKU pattern / keyword extraction inside raw OCR string (e.g., text from label)
  for (const item of items) {
    // Check if the item's SKU is contained in the text
    if (item.sku && lower.includes(item.sku.toLowerCase())) {
      return {
        item,
        matchType: 'sku',
        rawText: clean,
        confidence: 0.90
      };
    }
    // Check if item's primary name key phrases are found
    if (item.name && lower.includes(item.name.toLowerCase())) {
      return {
        item,
        matchType: 'name_ocr',
        rawText: clean,
        confidence: 0.85
      };
    }
  }

  // 6. Fuzzy keyword search on significant word tokens
  const words = lower.split(/[\s\-_,./]+/).filter(w => w.length >= 4);
  for (const word of words) {
    const matchedItem = items.find(item => 
      item.name.toLowerCase().includes(word) || 
      item.sku.toLowerCase().includes(word)
    );
    if (matchedItem) {
      return {
        item: matchedItem,
        matchType: 'keyword_ocr',
        rawText: clean,
        confidence: 0.70
      };
    }
  }

  return null;
}
