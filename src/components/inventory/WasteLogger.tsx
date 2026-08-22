import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  InventoryItem,
  WasteRecord,
  WasteReasonCode,
  ShiftPeriod,
  StorageLocation
} from '../../types/inventory';
import { Department } from '../../types';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  Wine,
  Beef,
  Flame,
  ThermometerSnowflake,
  ShieldAlert,
  Search,
  Plus,
  Minus,
  X,
  TrendingDown,
  Sparkles,
  Package,
  Layers,
  ArrowRight,
  RotateCcw,
  UtensilsCrossed,
  Camera,
  CameraOff,
  Upload,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Eye,
  Check,
  AlertCircle,
  ScanLine,
  Barcode,
  Zap,
  QrCode
} from 'lucide-react';
import {
  detectBarcodeFromVideo,
  detectBarcodeFromImage,
  matchBarcodeOrTextToItem,
  playScanSuccessBeep,
  ItemMatchResult
} from '../../utils/barcodeScanner';

export interface WasteLoggerProps {
  isOpen?: boolean;
  onClose?: () => void;
  preselectedItemId?: string;
  onSuccess?: (record: WasteRecord) => void;
  isInline?: boolean;
}

interface ReasonOption {
  code: WasteReasonCode;
  title: string;
  subtitle: string;
  category: 'Kitchen' | 'Bar' | 'Facility' | 'Service';
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  {
    code: 'spoilage_expired',
    title: 'Spoilage & Expiration',
    subtitle: 'Natural shelf-life expiration, mold, wilting, or souring',
    category: 'Kitchen',
    icon: Trash2,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800'
  },
  {
    code: 'overproduction_excess',
    title: 'Overproduction & Excess Prep',
    subtitle: 'Batches prepped exceeding guest covers or unconsumed buffet items',
    category: 'Kitchen',
    icon: Layers,
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  {
    code: 'overcooked_kitchen_error',
    title: 'Kitchen & Line Cook Error',
    subtitle: 'Burnt pan, overcooked steak, incorrect ticket modifier re-fire',
    category: 'Kitchen',
    icon: Flame,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  {
    code: 'prep_trimming_loss',
    title: 'Prep & Trimming Loss',
    subtitle: 'Excessive yield loss during butchery, deboning, or peeling',
    category: 'Kitchen',
    icon: UtensilsCrossed,
    color: 'text-stone-700 dark:text-stone-400',
    bgColor: 'bg-stone-50 dark:bg-stone-900/40',
    borderColor: 'border-stone-200 dark:border-stone-700'
  },
  {
    code: 'customer_return_dissatisfaction',
    title: 'Customer Return & Re-fire',
    subtitle: 'Dish returned by guest table for temperature or preference',
    category: 'Service',
    icon: RotateCcw,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    code: 'spill_breakage_drop',
    title: 'Spill & Breakage',
    subtitle: 'Dropped tray, broken wine bottle, tipped sauce container',
    category: 'Facility',
    icon: AlertTriangle,
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  {
    code: 'bar_overpour_comp',
    title: 'Bar Overpour & Loss',
    subtitle: 'Heavy pour, draft beer keg foaming line loss, or unrecorded comp',
    category: 'Bar',
    icon: Wine,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    code: 'storage_temp_failure',
    title: 'Refrigeration & Temp Failure',
    subtitle: 'Walk-in cooler failure, freezer thaw, or hot holding temp breach',
    category: 'Facility',
    icon: ThermometerSnowflake,
    color: 'text-cyan-700 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800'
  },
  {
    code: 'quality_inspection_fail',
    title: 'Quality & Receiving Fail',
    subtitle: 'Substandard freshness or damaged produce rejected on arrival',
    category: 'Kitchen',
    icon: ShieldAlert,
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800'
  },
  {
    code: 'theft_unaccounted',
    title: 'Unaccounted Shrink / Theft',
    subtitle: 'Inventory missing without sales deduction or delivery match',
    category: 'Facility',
    icon: AlertTriangle,
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800'
  }
];

export const WasteLogger: React.FC<WasteLoggerProps> = ({
  isOpen = true,
  onClose,
  preselectedItemId,
  onSuccess,
  isInline = false
}) => {
  const { items, logWasteRecord, financialIntelligence } = useInventory();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'All'>('All');
  const [selectedStorageFilter, setSelectedStorageFilter] = useState<StorageLocation | 'All'>('All');

  // Active Selected Item
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (preselectedItemId && items.some(i => i.id === preselectedItemId)) {
      return preselectedItemId;
    }
    return items[0]?.id || '';
  });

  // Logging Form State
  const [quantityWasted, setQuantityWasted] = useState<number>(1);
  const [inputMode, setInputMode] = useState<'loose' | 'packs'>('loose');
  const [packQuantity, setPackQuantity] = useState<number>(1);
  const [reasonCode, setReasonCode] = useState<WasteReasonCode>('spoilage_expired');
  const [reasonDescription, setReasonDescription] = useState<string>('');
  const [shift, setShift] = useState<ShiftPeriod>('closing');
  const [loggedByName, setLoggedByName] = useState<string>('Marco Chen');
  const [loggedByRole, setLoggedByRole] = useState<string>('Lead Line Cook');
  const [disposalMethod, setDisposalMethod] = useState<'trash' | 'compost' | 'supplier_credit_return' | 'staff_meal_repurpose'>('trash');
  const [customUnitCostOverride, setCustomUnitCostOverride] = useState<string>('');
  const [requireSupervisorAlert, setRequireSupervisorAlert] = useState<boolean>(false);

  // Camera & Image Capture State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturingFlash, setIsCapturingFlash] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Barcode & OCR Scanner State
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState<boolean>(true);
  const [isScanProcessing, setIsScanProcessing] = useState<boolean>(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [lastScanMatch, setLastScanMatch] = useState<ItemMatchResult | null>(null);
  const [itemAutoPopulated, setItemAutoPopulated] = useState<{
    itemId: string;
    itemName: string;
    code: string;
    matchType: string;
    timestamp: number;
  } | null>(null);
  const [scanToast, setScanToast] = useState<{
    title: string;
    itemName: string;
    sku: string;
    code: string;
    type: 'success' | 'info';
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [lastLoggedCost, setLastLoggedCost] = useState<number>(0);

  // Stop camera tracks cleanly
  const stopCameraStream = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsCameraLoading(false);
  };

  // Start Camera Stream
  const startCameraStream = async (facing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsCameraLoading(true);

    // Stop any existing tracks first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. Please use photo file upload.');
      setIsCameraLoading(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (firstErr) {
        // Fallback to generic video
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video autoplay interaction:', playErr);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = 'Camera permission denied or camera device is in use. You can attach a photo via file upload.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera access was blocked by browser permissions. Please allow camera access or use photo upload.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No physical camera device detected on this system. Please use photo file upload.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
      setIsCameraLoading(false);
    }
  };

  // Switch between front & back camera
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      startCameraStream(nextFacing);
    }
  };

  // Process detected barcode/label match and auto-populate inventory item
  const handleItemBarcodeMatch = (match: ItemMatchResult, rawCode: string) => {
    playScanSuccessBeep();
    setSelectedItemId(match.item.id);
    setLastScannedCode(rawCode);
    setLastScanMatch(match);
    setItemAutoPopulated({
      itemId: match.item.id,
      itemName: match.item.name,
      code: rawCode,
      matchType: match.matchType,
      timestamp: Date.now()
    });

    setScanToast({
      title: 'Item Auto-Populated from Barcode / OCR',
      itemName: match.item.name,
      sku: match.item.sku,
      code: rawCode,
      type: 'success'
    });

    // Auto dismiss toast after 4s
    setTimeout(() => {
      setScanToast(prev => (prev?.code === rawCode ? null : prev));
    }, 4000);
  };

  // Live video frame barcode scanning loop
  useEffect(() => {
    if (!isCameraActive || !isAutoScanEnabled) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    scanIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isScanProcessing) return;

      try {
        setIsScanProcessing(true);
        const result = await detectBarcodeFromVideo(videoRef.current);
        if (result && result.text) {
          const match = matchBarcodeOrTextToItem(result.text, items);
          if (match) {
            // Check if we haven't just scanned this exact code for the current selected item
            if (lastScannedCode !== result.text || selectedItemId !== match.item.id) {
              handleItemBarcodeMatch(match, result.text);
            }
          }
        }
      } catch (err) {
        // Frame missed decode
      } finally {
        setIsScanProcessing(false);
      }
    }, 320);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isCameraActive, isAutoScanEnabled, items, lastScannedCode, selectedItemId, isScanProcessing]);

  // Capture Snapshot from Live Video with OCR inspection
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    setIsCapturingFlash(true);

    let capturedDataUrl = '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoUrl(capturedDataUrl);
      }
    } catch (err) {
      console.error('Snapshot capture failed:', err);
    }

    setTimeout(() => {
      setIsCapturingFlash(false);
      stopCameraStream();
    }, 200);

    // If a photo was captured, run an image-level OCR scan check
    if (capturedDataUrl) {
      try {
        const imageScan = await detectBarcodeFromImage(capturedDataUrl);
        if (imageScan && imageScan.text) {
          const match = matchBarcodeOrTextToItem(imageScan.text, items);
          if (match) {
            handleItemBarcodeMatch(match, imageScan.text);
          }
        }
      } catch (e) {
        console.warn('Snapshot OCR scan notice:', e);
      }
    }
  };

  // Manual Trigger to Scan Current Camera Frame on demand
  const handleManualScanFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    setIsScanProcessing(true);
    try {
      const result = await detectBarcodeFromVideo(videoRef.current);
      if (result && result.text) {
        const match = matchBarcodeOrTextToItem(result.text, items);
        if (match) {
          handleItemBarcodeMatch(match, result.text);
        } else {
          setScanToast({
            title: 'Barcode Scanned, No Inventory Match',
            itemName: `Unrecognized Code: "${result.text}"`,
            sku: 'N/A',
            code: result.text,
            type: 'info'
          });
        }
      } else {
        setScanToast({
          title: 'No Barcode Detected in Frame',
          itemName: 'Ensure barcode/label is well-lit and held steady within frame.',
          sku: 'N/A',
          code: '',
          type: 'info'
        });
      }
    } catch (err) {
      console.warn('Manual scan error:', err);
    } finally {
      setIsScanProcessing(false);
    }
  };

  // Handle File Input Selection with OCR
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFileToDataUrl(file);
    }
    e.target.value = '';
  };

  const readFileToDataUrl = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (typeof event.target?.result === 'string') {
        const dataUrl = event.target.result;
        setPhotoUrl(dataUrl);
        stopCameraStream();

        // Run OCR scan on uploaded image
        try {
          const scanResult = await detectBarcodeFromImage(dataUrl);
          if (scanResult && scanResult.text) {
            const match = matchBarcodeOrTextToItem(scanResult.text, items);
            if (match) {
              handleItemBarcodeMatch(match, scanResult.text);
            }
          }
        } catch (e) {
          console.warn('Uploaded image OCR decode failed:', e);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Simulate scanning a test sample barcode for 1-click testing
  const handleSimulateScan = (barcodeOrSku: string) => {
    const match = matchBarcodeOrTextToItem(barcodeOrSku, items);
    if (match) {
      handleItemBarcodeMatch(match, barcodeOrSku);
    }
  };

  // Cleanup on unmount or closing
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Sync if preselected item changes
  useEffect(() => {
    if (preselectedItemId && items.some(i => i.id === preselectedItemId)) {
      setSelectedItemId(preselectedItemId);
    }
  }, [preselectedItemId, items]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  // Filtered Item Catalog for Quick Picker
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedDeptFilter !== 'All' && item.department !== selectedDeptFilter) return false;
      if (selectedStorageFilter !== 'All' && item.storageArea !== selectedStorageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchSupplier = item.supplierName.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat && !matchSupplier) return false;
      }
      return true;
    });
  }, [items, selectedDeptFilter, selectedStorageFilter, searchQuery]);

  // Unit Cost & Total Value Computations
  const effectiveUnitCost = useMemo(() => {
    if (!selectedItem) return 0;
    if (customUnitCostOverride && !isNaN(Number(customUnitCostOverride)) && Number(customUnitCostOverride) >= 0) {
      return Number(customUnitCostOverride);
    }
    return selectedItem.unitCost;
  }, [selectedItem, customUnitCostOverride]);

  const calculatedQuantity = useMemo(() => {
    if (!selectedItem) return 0;
    if (inputMode === 'packs') {
      return Number((packQuantity * selectedItem.conversionRatio).toFixed(2));
    }
    return Number(quantityWasted);
  }, [inputMode, packQuantity, quantityWasted, selectedItem]);

  const totalWasteCost = useMemo(() => {
    return Number((calculatedQuantity * effectiveUnitCost).toFixed(2));
  }, [calculatedQuantity, effectiveUnitCost]);

  // Automated Variance & Stock Impact Simulation
  const simulatedRemainingStock = useMemo(() => {
    if (!selectedItem) return 0;
    return Math.max(0, Number((selectedItem.quantityOnHand - calculatedQuantity).toFixed(2)));
  }, [selectedItem, calculatedQuantity]);

  const isExceedingStock = useMemo(() => {
    if (!selectedItem) return false;
    return calculatedQuantity > selectedItem.quantityOnHand;
  }, [selectedItem, calculatedQuantity]);

  // Handlers for rapid steppers
  const handleAdjustQuantity = (delta: number) => {
    if (inputMode === 'packs') {
      setPackQuantity(prev => Math.max(0.1, Number((prev + delta).toFixed(2))));
    } else {
      setQuantityWasted(prev => Math.max(0.1, Number((prev + delta).toFixed(2))));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || calculatedQuantity <= 0) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newRecordData = {
        organizationId: 'org-workqora-corp',
        locationId: selectedItem.locationId || 'loc-01',
        locationName: 'Workqora Flagship Downtown #101',
        department: selectedItem.department,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        sku: selectedItem.sku,
        category: selectedItem.category,
        categoryGroup: selectedItem.categoryGroup,
        quantityWasted: calculatedQuantity,
        unitOfMeasure: selectedItem.unitOfMeasure,
        unitCost: effectiveUnitCost,
        totalWasteCost,
        reasonCode,
        reasonDescription: reasonDescription.trim() || `Staff waste recorded under ${reasonCode.replace(/_/g, ' ')}`,
        shift,
        loggedByEmployeeId: 'emp-line-2',
        loggedByName,
        loggedByRole,
        supervisorVerified: false,
        supervisorNotes: requireSupervisorAlert ? 'URGENT: High-cost waste incident flagged for management review.' : undefined,
        disposalMethod,
        isRecurringAnomaly: isExceedingStock || totalWasteCost > 75,
        imageUrl: photoUrl || undefined,
        photoUrl: photoUrl || undefined,
      };

      await logWasteRecord(newRecordData);

      setLastLoggedCost(totalWasteCost);
      setSubmittedSuccess(true);
      if (onSuccess) {
        onSuccess({
          ...newRecordData,
          id: `waste-rec-${Date.now()}`,
          timestamp: now
        });
      }

      // Reset fields for another potential entry
      setQuantityWasted(1);
      setPackQuantity(1);
      setReasonDescription('');
      setCustomUnitCostOverride('');
      setPhotoUrl(null);
      stopCameraStream();

      // Auto close after brief display if desired
      setTimeout(() => {
        setSubmittedSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error recording waste item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCameraStream();
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen && !isInline) return null;

  const content = (
    <div id="waste-logger-container" className="flex flex-col h-full max-h-[90vh] bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden relative">
      
      {/* Header */}
      <div id="waste-logger-header" className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                Record Waste & Loss Incident
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                Live Inventory Sync
              </span>
            </div>
            <p className="text-xs text-stone-700 dark:text-stone-300">
              Deterministic unit cost calculation & automated variance reconciliation
            </p>
          </div>
        </div>

        {onClose && (
          <button
            id="waste-logger-close-btn"
            type="button"
            onClick={handleClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Floating Scan Match Toast Notification */}
      {scanToast && (
        <div id="waste-scan-toast" className={`border-b px-6 py-2.5 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 ${
          scanToast.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
            : 'bg-stone-800 text-stone-100 border-stone-700'
        }`}>
          <div className="flex items-center space-x-2.5 text-xs">
            <div className="p-1 rounded bg-white/20">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold flex items-center space-x-2">
                <span>{scanToast.title}</span>
                {scanToast.code && (
                  <span className="font-mono px-1.5 py-0.2 bg-black/25 rounded text-[10px]">
                    {scanToast.code}
                  </span>
                )}
              </div>
              <div className="text-[11px] opacity-90">
                {scanToast.itemName} {scanToast.sku !== 'N/A' && `• SKU: ${scanToast.sku}`}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScanToast(null)}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {submittedSuccess && (
        <div id="waste-logger-success-banner" className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 px-6 py-3 flex items-center justify-between text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <span className="font-bold">Waste Logged Successfully!</span> ${lastLoggedCost.toFixed(2)} deducted from stock and synced to period COGS variance analysis.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedSuccess(false)}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Step 1: Target Inventory Item Selection */}
        <div id="step-item-selection" className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-stone-500" />
              <span>1. Select Wasted Item</span>
            </label>
            <div className="flex items-center space-x-2">
              <button
                id="waste-header-scan-barcode-btn"
                type="button"
                onClick={() => {
                  startCameraStream();
                  const camSection = document.getElementById('step-camera-proof');
                  if (camSection) {
                    camSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>Scan Barcode / Label</span>
              </button>
              <span className="text-xs text-stone-700 dark:text-stone-300">
                {filteredItems.length} in catalog
              </span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                id="waste-item-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ingredient, SKU, barcode, or supplier..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 text-stone-900 dark:text-stone-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <select
                id="waste-dept-filter"
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value as Department | 'All')}
                className="w-full py-2 px-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-700 dark:text-stone-200 font-medium"
              >
                <option value="All">All Departments</option>
                <option value="Kitchen">Kitchen (BOH)</option>
                <option value="Bar">Bar (FOH)</option>
                <option value="Pastry & Bakery">Pastry & Bakery</option>
                <option value="Prep Kitchen">Prep Kitchen</option>
                <option value="Operating Supplies">Supplies</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                id="waste-storage-filter"
                value={selectedStorageFilter}
                onChange={(e) => setSelectedStorageFilter(e.target.value as StorageLocation | 'All')}
                className="w-full py-2 px-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-700 dark:text-stone-200 font-medium"
              >
                <option value="All">All Storage Locations</option>
                <option value="Walk-in Cooler">Walk-in Cooler</option>
                <option value="Walk-in Freezer">Walk-in Freezer</option>
                <option value="Dry Storage">Dry Storage</option>
                <option value="Bar Display & Speed Rail">Bar Display</option>
                <option value="Liquor Storage Cage">Liquor Cage</option>
                <option value="Wine Cellar">Wine Cellar</option>
              </select>
            </div>
          </div>

          {/* Quick Select Chips / Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-900/50">
            {filteredItems.map(item => {
              const isSelected = item.id === selectedItem?.id;
              return (
                <button
                  id={`item-chip-${item.id}`}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-2 rounded-lg text-left transition-all flex items-start justify-between border ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-100 ring-1 ring-red-500'
                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs truncate">{item.name}</div>
                    <div className="text-[10px] text-stone-600 dark:text-stone-300 truncate">
                      {item.sku} • {item.storageArea}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold text-stone-900 dark:text-white">${item.unitCost.toFixed(2)}</div>
                    <div className="text-[10px] text-stone-600 dark:text-stone-300">/{item.unitOfMeasure}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Item Spotlight Card */}
          {selectedItem && (
            <div id="selected-item-spotlight" className={`p-3.5 border rounded-xl flex flex-wrap items-center justify-between gap-3 transition-all ${
              itemAutoPopulated && itemAutoPopulated.itemId === selectedItem.id
                ? 'bg-gradient-to-r from-emerald-50 via-stone-50 to-emerald-50 dark:from-emerald-950/30 dark:via-stone-800/70 dark:to-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-800/70 dark:to-stone-800/40 border-stone-200 dark:border-stone-700'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-stone-700 dark:text-stone-200 text-xs shrink-0">
                  {selectedItem.categoryGroup === 'Food' ? <Beef className="w-5 h-5 text-amber-600" /> : <Wine className="w-5 h-5 text-purple-600" />}
                </div>
                <div>
                  <div className="font-bold text-sm text-stone-900 dark:text-white flex items-center flex-wrap gap-1.5">
                    <span>{selectedItem.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                      {selectedItem.category}
                    </span>
                    {itemAutoPopulated && itemAutoPopulated.itemId === selectedItem.id && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 animate-pulse">
                        <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Auto-Populated by {itemAutoPopulated.matchType.toUpperCase()} ({itemAutoPopulated.code})</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    SKU: <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{selectedItem.sku}</span> {selectedItem.barcode && <>| Barcode: <span className="font-mono text-stone-700 dark:text-stone-300">{selectedItem.barcode}</span></>} | Pack: {selectedItem.packUnit} ({selectedItem.conversionRatio} {selectedItem.unitOfMeasure}) | Area: {selectedItem.storageArea}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-right">
                <div>
                  <div className="text-[10px] text-stone-600 dark:text-stone-300 uppercase font-bold tracking-wider">Current Stock</div>
                  <div className="text-sm font-bold text-stone-900 dark:text-white">
                    {selectedItem.quantityOnHand.toLocaleString()} <span className="text-xs font-normal text-stone-600 dark:text-stone-300">{selectedItem.unitOfMeasure}</span>
                  </div>
                </div>
                <div className="border-l border-stone-300 dark:border-stone-700 pl-4">
                  <div className="text-[10px] text-stone-600 dark:text-stone-300 uppercase font-bold tracking-wider">Unit Cost</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    ${effectiveUnitCost.toFixed(2)} <span className="text-xs font-normal text-stone-600 dark:text-stone-300">/{selectedItem.unitOfMeasure}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Reason Category Selection */}
        <div id="step-reason-category" className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>2. Waste Reason Category</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {REASON_OPTIONS.map(opt => {
              const isSelected = reasonCode === opt.code;
              const IconComp = opt.icon;
              return (
                <button
                  id={`reason-btn-${opt.code}`}
                  key={opt.code}
                  type="button"
                  onClick={() => setReasonCode(opt.code)}
                  className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `${opt.bgColor} ${opt.borderColor} border-2 ring-1 ring-red-500/50 shadow-sm`
                      : 'bg-stone-50/70 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${opt.bgColor} ${opt.color}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                      {opt.category}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white leading-tight">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                      {opt.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Quantity, Unit Calculation & Financial Cost */}
        <div id="step-quantity-calculation" className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 rounded-2xl">
          
          {/* Left Column: Input and Steppers */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>3. Quantity Wasted</span>
              </label>

              {/* Unit Mode Toggle */}
              {selectedItem && (
                <div className="flex items-center space-x-1 bg-stone-200 dark:bg-stone-700 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setInputMode('loose')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      inputMode === 'loose'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Loose ({selectedItem.unitOfMeasure})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('packs')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      inputMode === 'packs'
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs font-bold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    Full {selectedItem.packUnit}
                  </button>
                </div>
              )}
            </div>

            {/* Quantity Input Field & Stepper Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleAdjustQuantity(-1)}
                className="w-11 h-11 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center font-bold text-stone-700 dark:text-stone-200 transition-colors shadow-xs"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  id="waste-quantity-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputMode === 'packs' ? packQuantity : quantityWasted}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (inputMode === 'packs') setPackQuantity(val);
                    else setQuantityWasted(val);
                  }}
                  className="w-full py-2.5 px-4 text-center text-xl font-bold bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 dark:text-white shadow-xs"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-600 dark:text-stone-300 uppercase">
                  {inputMode === 'packs' ? selectedItem?.packUnit : selectedItem?.unitOfMeasure}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAdjustQuantity(1)}
                className="w-11 h-11 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center font-bold text-stone-700 dark:text-stone-200 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[0.25, 0.5, 1, 2, 5, 10].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    if (inputMode === 'packs') setPackQuantity(val);
                    else setQuantityWasted(val);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 transition-colors"
                >
                  +{val} {inputMode === 'packs' ? selectedItem?.packUnit : selectedItem?.unitOfMeasure}
                </button>
              ))}
            </div>

            {/* Cost Override Optional Field */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-stone-600 dark:text-stone-300">Unit Cost Benchmark: <strong className="text-stone-800 dark:text-stone-200">${selectedItem?.unitCost.toFixed(2)}</strong></span>
                <span className="text-[11px] text-stone-600 dark:text-stone-300">Optional Override</span>
              </div>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="waste-cost-override"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customUnitCostOverride}
                  onChange={(e) => setCustomUnitCostOverride(e.target.value)}
                  placeholder={`Default: $${selectedItem?.unitCost.toFixed(2)} per ${selectedItem?.unitOfMeasure}`}
                  className="w-full pl-8 pr-4 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-stone-800 dark:text-stone-200"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Deterministic Calculation Card */}
          <div className="md:col-span-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-stone-700 dark:text-stone-300 mb-2 flex items-center justify-between">
                <span>Unit Cost Calculation</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 font-bold">
                  Direct COGS Loss
                </span>
              </div>

              <div className="space-y-2 py-2 border-y border-stone-100 dark:border-stone-800 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Wasted Quantity:</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {calculatedQuantity} {selectedItem?.unitOfMeasure}
                    {inputMode === 'packs' && ` (${packQuantity} ${selectedItem?.packUnit})`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Unit Cost Applied:</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    ${effectiveUnitCost.toFixed(2)} / {selectedItem?.unitOfMeasure}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-300">
                  <span>Department Impact:</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {selectedItem?.department}
                  </span>
                </div>
              </div>

              {/* Total Waste Cost Spotlight */}
              <div className="mt-3 text-center p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl">
                <div className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                  Total Financial Loss
                </div>
                <div className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
                  ${totalWasteCost.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Automated Variance Analysis Preview */}
            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center space-x-2 text-xs">
                <TrendingDown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-stone-600 dark:text-stone-300 text-[11px]">
                  Variance Impact: <strong>{calculatedQuantity} {selectedItem?.unitOfMeasure}</strong> logged as verified waste instead of unexplained shrink.
                </span>
              </div>
              
              {isExceedingStock && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Waste quantity exceeds current recorded on-hand ({selectedItem?.quantityOnHand} {selectedItem?.unitOfMeasure}). On-hand will be adjusted to 0.</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Step 4: Shift & Staff Accountability */}
        <div id="step-staff-accountability" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>Shift Time</span>
            </label>
            <select
              id="waste-shift-select"
              value={shift}
              onChange={(e) => setShift(e.target.value as ShiftPeriod)}
              className="w-full py-2 px-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-800 dark:text-stone-200 font-medium"
            >
              <option value="morning">Morning (Prep & Breakfast)</option>
              <option value="mid">Mid (Lunch Rush)</option>
              <option value="closing">Closing (Dinner & Night Close)</option>
              <option value="overnight">Overnight (Deep Clean & Bake)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Logged By Staff
            </label>
            <input
              id="waste-logged-by-name"
              type="text"
              value={loggedByName}
              onChange={(e) => setLoggedByName(e.target.value)}
              placeholder="Staff Name"
              className="w-full py-2 px-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-800 dark:text-stone-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Staff Role / Station
            </label>
            <input
              id="waste-logged-by-role"
              type="text"
              value={loggedByRole}
              onChange={(e) => setLoggedByRole(e.target.value)}
              placeholder="Role (e.g. Lead Line Cook)"
              className="w-full py-2 px-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-800 dark:text-stone-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
              Disposal Route
            </label>
            <select
              id="waste-disposal-method"
              value={disposalMethod}
              onChange={(e) => setDisposalMethod(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-800 dark:text-stone-200 font-medium"
            >
              <option value="trash">Trash / Landfill Bin</option>
              <option value="compost">Compost / Food Recycling</option>
              <option value="supplier_credit_return">Supplier Credit Claim Return</option>
              <option value="staff_meal_repurpose">Staff Meal Repurposed</option>
            </select>
          </div>

        </div>

        {/* Step 5: Incident Photographic Evidence (Camera & Upload) */}
        <div id="step-photo-evidence" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                5. Photographic Evidence (Camera / File)
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Manager Verification
              </span>
            </div>
            {photoUrl && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Photo Attached
              </span>
            )}
          </div>

          {/* Hidden native camera/file input */}
          <input
            id="waste-camera-file-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Camera Error Notice if any */}
          {cameraError && (
            <div className="p-3 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 text-xs font-bold underline hover:opacity-80 cursor-pointer"
                >
                  Choose an image file from your device instead →
                </button>
              </div>
            </div>
          )}

          {/* Active Live Camera Stream Viewfinder */}
          {isCameraActive && (
            <div className="relative overflow-hidden rounded-2xl bg-black border-2 border-red-500 shadow-xl">
              {/* White flash effect on shutter */}
              {isCapturingFlash && (
                <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-200" />
              )}

              {/* Top Viewfinder Bar */}
              <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-20 flex items-center justify-between text-white text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="font-mono font-bold tracking-wider">LIVE SCANNER & CAMERA</span>
                  <button
                    type="button"
                    onClick={() => setIsAutoScanEnabled(!isAutoScanEnabled)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                      isAutoScanEnabled
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    <Barcode className="w-3 h-3" />
                    <span>{isAutoScanEnabled ? 'Auto-Scan: ON' : 'Auto-Scan: OFF'}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-white transition-colors cursor-pointer"
                    title="Switch front / rear camera"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-red-900 text-white transition-colors cursor-pointer"
                    title="Close camera"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Video Preview */}
              <div className="relative flex items-center justify-center min-h-[280px] max-h-[380px] bg-stone-950">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full max-h-[380px] object-contain"
                />

                {/* Reticle / Viewfinder Frame Overlay */}
                <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-xl flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500 -translate-x-1 -translate-y-1" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500 translate-x-1 -translate-y-1" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500 -translate-x-1 translate-y-1" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500 translate-x-1 translate-y-1" />
                  
                  {/* Glowing Laser Scan Line Animation */}
                  {isAutoScanEnabled && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                  )}

                  {/* Recognition HUD Overlay if recently matched */}
                  {lastScanMatch && (
                    <div className="absolute top-4 inset-x-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 p-2 rounded-lg text-xs flex items-center justify-between shadow-lg pointer-events-auto animate-in fade-in zoom-in-95">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Item Auto-Populated!</div>
                          <div className="text-[11px] text-emerald-300 font-mono">
                            {lastScanMatch.item.name} ({lastScanMatch.item.sku})
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-emerald-800/80 px-1.5 py-0.5 rounded text-emerald-200">
                        {lastScanMatch.matchType}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 inset-x-0 flex justify-center">
                    <span className="text-[10px] font-medium text-white/80 bg-black/70 px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                      <ScanLine className="w-3 h-3 text-red-400" />
                      <span>Align barcode label or ingredient text in frame</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Shutter & Controls Bar */}
              <div className="p-3.5 bg-gradient-to-t from-black/95 via-black/80 to-black/40 flex flex-wrap items-center justify-center gap-3 z-20">
                <button
                  type="button"
                  onClick={handleManualScanFrame}
                  disabled={isScanProcessing}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-200 bg-stone-800/90 hover:bg-stone-700 active:scale-95 border border-stone-700 flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Barcode className="w-4 h-4 text-amber-400" />
                  <span>{isScanProcessing ? 'Scanning...' : 'Scan Frame (OCR)'}</span>
                </button>
                <button
                  id="waste-camera-shutter-btn"
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-all cursor-pointer ring-4 ring-white/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Snapshot</span>
                </button>
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200 bg-stone-900 hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Captured / Attached Photo Card */}
          {!isCameraActive && photoUrl && (
            <div className="p-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group w-full sm:w-44 h-32 rounded-xl overflow-hidden bg-black shrink-0 border border-stone-300 dark:border-stone-700">
                <img
                  src={photoUrl}
                  alt="Waste Incident Evidence"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1.5 transition-opacity cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> View Full
                </button>
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/70 text-emerald-400">
                  ATTACHED
                </span>
              </div>

              <div className="flex-1 w-full flex flex-col justify-between self-stretch">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-stone-900 dark:text-white">
                      Manager Verification Photo
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Ready to Submit
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                    Photo attached for manager verification, audit trail, and automated OCR barcode reconciliation.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-stone-200 dark:border-stone-700">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                  </button>
                  <button
                    type="button"
                    onClick={() => startCameraStream()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty Photo Action Buttons */}
          {!isCameraActive && !photoUrl && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) readFileToDataUrl(file);
              }}
              className={`p-4 border-2 border-dashed rounded-2xl transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDraggingOver
                  ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                  : 'border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 hover:bg-stone-50 dark:hover:bg-stone-800/70'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <span>Incident Proof & Barcode OCR</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-normal">
                      Auto-Populates Item
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300">
                    Capture live photo with auto barcode decoding, or upload label photo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="waste-logger-open-camera-btn"
                  type="button"
                  onClick={() => startCameraStream()}
                  disabled={isCameraLoading}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-red-400 dark:text-red-600" />
                  <span>{isCameraLoading ? 'Starting...' : 'Open Camera Scanner'}</span>
                </button>
                <button
                  id="waste-logger-upload-photo-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600 flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )}

          {/* Test Barcode Simulation Tray for Fast Testing */}
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-stone-700 dark:text-stone-300 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Test OCR Barcode Scanner (1-Click Sample Testing)</span>
              </div>
              <span className="text-[10px] text-stone-600 dark:text-stone-300">Click any sample to test auto-population</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: '🥩 Ribeye (840192830112)', code: '840192830112' },
                { name: '🐟 Salmon (840192830113)', code: '840192830113' },
                { name: '🥑 Avocados (840192830114)', code: '840192830114' },
                { name: '🧀 Mozzarella (840192830115)', code: '840192830115' },
                { name: '🍺 IPA Keg (840192830117)', code: '840192830117' },
                { name: '🍷 Cabernet (840192830119)', code: '840192830119' },
                { name: '🧴 Sanitizer (CHEM-SANI-QUAT-2.5G)', code: 'CHEM-SANI-QUAT-2.5G' },
              ].map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleSimulateScan(sample.code)}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Barcode className="w-3 h-3 text-stone-500" />
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 6: Incident Description / Corrective Notes */}
        <div id="step-incident-notes" className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              6. Root-Cause & Incident Description
            </label>
            <span className="text-[11px] text-stone-600 dark:text-stone-300">Optional for audit compliance</span>
          </div>
          <textarea
            id="waste-reason-notes"
            rows={2}
            value={reasonDescription}
            onChange={(e) => setReasonDescription(e.target.value)}
            placeholder="e.g. Ticket #402 allergy re-fire; meat left at room temp during lunch rush; broken during stocking."
            className="w-full p-3 text-xs bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 dark:text-stone-100"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                id="waste-alert-supervisor-check"
                type="checkbox"
                checked={requireSupervisorAlert || totalWasteCost > 50}
                onChange={(e) => setRequireSupervisorAlert(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500"
              />
              <span>Flag for immediate Supervisor verification & root-cause review</span>
            </label>
            {totalWasteCost > 50 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                High Dollar Threshold (&gt;$50)
              </span>
            )}
          </div>
        </div>

      </form>

      {/* Footer Actions */}
      <div id="waste-logger-footer" className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-stone-600 dark:text-stone-300">
          Syncs immediately to <strong>WorkQora Cloud Ledger</strong> & period variance reconciler.
        </div>

        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              id="waste-logger-cancel-btn"
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            id="waste-logger-submit-btn"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || calculatedQuantity <= 0}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording Waste...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Record ${totalWasteCost.toFixed(2)} Waste</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {showPhotoModal && photoUrl && (
        <div
          id="waste-photo-lightbox"
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-stone-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-stone-950 flex items-center justify-between border-b border-stone-800 text-white">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold font-mono">INCIDENT EVIDENCE PHOTO (FULL RESOLUTION)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={photoUrl}
                alt="Full Incident Proof"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="px-4 py-2.5 bg-stone-950 text-stone-400 text-xs flex items-center justify-between">
              <span>{selectedItem?.name} ({selectedItem?.sku})</span>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="text-xs font-semibold text-stone-200 hover:text-white underline cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[95vh] flex flex-col">
        {content}
      </div>
    </div>
  );
};
