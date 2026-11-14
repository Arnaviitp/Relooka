import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Eye,
  FileCheck,
  ChevronRight,
  X,
  ScanFace,
  RefreshCw
} from 'lucide-react';

export default function FaceAuthModal({ isOpen, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();

  // Multi-step progress: 1 (Consent & Init) -> 2 (ID Document) -> 3 (Live Video PAD) -> 4 (Biometric Verdict)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Session & Consent
  const [docType, setDocType] = useState('aadhaar');
  const [nameAsPrinted, setNameAsPrinted] = useState(user?.name || '');
  const [consentGiven, setConsentGiven] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  // Step 2: Document upload
  const [docImageBase64, setDocImageBase64] = useState(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState(null);
  const [docResult, setDocResult] = useState(null);

  // Step 3: Live Liveness & Challenge
  const [challengeAction, setChallengeAction] = useState(null);
  const [challengeNonce, setChallengeNonce] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Step 4: Final Verdict
  const [verdictData, setVerdictData] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera when modal closes or unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can use the mock live capture fallback for testing.');
    }
  };

  // STEP 1: Initialize Session
  const handleStartSession = async () => {
    if (!consentGiven) {
      setError('Regulatory consent is required to verify government identity details.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/users/me/face-auth/session', {});
      if (res.success && res.data) {
        setSessionId(res.data.verification_id);
        setStep(2);
      } else {
        throw new Error(res.message || 'Failed to initialize verification session');
      }
    } catch (err) {
      setError(err.message || 'Failed to start session with Face Auth Agent');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Document File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG or PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target.result;
      setDocImageBase64(base64);
      setDocPreviewUrl(base64);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // STEP 2: Submit Document to Agent
  const handleUploadDocument = async () => {
    if (!docImageBase64) {
      setError('Please upload your ID document image first');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/users/me/face-auth/document', {
        verificationId: sessionId,
        documentType: docType,
        imageBase64: docImageBase64,
        nameAsPrinted: nameAsPrinted || user?.name,
        consentGiven: true
      });

      if (res.success && res.data) {
        setDocResult(res.data);
      } else {
        throw new Error(res.message || 'Failed to validate document');
      }
    } catch (err) {
      setError(err.message || 'Failed to validate document');
    } finally {
      setLoading(false);
    }
  };

  // Transition from Step 2 to Step 3: Initiate live session
  const handleProceedToLiveness = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/me/face-auth/live-session', {
        verificationId: sessionId
      });

      if (res.success && res.data) {
        setChallengeAction(res.data.challenge_action || 'SMILE');
        setChallengeNonce(res.data.challenge_nonce);
        setStep(3);
        // Start camera once step 3 is active
        setTimeout(() => {
          startCamera();
        }, 100);
      } else {
        throw new Error(res.message || 'Failed to initiate active liveness challenge');
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate liveness challenge');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Capture Burst Frames
  const handleTriggerCapture = () => {
    setError('');
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeBurstCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeBurstCapture = async () => {
    setCapturing(true);
    const frames = [];

    const captureSingleFrame = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
      // Fallback synthetic frame if camera video canvas is empty
      return docImageBase64 || 'data:image/jpeg;base64,sampleFrame';
    };

    // Burst of 5 frames spaced 150ms apart
    for (let i = 0; i < 5; i++) {
      frames.push(captureSingleFrame());
      setCapturedFrames([...frames]);
      await new Promise((r) => setTimeout(r, 150));
    }

    setCapturing(false);
    stopCamera();

    // Submit frames to backend agent
    setLoading(true);
    try {
      const res = await api.post('/users/me/face-auth/frames', {
        verificationId: sessionId,
        framesBase64: frames
      });

      if (res.success && res.data) {
        // Immediately trigger final match step
        handleCompleteVerification();
      } else {
        throw new Error(res.message || 'Failed to verify temporal liveness frames');
      }
    } catch (err) {
      setError(err.message || 'Liveness frame validation failed');
      setLoading(false);
    }
  };

  // Fallback simulator capture for devices without webcam
  const handleSimulatedCapture = async () => {
    setError('');
    setLoading(true);
    try {
      const syntheticFrames = [
        docImageBase64 || 'data:image/jpeg;base64,f1',
        docImageBase64 || 'data:image/jpeg;base64,f2',
        docImageBase64 || 'data:image/jpeg;base64,f3',
        docImageBase64 || 'data:image/jpeg;base64,f4',
        docImageBase64 || 'data:image/jpeg;base64,f5'
      ];
      await api.post('/users/me/face-auth/frames', {
        verificationId: sessionId,
        framesBase64: syntheticFrames
      });
      handleCompleteVerification();
    } catch (err) {
      setError(err.message || 'Simulation capture failed');
      setLoading(false);
    }
  };

  // STEP 4: Complete SFace matching and persist verdict
  const handleCompleteVerification = async () => {
    setLoading(true);
    try {
      const res = await api.post('/users/me/face-auth/complete', {
        verificationId: sessionId,
        documentType: docType,
        maskedRef: docResult?.masked_id_number,
        nameAsPrinted: nameAsPrinted || user?.name
      });

      if (res.success && res.data) {
        setVerdictData(res.data);
        setStep(4);
        await refreshUser();
        if (onSuccess) onSuccess(res.data);
      } else {
        throw new Error(res.message || 'Failed to complete biometric matching');
      }
    } catch (err) {
      setError(err.message || 'Biometric matching failed');
    } finally {
      setLoading(false);
    }
  };

  const getChallengeDescription = (action) => {
    switch (action) {
      case 'TURN_LEFT':
        return { title: 'Turn Head Left ⬅️', prompt: 'Slowly turn your head towards the left side.' };
      case 'TURN_RIGHT':
        return { title: 'Turn Head Right ➡️', prompt: 'Slowly turn your head towards the right side.' };
      case 'SMILE':
        return { title: 'Smile 😊', prompt: 'Show a clear, natural smile looking directly at the camera.' };
      case 'BLINK':
        return { title: 'Blink Eyes 👁️', prompt: 'Blink your eyes twice looking directly at the camera.' };
      default:
        return { title: 'Look Directly Ahead 👤', prompt: 'Position your face within the oval guide.' };
    }
  };

  const challengeInfo = getChallengeDescription(challengeAction);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-lg">AI Face Authentication Agent</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                  YuNet • SFace • MiniFASNet
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Zero-Trust Biometric & Government ID Verification Agent (D:\Agents)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100">
          <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
            {[
              { num: 1, label: '1. Consent & ID' },
              { num: 2, label: '2. Upload ID' },
              { num: 3, label: '3. Live Liveness' },
              { num: 4, label: '4. Biometric Verdict' }
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center space-x-1.5 py-1 px-2 rounded-lg transition-colors ${
                  step === s.num
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'text-slate-400'
                }`}
              >
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CONSENT & CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-sm mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Indian Regulatory & DPDPA 2023 Compliance</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Under the Digital Personal Data Protection Act (DPDPA 2023), full unmasked document photos and raw facial
                  embeddings are <strong>NEVER stored</strong>. The agent validates document integrity in encrypted memory,
                  masks sensitive digits, extracts facial landmarks, and shreds biometric artifacts immediately after matching.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Government ID Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                    <option value="passport">Passport</option>
                    <option value="driving_licence">Driving Licence</option>
                    <option value="voter_card">Voter ID Card (EPIC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name (As printed on document)
                  </label>
                  <input
                    type="text"
                    value={nameAsPrinted}
                    onChange={(e) => setNameAsPrinted(e.target.value)}
                    placeholder="e.g. Aanya Sharma"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600">
                  I voluntarily grant express consent for the automated Face Authentication Agent to read my government
                  identity document, perform temporal anti-spoofing liveness verification, and mask my identity reference for
                  peer-to-peer wardrobe rental on LoopWear.
                </span>
              </label>

              <button
                onClick={handleStartSession}
                disabled={loading || !consentGiven}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Face Auth Agent...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Verification Session</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: DOCUMENT UPLOAD & VALIDATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm mb-1">Upload Your {docType.replace('_', ' ').toUpperCase()}</h4>
                <p className="text-xs text-slate-500">
                  Ensure the entire card is visible, well-lit, and text is readable without blur.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {docPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={docPreviewUrl}
                      alt="Document Preview"
                      className="max-h-52 mx-auto rounded-xl object-contain border border-slate-200 shadow-sm"
                    />
                    <p className="text-xs text-emerald-600 font-medium">Click to select a different image</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Click to upload or drag & drop document</p>
                    <p className="text-xs text-slate-400">PNG, JPG, or JPEG up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Document Validation Feedback */}
              {docResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-900">Document Validated by Agent</span>
                    </div>
                    <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
                      {docResult.masked_id_number}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800 pt-1">
                    <div>Readability: <strong>{docResult.checks?.document_readability}</strong></div>
                    <div>Face Quality: <strong>{docResult.checks?.face_quality}</strong></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                {!docResult ? (
                  <button
                    onClick={handleUploadDocument}
                    disabled={loading || !docImageBase64}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validating Document OCR...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" />
                        <span>Upload & Validate Document</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleProceedToLiveness}
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>Proceed to Live Liveness Verification</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: LIVE LIVENESS CHALLENGE & WEBCAM */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Challenge Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-sm text-center">
                <div className="text-xs uppercase tracking-wider text-emerald-100 font-bold mb-0.5">
                  Server Active Challenge
                </div>
                <h4 className="text-lg font-black">{challengeInfo.title}</h4>
                <p className="text-xs text-emerald-100 mt-1">{challengeInfo.prompt}</p>
              </div>

              {/* Video Viewport with Face Guide */}
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video max-h-64 mx-auto flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Oval Face Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className={`w-36 h-48 rounded-[50%] border-2 border-dashed ${
                    capturing ? 'border-emerald-400 animate-pulse' : 'border-white/60'
                  }`} />
                </div>

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="text-6xl font-black text-white animate-bounce">{countdown}</span>
                  </div>
                )}

                {/* Capturing Indicator */}
                {capturing && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>CAPTURING BURST FRAMES...</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <p className="font-semibold mb-1">Camera Notice:</p>
                  <p>{cameraError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleTriggerCapture}
                  disabled={loading || capturing || countdown !== null}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  <span>{capturing ? 'Recording Burst...' : 'Perform Challenge & Capture'}</span>
                </button>

                <button
                  onClick={handleSimulatedCapture}
                  disabled={loading || capturing}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Simulate Capture (Dev Mode)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BIOMETRIC VERDICT */}
          {step === 4 && verdictData && (
            <div className="space-y-5 text-center py-2">
              {verdictData.status === 'VERIFIED' ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-950">Identity Successfully Verified!</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    The Face Authentication Agent validated that your live selfie matches the government ID portrait using SFace
                    biometrics and MiniFASNetV2 temporal anti-spoofing.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-emerald-100 text-left max-w-sm mx-auto">
                    <div>Status: <span className="font-bold text-emerald-700">VERIFIED</span></div>
                    <div>Document: <span className="font-bold uppercase">{docType}</span></div>
                    <div>Masked Ref: <span className="font-mono font-bold">{docResult?.masked_id_number || 'XXXX-XXXX-8921'}</span></div>
                    <div>Biometrics: <span className="font-bold text-emerald-700">SHREDDED (DPDPA)</span></div>
                  </div>
                </div>
              ) : verdictData.status === 'MANUAL_REVIEW' ? (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-950">Forwarded to Compliance Queue</h3>
                  <p className="text-xs text-amber-800 max-w-md mx-auto">
                    Biometric similarity was within the manual review margin ({verdictData.reason_code || 'MANUAL_REVIEW_MARGIN'}). An admin will review your identity submission shortly.
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-rose-950">Verification Unsuccessful</h3>
                  <p className="text-xs text-rose-800 max-w-md mx-auto">
                    Reason: {verdictData.reason_code || 'Liveness or face similarity check did not meet zero-trust confidence threshold.'}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Close & Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

