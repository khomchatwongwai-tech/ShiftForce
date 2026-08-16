import { authenticatedFetch } from '../utils/apiClient';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  RotateCw,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  Zap,
  FileText,
  RefreshCw,
  Info,
  Plus,
  ArrowRight,
  Eye,
  Sliders,
  ChevronDown,
  Maximize2
} from 'lucide-react';
import { Shift, Employee, Department, RestaurantRole, SupportedLanguage } from '../types';
import { translations } from '../utils/i18n';

interface AIPaperScheduleScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  weekDates: { dateStr: string; dayName: string; dayNumber: number; fullDate: Date }[];
  currentLanguage: SupportedLanguage;
  onAddBatchShifts: (newShifts: Omit<Shift, 'id'>[]) => void;
}

export interface ParsedScannedShift {
  tempId: string;
  selected: boolean;
  employeeId: string;
  employeeName: string;
  department: Department;
  role: RestaurantRole;
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyWage: number;
  color: string;
  notes: string;
  confidence: number;
  detectedRowText?: string;
  isEditing?: boolean;
}

export const AIPaperScheduleScannerModal: React.FC<AIPaperScheduleScannerModalProps> = ({
  isOpen,
  onClose,
  employees,
  weekDates,
  currentLanguage,
  onAddBatchShifts,
}) => {
  const t = translations[currentLanguage];

  // Steps: 'capture' | 'scanning' | 'review' | 'success'
  const [step, setStep] = useState<'capture' | 'scanning' | 'review' | 'success'>('capture');
  const [inputMode, setInputMode] = useState<'camera' | 'upload' | 'preset'>('camera');

  // Image & Camera State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [rotation, setRotation] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Target Week selection
  const [selectedWeekDateStr, setSelectedWeekDateStr] = useState<string>(weekDates[0]?.dateStr || '');

  // AI Extraction Results
  const [extractedShifts, setExtractedShifts] = useState<ParsedScannedShift[]>([]);
  const [summaryInfo, setSummaryInfo] = useState<{
    summary: string;
    detectedWeekRange: string;
    confidenceScore: number;
    notes: string;
  }>({
    summary: '',
    detectedWeekRange: '',
    confidenceScore: 92,
    notes: '',
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgressStage, setScanProgressStage] = useState<string>('Initializing OCR...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState<number>(0);

  // Initialize Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('[Camera Access Warning]', err);
      setCameraError('Camera access unavailable or blocked. You can upload an image file or test with sample schedule presets.');
      setIsCameraActive(false);
    }
  }, [facingMode, cameraStream]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  }, [cameraStream]);

  // Manage Camera on open/close
  useEffect(() => {
    if (isOpen && inputMode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, inputMode, capturedImage]);

  // Capture Snapshot from Camera
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCapturedImage(event.target.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Sample Preset Image selection
  const handleSelectPreset = (presetType: 'weekly_grid' | 'handwritten' | 'kitchen_stations') => {
    // Generate a clean stylized canvas data URL representing realistic schedules
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background paper texture
    ctx.fillStyle = presetType === 'handwritten' ? '#faf8f5' : '#ffffff';
    ctx.fillRect(0, 0, 1200, 800);

    // Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      presetType === 'weekly_grid'
        ? 'SHIFTSKY BISTRO & GRILL — WEEKLY STAFF SCHEDULE'
        : presetType === 'handwritten'
        ? 'WEEKEND DINNER FLOOR & BAR ROSTER'
        : 'KITCHEN PREP & BOH LINE TIMETABLE',
      40, 55
    );

    ctx.fillStyle = '#475569';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Target Week: ${weekDates[0]?.dayName} ${weekDates[0]?.dateStr} - ${weekDates[weekDates.length - 1]?.dayName} ${weekDates[weekDates.length - 1]?.dateStr} | Status: Approved by GM`, 40, 90);

    // Draw Table Grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 120, 1120, 620);

    // Columns
    const cols = ['Employee / Role', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const colWidth = 140;

    // Header row
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(40, 120, 1120, 45);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px sans-serif';

    cols.forEach((col, idx) => {
      const x = idx === 0 ? 55 : 40 + 140 + (idx - 1) * 140;
      ctx.fillText(col, x, 148);
    });

    // Rows
    const sampleRows = [
      { name: 'Alex Rivera (Server)', d: ['4p-11:30p', 'OFF', '4p-11:30p', 'OFF', '5p-12a', '4p-12a', '11a-4p'] },
      { name: 'Marco Chen (Line Cook)', d: ['9a-4:30p', '9a-4:30p', 'OFF', '3p-11:30p', '3p-12a', '3p-12a', 'OFF'] },
      { name: 'Elena Rostova (Bartender)', d: ['OFF', '4p-12a', '4p-12a', 'OFF', '4p-1a', '4p-1a', '11a-6p'] },
      { name: 'Jordan Taylor (Host)', d: ['10a-4p', '10a-4p', '10a-4p', 'OFF', '4:30p-11p', '4:30p-11p', 'OFF'] },
      { name: 'David Kim (Dishwasher)', d: ['4p-12a', '4p-12a', '4p-12a', '4p-12a', 'OFF', 'OFF', '4p-12a'] },
      { name: 'Sofia Rodriguez (Lead Server)', d: ['OFF', 'OFF', '4p-11:30p', '4p-11:30p', '4p-12a', '4p-12a', '4p-11p'] },
      { name: 'Liam Vance (Barback/Prep)', d: ['11a-5p', '11a-5p', 'OFF', '5p-11p', '5p-12a', 'OFF', '11a-6p'] },
    ];

    sampleRows.forEach((row, rIdx) => {
      const y = 165 + rIdx * 80;
      ctx.fillStyle = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(40, y, 1120, 80);
      ctx.strokeRect(40, y, 1120, 80);

      // Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(row.name, 50, y + 45);

      // Shifts
      row.d.forEach((shiftText, dIdx) => {
        const x = 40 + 140 + dIdx * 140;
        if (shiftText === 'OFF') {
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'italic 13px sans-serif';
          ctx.fillText('OFF', x + 40, y + 45);
        } else {
          // Pill background
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(x + 10, y + 18, 120, 44);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 10, y + 18, 120, 44);

          ctx.fillStyle = '#0369a1';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(shiftText, x + 22, y + 45);
        }
      });
    });

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Trigger AI OCR Scan with Gemini 3.7 Flash
  const handleAnalyzeWithAI = async () => {
    if (!capturedImage) return;

    setStep('scanning');
    setIsScanning(true);
    setErrorMessage(null);

    // Multi-stage progress message ticker for great UX
    setScanProgressStage('Uploading schedule sheet to Gemini 3.7 Flash Vision API...');
    const timer1 = setTimeout(() => {
      setScanProgressStage('Detecting grid columns, employee rows, and handwriting shorthand...');
    }, 900);
    const timer2 = setTimeout(() => {
      setScanProgressStage('Cross-referencing staff roster, wage rates, and meal break compliance...');
    }, 1800);

    try {
      const response = await authenticatedFetch('/api/ai/scan-schedule-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedImage,
          employees: employees,
          weekDates: weekDates,
          notes: `Target Week: ${selectedWeekDateStr}`,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();

      if (result.shifts && Array.isArray(result.shifts)) {
        const mappedShifts: ParsedScannedShift[] = result.shifts.map((s: any, idx: number) => {
          const emp = employees.find(e => e.id === s.employeeId || e.name.toLowerCase() === s.employeeName?.toLowerCase()) || employees[0];

          return {
            tempId: `scanned-shift-${Date.now()}-${idx}`,
            selected: true,
            employeeId: emp?.id || s.employeeId || `emp-${idx}`,
            employeeName: emp?.name || s.employeeName || 'Staff Member',
            department: (emp?.department || s.department || 'Front of House') as Department,
            role: (emp?.role || s.role || 'Server') as RestaurantRole,
            date: s.date || weekDates[0]?.dateStr || '2026-08-10',
            dayName: s.dayName || 'Monday',
            startTime: s.startTime || '16:00',
            endTime: s.endTime || '23:30',
            breakMinutes: typeof s.breakMinutes === 'number' ? s.breakMinutes : 30,
            hourlyWage: emp?.hourlyWage || s.hourlyWage || 18.5,
            color: emp?.color || s.color || 'bg-sky-500',
            notes: s.notes || 'Imported via AI Paper Schedule Scanner',
            confidence: typeof s.confidence === 'number' ? s.confidence : 0.94,
            detectedRowText: s.detectedRowText || `${s.employeeName} -> ${s.startTime}-${s.endTime}`,
            isEditing: false,
          };
        });

        setExtractedShifts(mappedShifts);
        setSummaryInfo({
          summary: result.scheduleSummary || `Successfully extracted ${mappedShifts.length} shifts from document.`,
          detectedWeekRange: result.detectedWeekRange || 'Current Week',
          confidenceScore: result.confidenceScore || 94,
          notes: result.parsingNotes || 'All shifts parsed and aligned to active restaurant employees.',
        });
        setStep('review');
      } else {
        throw new Error('No shifts found in schedule response');
      }
    } catch (err: any) {
      console.error('[AI Schedule Scan Error]', err);
      setErrorMessage(`Failed to parse schedule image: ${err.message || 'Unknown error'}. Please try again or use a clearer photo.`);
      setStep('capture');
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle shift selection
  const handleToggleSelectShift = (tempId: string) => {
    setExtractedShifts(prev => prev.map(s => s.tempId === tempId ? { ...s, selected: !s.selected } : s));
  };

  // Select / Deselect All
  const handleSelectAll = (select: boolean) => {
    setExtractedShifts(prev => prev.map(s => ({ ...s, selected: select })));
  };

  // Update a single shift field in review mode
  const handleUpdateShiftField = (tempId: string, field: keyof ParsedScannedShift, value: any) => {
    setExtractedShifts(prev => prev.map(s => {
      if (s.tempId !== tempId) return s;

      if (field === 'employeeId') {
        const emp = employees.find(e => e.id === value);
        if (emp) {
          return {
            ...s,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            role: emp.role,
            hourlyWage: emp.hourlyWage,
            color: emp.color,
          };
        }
      }

      return { ...s, [field]: value };
    }));
  };

  // Delete an extracted shift row
  const handleDeleteShiftRow = (tempId: string) => {
    setExtractedShifts(prev => prev.filter(s => s.tempId !== tempId));
  };

  // Calculate review stats
  const reviewStats = useMemo(() => {
    const selectedShifts = extractedShifts.filter(s => s.selected);
    let totalHours = 0;
    let totalLaborCost = 0;

    selectedShifts.forEach(s => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      const netHours = Math.max(0, (diff - s.breakMinutes) / 60);
      totalHours += netHours;
      totalLaborCost += netHours * s.hourlyWage;
    });

    return {
      selectedCount: selectedShifts.length,
      totalCount: extractedShifts.length,
      totalHours: Number(totalHours.toFixed(1)),
      totalLaborCost: Math.round(totalLaborCost),
    };
  }, [extractedShifts]);

  // Final Action: Add to live schedule
  const handleConfirmAndAddShifts = () => {
    const selectedShifts = extractedShifts.filter(s => s.selected);
    if (selectedShifts.length === 0) return;

    const formattedPayload: Omit<Shift, 'id'>[] = selectedShifts.map(s => ({
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      department: s.department,
      role: s.role,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes,
      hourlyWage: s.hourlyWage,
      status: 'draft',
      color: s.color,
      notes: s.notes,
    }));

    onAddBatchShifts(formattedPayload);
    setAddedCount(selectedShifts.length);
    setStep('success');
  };

  // Reset and retake photo
  const handleReset = () => {
    setCapturedImage(null);
    setExtractedShifts([]);
    setErrorMessage(null);
    setStep('capture');
    if (inputMode === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  AI Paper Schedule Scanner
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-full shadow-xs">
                  Gemini 3.7 Vision
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Snap a photo of paper shift sheets, whiteboard grids, or printed rosters to auto-generate verified shifts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">

          {/* ERROR NOTIFICATION */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3 animate-in shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-900 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* STEP 1: CAPTURE / UPLOAD / PRESET */}
          {step === 'capture' && (
            <div className="space-y-6">

              {/* Input Mode Toggle Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setInputMode('camera'); setCapturedImage(null); }}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      inputMode === 'camera'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Picture (Live Camera)</span>
                  </button>

                  <button
                    onClick={() => { setInputMode('upload'); stopCamera(); }}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      inputMode === 'upload'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo / Document</span>
                  </button>

                  <button
                    onClick={() => { setInputMode('preset'); stopCamera(); }}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      inputMode === 'preset'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Sample Paper Presets</span>
                  </button>
                </div>

                {/* Target Week Selector */}
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Target Week:</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {weekDates[0]?.dayName} {weekDates[0]?.dateStr} - {weekDates[weekDates.length - 1]?.dayName} {weekDates[weekDates.length - 1]?.dateStr}
                  </span>
                </div>
              </div>

              {/* CAMERA CAPTURE VIEW */}
              {inputMode === 'camera' && !capturedImage && (
                <div className="relative bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800 flex flex-col items-center justify-center min-h-[380px]">
                  {isCameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover max-h-[460px]"
                      />

                      {/* Viewfinder Document Framing Overlay */}
                      <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-sky-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                        {/* Corner markers */}
                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
                          <div className="w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
                        </div>

                        <div className="self-center bg-slate-950/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-[11px] font-semibold text-sky-300 border border-sky-500/40">
                          Align paper schedule inside frame with good lighting
                        </div>

                        <div className="flex justify-between">
                          <div className="w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
                          <div className="w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />
                        </div>
                      </div>

                      {/* Camera Controls Bar */}
                      <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-4">
                        {/* Switch Front/Back */}
                        <button
                          type="button"
                          onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                          className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 backdrop-blur-sm transition-all cursor-pointer"
                          title="Switch Camera"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>

                        {/* Shutter Button */}
                        <button
                          type="button"
                          id="camera-shutter-snap-btn"
                          onClick={handleSnapPhoto}
                          className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-4 border-white shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                          title="Snap Photo"
                        >
                          <Camera className="w-7 h-7" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center max-w-md">
                      <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <h4 className="text-white font-bold text-base mb-1">Camera Initializing...</h4>
                      <p className="text-xs text-slate-400 mb-5">
                        {cameraError || 'Please allow browser camera permissions when prompted to snap paper schedule pictures directly.'}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => setInputMode('upload')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Upload File Instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FILE UPLOAD VIEW */}
              {inputMode === 'upload' && !capturedImage && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-white hover:bg-sky-50/30 rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.heic,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-inner">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">
                    Drag & Drop paper schedule photo here
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mb-4">
                    Supports high-resolution photos (JPG, PNG, WebP) taken on iPhone, Android, or scanned office timetables.
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 text-xs font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-xl transition-all pointer-events-none"
                  >
                    Browse Local Files
                  </button>
                </div>
              )}

              {/* PRESETS VIEW */}
              {inputMode === 'preset' && !capturedImage && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => handleSelectPreset('weekly_grid')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">Weekly FOH & BOH Paper Grid</h4>
                      <p className="text-xs text-slate-500">
                        Full weekly printed sheet with Servers, Line Cooks, Bartenders & Host shift blocks across Monday - Sunday.
                      </p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-slate-100 group-hover:bg-sky-600 group-hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all">
                      Load Preset & Test
                    </button>
                  </div>

                  <div
                    onClick={() => handleSelectPreset('handwritten')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">Handwritten Weekend Roster</h4>
                      <p className="text-xs text-slate-500">
                        Handwritten table format with quick shorthand ("4p-12a", "OP", "CL", "OFF") and custom shift stations.
                      </p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-slate-100 group-hover:bg-amber-600 group-hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all">
                      Load Preset & Test
                    </button>
                  </div>

                  <div
                    onClick={() => handleSelectPreset('kitchen_stations')}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 mb-1">Kitchen Prep & Line Timetable</h4>
                      <p className="text-xs text-slate-500">
                        Back of House staggered shifts (Morning Prep, Sauté/Grill, Closing Dishwasher station rotations).
                      </p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all">
                      Load Preset & Test
                    </button>
                  </div>
                </div>
              )}

              {/* CAPTURED / LOADED IMAGE PREVIEW */}
              {capturedImage && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Document Image Ready for AI OCR Processing
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                        title="Rotate Image 90°"
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>Rotate</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retake / Change Photo</span>
                      </button>
                    </div>
                  </div>

                  {/* Image Display Frame */}
                  <div className="relative bg-slate-900 rounded-2xl overflow-hidden max-h-[380px] flex items-center justify-center border border-slate-300">
                    <img
                      src={capturedImage}
                      alt="Scanned Schedule"
                      style={{ transform: `rotate(${rotation}deg)` }}
                      className="max-h-[360px] w-auto object-contain transition-transform duration-300"
                    />
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-sky-600" />
                      <span>Gemini will recognize staff names, match existing hourly wages, and map shifts automatically.</span>
                    </div>

                    <button
                      id="ai-start-scan-process-btn"
                      onClick={handleAnalyzeWithAI}
                      className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 rounded-2xl shadow-lg shadow-sky-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>Process & Extract Shifts with AI</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 2: SCANNING ANIMATION */}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">

              {/* Laser OCR animation card */}
              <div className="relative w-72 h-44 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-sky-500/50 flex items-center justify-center p-4">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Scanning"
                    className="w-full h-full object-cover opacity-40 blur-[1px]"
                  />
                )}

                {/* Laser scan line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] animate-bounce" style={{ animationDuration: '2s' }} />

                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-sky-500/10 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-full border border-sky-400/40 text-sky-300 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini Vision OCR</span>
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <h4 className="text-base font-bold text-slate-800">
                  Analyzing Paper Schedule Sheet...
                </h4>
                <p className="text-xs text-sky-600 font-medium animate-pulse">
                  {scanProgressStage}
                </p>
                <p className="text-[11px] text-slate-400">
                  Reading handwritten notes, cross-matching employee roles, and formatting shift blocks into the calendar matrix.
                </p>
              </div>

            </div>
          )}

          {/* STEP 3: INTERACTIVE REVIEW & VERIFICATION */}
          {step === 'review' && (
            <div className="space-y-5">

              {/* Extracted Overview Banner */}
              <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                      ✓ OCR Score: {summaryInfo.confidenceScore}% Confidence
                    </span>
                    <span className="text-xs text-slate-300">
                      {summaryInfo.detectedWeekRange}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {summaryInfo.summary}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {summaryInfo.notes}
                  </p>
                </div>

                {/* KPI badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Selected</div>
                    <div className="text-sm font-bold text-sky-300">{reviewStats.selectedCount} / {reviewStats.totalCount}</div>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Est. Hours</div>
                    <div className="text-sm font-bold text-white">{reviewStats.totalHours} hrs</div>
                  </div>

                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Labor Cost</div>
                    <div className="text-sm font-bold text-emerald-400">${reviewStats.totalLaborCost.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500 font-medium">
                    Review and adjust times/staff before adding to the active calendar.
                  </span>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rescan / Change Photo</span>
                </button>
              </div>

              {/* EXTRACTED SHIFTS TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={extractedShifts.length > 0 && extractedShifts.every(s => s.selected)}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Staff Member</th>
                        <th className="p-3">Role & Dept</th>
                        <th className="p-3">Day / Date</th>
                        <th className="p-3">Time Window</th>
                        <th className="p-3">Break</th>
                        <th className="p-3">Station / Notes</th>
                        <th className="p-3 text-center">Confidence</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {extractedShifts.map((shift) => (
                        <tr
                          key={shift.tempId}
                          className={`hover:bg-slate-50 transition-colors ${
                            !shift.selected ? 'opacity-40 bg-slate-50/50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={shift.selected}
                              onChange={() => handleToggleSelectShift(shift.tempId)}
                              className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>

                          {/* Employee Selection */}
                          <td className="p-3 font-semibold text-slate-800">
                            <select
                              value={shift.employeeId}
                              onChange={(e) => handleUpdateShiftField(shift.tempId, 'employeeId', e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
                            >
                              {employees.map(e => (
                                <option key={e.id} value={e.id}>
                                  {e.name} ({e.role})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Role & Dept */}
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {shift.role}
                            </span>
                          </td>

                          {/* Day / Date */}
                          <td className="p-3">
                            <select
                              value={shift.date}
                              onChange={(e) => {
                                const selectedDay = weekDates.find(w => w.dateStr === e.target.value);
                                handleUpdateShiftField(shift.tempId, 'date', e.target.value);
                                if (selectedDay) {
                                  handleUpdateShiftField(shift.tempId, 'dayName', selectedDay.dayName);
                                }
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              {weekDates.map(w => (
                                <option key={w.dateStr} value={w.dateStr}>
                                  {w.dayName.slice(0, 3)} ({w.dateStr.slice(5)})
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Time Window */}
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={shift.startTime}
                                onChange={(e) => handleUpdateShiftField(shift.tempId, 'startTime', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800"
                              />
                              <span className="text-slate-400 font-bold">-</span>
                              <input
                                type="time"
                                value={shift.endTime}
                                onChange={(e) => handleUpdateShiftField(shift.tempId, 'endTime', e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs font-mono font-bold text-slate-800"
                              />
                            </div>
                          </td>

                          {/* Break Minutes */}
                          <td className="p-3">
                            <select
                              value={shift.breakMinutes}
                              onChange={(e) => handleUpdateShiftField(shift.tempId, 'breakMinutes', Number(e.target.value))}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                            >
                              <option value={0}>0m</option>
                              <option value={15}>15m</option>
                              <option value={30}>30m</option>
                              <option value={45}>45m</option>
                              <option value={60}>60m</option>
                            </select>
                          </td>

                          {/* Notes */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={shift.notes}
                              onChange={(e) => handleUpdateShiftField(shift.tempId, 'notes', e.target.value)}
                              placeholder="Station or duties"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700"
                            />
                          </td>

                          {/* Confidence */}
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              shift.confidence >= 0.9
                                ? 'bg-emerald-100 text-emerald-800'
                                : shift.confidence >= 0.75
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {Math.round(shift.confidence * 100)}%
                            </span>
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteShiftRow(shift.tempId)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove Shift"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center shadow-lg animate-in zoom-in-50">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1 max-w-md">
                <h4 className="text-xl font-bold text-slate-900">
                  {addedCount} Shifts Added to Schedule!
                </h4>
                <p className="text-xs text-slate-500">
                  All extracted shifts from the paper schedule have been converted into active draft shifts and synchronized with the restaurant calendar.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  View Schedule Calendar
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Scan Another Sheet
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        {step === 'review' && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-800">{reviewStats.selectedCount}</span> shifts ready to be added to {weekDates[0]?.dayName} {weekDates[0]?.dateStr}.
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel & Retake
              </button>

              <button
                type="button"
                id="confirm-add-scanned-shifts-btn"
                onClick={handleConfirmAndAddShifts}
                disabled={reviewStats.selectedCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Add {reviewStats.selectedCount} Shifts to Live Schedule</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
