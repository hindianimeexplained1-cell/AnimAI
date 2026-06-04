import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Video, 
  Camera, 
  AlertTriangle, 
  HelpCircle, 
  Image as ImageIcon,
  History,
  CornerDownRight,
  ChevronRight,
  Sliders,
  Cpu,
  Smartphone,
  Download,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  AnimationPromptResult, 
  MotionSpeed, 
  StylePriority, 
  TargetPlatform, 
  PromptStyle, 
  CameraPrompt 
} from "./types";

interface SavedHistoryItem {
  id: string;
  timestamp: string;
  imageName: string;
  imageData: string;
  settings: {
    targetPlatform: TargetPlatform;
    motionSpeed: MotionSpeed;
    stylePriority: string;
    customInstructions: string;
  };
  result: AnimationPromptResult;
}

export default function App() {
  // Main State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("image/png");
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>("Meta AI");
  const [motionSpeed, setMotionSpeed] = useState<MotionSpeed>("medium");
  const [stylePriority, setStylePriority] = useState<string>("match");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  
  // App UI & Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("style_cinematic");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // Final Result State
  const [result, setResult] = useState<AnimationPromptResult | null>(null);
  
  // History Gallery State
  const [historyList, setHistoryList] = useState<SavedHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // PWA Install State handles
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalledLocally, setIsInstalledLocally] = useState<boolean>(false);

  // Custom Gemini API Key State handle
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [showApiKeyPlainText, setShowApiKeyPlainText] = useState<boolean>(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom API key and check install/api-key state on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("animai_custom_api_key");
    if (savedKey) {
      setCustomApiKey(savedKey);
    }

    if (
      window.matchMedia("(display-mode: standalone)").matches || 
      (navigator as any).standalone || 
      localStorage.getItem("animai_pwa_installed") === "true"
    ) {
      setIsInstalledLocally(true);
    }

    const checkServerKeys = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setHasServerKey(data.hasServerKey === true);
        }
      } catch (err) {
        console.warn("API health check failed:", err);
      }
    };
    checkServerKeys();
  }, []);

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setCustomApiKey(trimmed);
    if (trimmed) {
      localStorage.setItem("animai_custom_api_key", trimmed);
    } else {
      localStorage.removeItem("animai_custom_api_key");
    }
  };

  // Catch PWA beforeinstallprompt event trigger
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      // Prevent automatic banner show to handle manually
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("PWA install availability detected (beforeinstallprompt fired).");
    };

    const handleAppInstalled = () => {
      setIsInstalledLocally(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      localStorage.setItem("animai_pwa_installed", "true");
      console.log("PWA was installed successfully.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // If app is already installed or runs in standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
      setIsInstalledLocally(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("মোবাইলে ইনস্টল করতে ব্রাউজারের থ্রি-ডট মেনু বা সেটিংস থেকে 'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন) চাপুন।");
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation response outcome: ${outcome}`);
      if (outcome === "accepted") {
        setIsInstalledLocally(true);
        setIsInstallable(false);
        localStorage.setItem("animai_pwa_installed", "true");
      }
    } catch (e) {
      console.error("Installation flow failed:", e);
    }
    setDeferredPrompt(null);
  };

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("animai_prompt_history");
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Save item to history helper
  const saveToHistory = (imgData: string, imgName: string, settings: any, promptResult: AnimationPromptResult) => {
    try {
      const newItem: SavedHistoryItem = {
        id: "hist_" + Date.now(),
        timestamp: new Date().toLocaleTimeString("bn-BD", { hour: '2-digit', minute: '2-digit' }),
        imageName: imgName || "Untitled Image",
        imageData: imgData,
        settings,
        result: promptResult
      };
      
      const updated = [newItem, ...historyList].slice(0, 10); // Keep last 10 items
      setHistoryList(updated);
      localStorage.setItem("animai_prompt_history", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage quota exceeded or failed to save item into history:", e);
    }
  };

  // Delete from history
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    try {
      localStorage.setItem("animai_prompt_history", JSON.stringify(updated));
    } catch (_) {}
  };

  // Load a historic session
  const selectHistoryItem = (item: SavedHistoryItem) => {
    setSelectedImage(item.imageData);
    setImageName(item.imageName);
    setTargetPlatform(item.settings.targetPlatform);
    setMotionSpeed(item.settings.motionSpeed);
    setStylePriority(item.settings.stylePriority);
    setCustomInstructions(item.settings.customInstructions);
    setResult(item.result);
    // Find first style id or fallback
    if (item.result.prompts && item.result.prompts.length > 0) {
      setActiveTab(item.result.prompts[0].id);
    }
    setError(null);
  };

  // File Upload Handlers
  const processFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("অনুগ্রহ করে শুধুমাত্র ইমেজ ফাইল (.png, .jpg, .jpeg, .webp) আপলোড করুন।");
      return;
    }

    if (file.size > 35 * 1024 * 1024) {
      setError("ফাইলের সাইজ অনেক বড় (সর্বোচ্চ ৩৫ মেগাবাইট পর্যন্ত অনুমোদন করা হয়)।");
      return;
    }

    setImageName(file.name);
    // Since we compress it to JPEG format, set visual mimeType to image/jpeg
    setMimeType("image/jpeg");
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize to standard 1200px maximum dimension for extremely sharp details but lightweight size
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            // Compress with high fidelity (0.83 value is highly optimal)
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.83);
            setSelectedImage(compressedBase64);
            console.log(`Image compressed: original was ${(file.size / 1024).toFixed(1)}KB, now ${(compressedBase64.length / 1333).toFixed(1)}KB`);
          } catch (err) {
            console.warn("Canvas compression failed, falling back to original source file:", err);
            setSelectedImage(e.target?.result as string);
            setMimeType(file.type);
          }
        } else {
          setSelectedImage(e.target?.result as string);
          setMimeType(file.type);
        }
      };
      img.onerror = () => {
        setSelectedImage(e.target?.result as string);
        setMimeType(file.type);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError("ইমেজ লোড করতে সমস্যা হয়েছে। দয়া করে অন্য একটি ইমেজ দিয়ে চেষ্টা করুন।");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImageName("");
    setError(null);
  };

  // Simulated live steps for delightful feedback during AI analysis
  const runSimulator = (stepNumber: number) => {
    const steps = [
      "ইমেজের ডাটা প্রস্তুত করা হচ্ছে...",
      "Gemini AI সংযোগ করা হচ্ছে...",
      "ছবির সাবজেক্ট বিশ্লেষণ করা হচ্ছে...",
      "এনিমেশন এডিট প্রম্পট তৈরি করা হচ্ছে..."
    ];
    if (stepNumber < steps.length) {
      setCurrentStep(steps[stepNumber]);
      setTimeout(() => runSimulator(stepNumber + 1), 1400);
    }
  };

  // AI Prompt Request Submission
  const handleGeneratePrompts = async () => {
    if (!selectedImage) {
      setError("প্রম্পট তৈরি করতে প্রথমে আপনার ডিভাইসের গ্যালারি থেকে একটি ইমেজ আপলোড করুন।");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    
    // Start step simulator
    runSimulator(0);

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": customApiKey,
        },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          motionSpeed,
          stylePriority,
          targetPlatform,
          customInstructions
        }),
      });

      if (!response.ok) {
        let errorMessage = "সার্ভার থেকে প্রম্পট তৈরি করতে ব্যর্থ হয়েছে।";
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          errorMessage = `সার্ভার সমস্যা (স্ট্যাটাস কোড: ${response.status})। অনুগ্রহ করে নিশ্চিত করুন যে AI Studio সেটিংসের Secrets মেনুতে আপনার GEMINI_API_KEY সঠিকভাবে দেওয়া আছে।`;
        }
        throw new Error(errorMessage);
      }

      const textResult = await response.text();
      let rawResult: AnimationPromptResult;
      try {
        rawResult = JSON.parse(textResult);
      } catch (parseErr) {
        console.error("Failed to parse success JSON payload:", parseErr, textResult);
        throw new Error("সার্ভার থেকে প্রাপ্ত তথ্য সঠিক ফরম্যাটে নেই (JSON parsing failed)।");
      }

      setResult(rawResult);
      
      // Select the first prompt as active tab
      if (rawResult.prompts && rawResult.prompts.length > 0) {
        setActiveTab(rawResult.prompts[0].id);
      }

      // Save into historical list
      saveToHistory(
        selectedImage, 
        imageName, 
        { targetPlatform, motionSpeed, stylePriority, customInstructions }, 
        rawResult
      );

    } catch (err: any) {
      console.error(err);
      setError(err.message || "একটি অজানা সার্ভার সমস্যা দেখা দিয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
      setCurrentStep("");
    }
  };

  // Copy Clipboard Helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#e2e8f0] flex flex-col font-sans selection:bg-[#6366f1]/30 selection:text-white">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.18)_0%,rgba(168,85,247,0.06)_40%,transparent_70%)] pointer-events-none" />

      {/* Header Deck */}
      <header className="sticky top-0 z-40 border-b-2 border-white/5 bg-[#08080c]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a855f7] opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-11 h-11 bg-[#0c0c14] rounded-xl border border-white/10 flex items-center justify-center text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]">
              <Sparkles className="w-6 h-6 text-[#818cf8] animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AnimAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#a78bfa] to-[#c084fc] font-bold text-xs uppercase tracking-[0.15em] hidden sm:inline-block">Prompt Studio</span>
            </h1>
            <p className="text-[10px] text-[#818cf8]/80 tracking-wider font-mono hidden sm:block">Tactile 3D Creative Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`px-3 sm:px-3.5 py-2 rounded-xl border-b-[4px] flex items-center gap-1.5 font-bold transition-all active:border-b-0 active:translate-y-[4px] cursor-pointer text-xs ${
              customApiKey 
                ? "bg-emerald-950/35 hover:bg-emerald-950/50 border-emerald-500/25 border-b-emerald-800 text-emerald-300"
                : hasServerKey === false
                  ? "bg-amber-950/50 hover:bg-amber-900/40 border-amber-500/40 border-b-amber-950 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-indigo-950/20 hover:bg-indigo-900/20 border-indigo-500/10 border-b-indigo-950 text-indigo-300"
            }`}
            title="Gemini API Key সেটিংস"
          >
            <Key className={`w-3.5 h-3.5 flex-shrink-0 ${customApiKey ? "text-emerald-400 rotate-45" : "text-amber-400"}`} />
            <span>{customApiKey ? "এপিআই একটিভ" : "এপিআই এড করুন"}</span>
          </button>



          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3.5 py-2 rounded-xl border-b-[4px] flex items-center gap-2 transition-all font-bold active:border-b-0 active:translate-y-[4px] cursor-pointer ${
              showHistory 
                ? "bg-[#6366f1]/20 text-[#c7d2fe] border-[#6366f1]/40 border-b-[#4f46e5] shadow-[0_4px_0_#312e81,0_8px_16px_rgba(99,102,241,0.2)]" 
                : "bg-[#141423] hover:bg-[#1b1b30] border-white/10 border-b-black text-white hover:text-white shadow-[0_4px_0_#040406,0_6px_12px_rgba(0,0,0,0.5)]"
            }`}
          >
            <History className="w-4 h-4 text-indigo-400" />
            <span className="hidden xs:inline">প্রম্পট আর্কাইভ</span>
            {historyList.length > 0 && (
              <span className="bg-[#818cf8] text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {historyList.length}
              </span>
            )}
          </button>
          
          <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4 text-white/40">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse border border-green-300"></span>
            <span className="text-[11px] font-mono tracking-widest text-[#10b981] font-bold">GEMINI 3.5 APEX</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Hand: Upload Image, Presets, Form Configurations */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="upload-deck-card">
          
          {/* History Sidebar Panel over the configs when open */}
          {showHistory && (
            <div className="bg-[#0b0c15] border-2 border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[350px] lg:max-h-none lg:flex-1 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <span className="text-sm font-bold flex items-center gap-2 text-white">
                  <History className="w-4 h-4 text-[#818cf8]" />
                  রিসেন্ট জেনারেশন সমূহ (History)
                </span>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border-2 border-white/5 rounded-xl shadow-md font-bold transition-all cursor-pointer hover:scale-[1.03] active:scale-95"
                >
                  বন্ধ করুন
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <ImageIcon className="w-10 h-10 text-white/10 mb-2" />
                  <p className="text-xs text-white/40 font-bold">এখনও কোনো ইমেজ প্রস্তুত করা হয়নি।</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {historyList.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => selectHistoryItem(item)}
                      className="group bg-[#11111f] hover:bg-[#16162a]/95 border border-white/5 border-b-[4px] border-b-black rounded-xl p-3 flex gap-3 cursor-pointer transition-all duration-200 hover:border-[#6366f1]/50 shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:translate-y-[-2px]"
                    >
                      <div className="w-14 h-14 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 relative shadow-inner">
                        <img 
                          src={item.imageData} 
                          alt={item.imageName} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-white/90 truncate pr-2 group-hover:text-[#818cf8] transition-colors">{item.imageName}</p>
                          <button 
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="text-white/40 hover:text-red-400 p-1 bg-black/30 hover:bg-red-950/40 rounded transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/50 font-mono mt-1 font-bold">
                          <span>{item.settings.targetPlatform}</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t border-white/5 mt-4 text-[10px] text-[#818cf8]/75 text-center italic font-bold">
                * জেনারেটকৃত সকল প্রম্পট লোকাল স্টোরেজে নিরাপদে স্টোর থাকে।
              </div>
            </div>
          )}

          {/* Core Upload and Setting form (Only show as flex-1 if history is closed or screens are small) */}
          {(!showHistory || !showHistory) && (
            <div className="bg-[#0b0c14]/85 border-2 border-white/5 rounded-3xl p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col gap-6">
              
              {hasServerKey === false && !customApiKey && (
                <div className="border border-yellow-500/25 bg-yellow-500/5 rounded-2xl p-4 flex gap-3 text-yellow-200/90 items-start shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Gemini API কী সেটআপ করা নেই!</p>
                    <p className="text-white/60 leading-relaxed font-sans">
                      ইনস্টল করার পর বা বাইরে চালানোর জন্য ব্যাকএন্ডে কোনো ডিফল্ট API কী পাওয়া যায়নি। প্রম্পট সফলভাবে তৈরি করতে অনুগ্রহ করে নিচের <strong>"Gemini API সেটিংস"</strong> বক্সে আপনার নিজের <strong>API কী</strong> প্রদান করুন।
                    </p>
                  </div>
                </div>
              )}

              {/* Image Drag N Drop Workspace */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-white/70 mb-2.5 uppercase font-[#font-mono]">
                  ১. ইমেজ আপলোড করুন <span className="text-[#a855f7]">*</span>
                </label>
                
                {!selectedImage ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className="group border-2 border-dashed border-[#6366f1]/30 hover:border-[#818cf8]/60 bg-[#040409] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden shadow-[inset_0_5px_15px_rgba(0,0,0,0.8),0_1px_1px_rgba(255,255,255,0.05)]"
                  >
                    {/* Glowing effect inside drag field */}
                    <div className="absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_50%)] pointer-events-none" />

                    <div className="w-15 h-15 bg-white/5 group-hover:bg-[#6366f1]/10 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:border-[#6366f1]/30 transition-all duration-300 shadow-[4px_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-105">
                      <Upload className="w-6 h-6 text-white/50 group-hover:text-[#818cf8] transition-colors" />
                    </div>
                    
                    <h4 className="text-sm font-bold text-white group-hover:text-[#818cf8] transition-colors">
                      ইমেজ ড্রপ করুন বা ক্লিক করে ব্রাউজ করুন
                    </h4>
                    <p className="text-xs text-white/40 mt-1 max-w-xs font-medium">
                      অনুমোদিত ফরম্যাট: PNG, JPG, JPEG, WEBP (১০-১২ MB সহ সর্বোচ্চ ৩৫ MB পর্যন্ত)
                    </p>
                    
                    <button 
                      type="button" 
                      className="mt-4 px-4 py-2 bg-gradient-to-b from-white/10 to-white/5 text-xs font-bold text-white hover:brightness-115 rounded-xl border border-white/10 shadow-[0_3px_0_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      ব্রাউজ করুন
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl border-2 border-white/10 bg-black/40 overflow-hidden flex flex-col items-center shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
                    <div className="relative w-full aspect-video bg-black/95 flex items-center justify-center overflow-hidden shadow-inner">
                      <img 
                        src={selectedImage} 
                        alt="Uploaded Visual Resource" 
                        className="max-h-full max-w-full object-contain"
                      />
                      {/* Floating actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                        <div className="flex justify-end">
                          <button 
                            type="button"
                            onClick={removeSelectedImage}
                            className="p-2 bg-red-600/90 hover:bg-red-700 text-white rounded-xl shadow-lg border-b-[3px] border-red-800 transition-all font-bold active:border-b-0 active:translate-y-[2px]"
                            title="ইমেজ রিমুভ করুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="bg-black/80 backdrop-blur-sm p-2 rounded-xl border border-white/10 text-white/90 text-xs truncate font-bold">
                          📄 {imageName}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tiny footer under the active image preview */}
                    <div className="w-full px-4 py-2.5 bg-[#141423] border-t-2 border-white/10 flex items-center justify-between text-xs font-semibold shadow-inner">
                      <span className="text-white/60 truncate max-w-[70%] font-mono">{imageName}</span>
                      <button 
                        type="button"
                        onClick={removeSelectedImage} 
                        className="text-red-400 hover:text-red-300 hover:brightness-110 flex items-center gap-1 font-bold transition-all active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        বাতিল করুন
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Settings Panels */}
              <div className="space-y-4">
                
                {/* 1. Custom Directions (Placed prominently as it's the main optional control) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold tracking-wider text-white/70 uppercase font-mono">
                      কাস্টম নির্দেশ (ঐচ্ছিক)
                    </label>
                    <span className="text-[10px] text-[#818cf8] font-bold">খালি রাখলে AI স্বয়ংক্রিয়ভাবে ভিডিও প্রম্পট লিখে দেবে</span>
                  </div>
                  <textarea
                    rows={2}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="যেমন: ধীরে ধীরে ক্যামেরা বামে ঘুরবে..."
                    className="w-full bg-[#04040a] border border-white/10 rounded-xl p-2.5 sm:p-3 text-xs text-white/90 placeholder:text-white/30 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none resize-none leading-relaxed shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] font-sans transition-all focus:border-b-[4px]"
                  />
                </div>

                {/* 2. Gemini API Key Configuration System */}
                <div className="border border-white/10 bg-[#040409] rounded-2xl p-4 space-y-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                      Gemini API সেটিংস (ঐচ্ছিক)
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                      customApiKey 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                        : "bg-[#6366f1]/20 text-[#c7d2fe] border border-[#6366f1]/30 shadow-sm"
                    }`}>
                      {customApiKey ? "নিজের API Key" : "সার্ভার Key"}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-white/55 leading-relaxed font-medium">
                    যদি সার্ভারের ডিফল্ট কোটা শেষ হয়ে যায়, তবে আপনার ব্যক্তিগত <strong>Gemini API Key</strong> এখানে যুক্ত করে অ্যাপটি নিরবচ্ছিন্নভাবে ব্যবহার করতে পারেন।
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="AI Studio / Google AI Key পেস্ট করুন..."
                      value={customApiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      className="flex-1 bg-[#09090f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none font-mono tracking-wider shadow-inner"
                    />
                    {customApiKey && (
                      <button
                        type="button"
                        onClick={() => handleSaveApiKey("")}
                        className="px-3.5 py-2 bg-gradient-to-b from-red-950/50 to-red-900/40 text-red-300 border border-red-500/20 border-b-[3px] border-b-red-950 hover:bg-red-900/60 rounded-xl text-xs font-bold transition-all active:scale-95"
                        title="কী মুছে ফেলুন"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Advanced Options Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-bold text-[#818cf8] hover:text-[#c084fc] transition-colors font-mono py-1 cursor-pointer"
                  >
                    <Sliders className={`w-3.5 h-3.5 transition-transform duration-300 ${showAdvanced ? "rotate-90 text-[#a855f7]" : ""}`} />
                    <span>{showAdvanced ? "উন্নত সেটিংস বন্ধ করুন" : "উন্নত সেটিংস (ডিফল্ট: Meta AI এবং ছবির অরিজিনাল স্টাইল)"}</span>
                  </button>
                </div>

                {showAdvanced && (
                  <div className="p-4 bg-[#040409]/90 rounded-2xl border border-white/5 space-y-4 animate-fadeIn shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                    {/* 1. Target Platforms */}
                    <div>
                      <label className="block text-xs font-bold tracking-wider text-white/70 mb-2 uppercase font-mono">
                        ভিডিও প্ল্যাটফর্ম
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Runway Gen-3", "Luma Dream Machine", "Meta AI", "Kling AI", "Sora", "Pika Labs", "General"] as TargetPlatform[]).map((plat) => (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => setTargetPlatform(plat)}
                            className={`py-2 px-2 rounded-xl text-[11px] font-bold tracking-tight text-center transition-all cursor-pointer ${
                              targetPlatform === plat
                                ? "bg-gradient-to-b from-[#6366f1] to-[#4f46e5] border-b-[4px] border-[#312e81] text-white shadow-[0_4px_0_#312e81,0_8px_16px_rgba(99,102,241,0.35)] translate-y-[-1px]"
                                : "bg-[#11111d] border border-white/5 border-b-[3px] border-b-black text-white/70 hover:text-white hover:bg-[#16162a] hover:translate-y-[-1px] shadow-[0_3px_0_#020204,0_4px_8px_rgba(0,0,0,0.4)] active:border-b-0 active:translate-y-[2px]"
                            }`}
                          >
                            {plat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Motion Pacing Speeds */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold tracking-wider text-white/70 uppercase font-mono">
                          এনিমেশন স্পিড
                        </label>
                        <span className="text-[11px] font-mono text-[#818cf8] font-bold">
                          {motionSpeed === "low" ? "ধীর" : motionSpeed === "medium" ? "স্বাভাবিক" : "দ্রুত"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-[#020205] p-1.5 rounded-xl border border-white/5 shadow-inner">
                        {(["low", "medium", "high"] as MotionSpeed[]).map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => setMotionSpeed(speed)}
                            className={`py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                              motionSpeed === speed
                                ? "bg-[#1e1b4b] text-[#cbd5e1] border-b-[2px] border-b-[#818cf8]/40 shadow-inner"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {speed === "low" ? "Slow ⏱️" : speed === "medium" ? "Normal 🎬" : "Fast ⚡"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Aesthetic Mood Preference */}
                    <div>
                      <label className="block text-xs font-bold tracking-wider text-white/70 mb-2 uppercase font-mono">
                        মোড চয়েস (স্টাইল)
                      </label>
                      <select
                        value={stylePriority}
                        onChange={(e) => setStylePriority(e.target.value)}
                        className="w-full bg-[#020205] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white/80 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none shadow-inner"
                      >
                        <option value="match">ছবির অরিজিনাল স্টাইল (Match Original)</option>
                        <option value="cinematic">সিনেম্যাটিক থ্রিডি (Cinematic 3D)</option>
                        <option value="anime">অ্যানিমে স্টাইল (Anime Style)</option>
                        <option value="3d">সাইবারপাঙ্ক গ্লো (Cyberpunk Shimmer)</option>
                        <option value="realistic">বাস্তবধর্মী ফুটেজ (Realistic 4K)</option>
                        <option value="creative">সুরিয়াল মোশন (Surreal Canvas)</option>
                      </select>
                    </div>
                  </div>
                )}

              </div>

              {/* Action synthesis Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoading || !selectedImage}
                  onClick={handleGeneratePrompts}
                  className={`w-full py-4 px-5 rounded-2xl font-bold transition-all relative overflow-hidden flex items-center justify-center gap-2.5 group cursor-pointer ${
                    isLoading 
                      ? "bg-[#1f162e] text-white/65 border-b-[4px] border-[#4a1d96] cursor-wait"
                      : !selectedImage 
                        ? "bg-[#111116]/80 text-white/20 border border-white/5 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-b from-[#6366f1] via-[#818cf8] to-[#6366f1] text-white border-b-[6px] border-[#312e81] shadow-[0_6px_0_#312e81,0_12px_24px_rgba(99,102,241,0.35)] active:border-b-0 active:translate-y-[6px]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-[#d8b4fe]" />
                      <span className="font-semibold text-xs sm:text-sm tracking-wider">এনিমেশন প্রম্পট তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-300 group-hover:scale-110 group-hover:rotate-12 transition-transform drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                      <span className="text-xs sm:text-sm tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">ম্যাজিক প্রম্পট জেনারেট করুন 🎬</span>
                    </>
                  )}
                </button>
              </div>

              {/* Simulated Live Terminal Status during Loader */}
              {isLoading && currentStep && (
                <div className="p-3.5 bg-[#030308] border border-[#a855f7]/30 rounded-xl font-mono text-[11px] leading-relaxed shadow-inner animate-pulse">
                  <div className="flex items-center gap-2 text-white/50 mb-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-ping" />
                    <span>ENGINE PROCESS LOGS:</span>
                  </div>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e879f9] to-white/70 italic font-medium">
                    {currentStep}
                  </p>
                </div>
              )}

              {/* Client Error Warnings */}
              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-100 text-xs rounded-2xl flex gap-3 leading-relaxed shadow-[0_4px_12px_rgba(239,68,68,0.15)]">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">সমস্যা ঘটেছে: </span>
                    {error}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* Right Hand: Deep Analysis & Multiple Generative Outputs */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="result-display-deck">
          
          {!result ? (
            <div className="flex-1 rounded-3xl border-2 border-white/5 bg-[#0b0c14]/40 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[350px] shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)]">
              {/* Abs grid elements */}
              <div className="absolute inset-0 bg-[#07080f]/40 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              <div className="absolute -inset-[10px] bg-gradient-to-tr from-[#6366f1]/5 via-transparent to-[#a855f7]/5 rounded-3xl blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-sm flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.5)]">
                  <Video className="w-8 h-8 text-[#818cf8]" />
                </div>
                
                <h3 className="text-sm sm:text-base font-bold text-white mb-2 font-display">
                  এনিমেশন প্রম্পট জেনারেটর
                </h3>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  বামদিকের প্যানেলে একটি ছবি আপলোড করে জেনারেট বাটনে ক্লিক করুন। আমাদের AI ইঞ্জিন ছবিটি বিশ্লেষণ করে উপযুক্ত এনিমেশন প্রম্পট বানিয়ে দিবে।
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

              {/* A. Creative Intelligence Image Analysis Summary */}
              <div className="rounded-2xl border border-white/5 bg-[#04040a]/90 p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_4px_15px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#818cf8] animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#818cf8] font-mono flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-[#818cf8]" />
                    ইমেজ এনালাইসিস
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
                  {result.imageAnalysis?.bengali || result.imageAnalysis?.english || "ইমেজের বিশ্লেষণ প্রস্তুত করা সম্ভব হয়নি।"}
                </p>
              </div>

              {/* 🏆 Master Prompt Spotlight Block (One Unified Dynamic Prompt) */}
              {result.masterPrompt && (
                <div className="rounded-3xl border-2 border-[#818cf8]/45 bg-[#0b0c15] p-5 sm:p-6 shadow-[0_12px_30px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden animate-fadeIn">
                  {/* Inner decorative light */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#818cf8]/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
                      <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
                        🏆 {result.masterPrompt.styleNameBn}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#6366f1]/20 text-[#c7d2fe] px-3 py-1 rounded-full border border-[#818cf8]/35 font-bold uppercase tracking-wider font-mono">
                      One-Prompt 🎬
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-xs sm:text-sm text-white/90 leading-relaxed bg-[#06060f]/90 p-4 rounded-xl border border-white/5 shadow-inner">
                      <span className="text-[#a5b4fc] font-bold">📌 এনিমেশন মোশন বিবরন:</span> {result.masterPrompt.explanationBn}
                    </div>

                    {/* Main English Prompt Box */}
                    <div className="relative group rounded-2xl bg-black border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.9)] overflow-hidden">
                      <div className="px-4 py-2.5 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] text-[#818cf8] font-bold font-mono">
                        <span>RECOMMENDED SINGLE PROMPT (ENGLISH)</span>
                        <span className="text-white/30 hidden xs:inline">১০০% কালার ও স্টাইল হুবহু মিল থাকবে</span>
                      </div>
                      
                      <div className="p-4 pr-32 font-mono text-xs sm:text-sm text-white leading-relaxed select-all selection:bg-[#6366f1]/50">
                        {result.masterPrompt.prompt}
                      </div>

                      {/* Copy action trigger */}
                      <div className="absolute right-3.5 top-9 sm:top-10">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.masterPrompt!.prompt, "master_copied")}
                          className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-lg border-b-[3px] cursor-pointer ${
                            copiedId === "master_copied" 
                              ? "bg-green-600 text-white border-green-800 active:border-b-0 active:translate-y-[3px]" 
                              : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] border-b-[#312e81] text-white hover:brightness-110 active:border-b-0 active:translate-y-[3px]"
                          }`}
                        >
                          {copiedId === "master_copied" ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. Tab Layout of Prompts with Copy Utility */}
              <div className="rounded-3xl border-2 border-white/5 bg-[#0b0c15] p-5 sm:p-6 shadow-[0_16px_35px_rgba(0,0,0,0.7)] flex flex-col">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc] font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#818cf8]" />
                    এনিমেশন আর্ট ক্যাটাগরি (Choose Style)
                  </span>
                  <span className="text-[10px] bg-white/5 text-white/55 px-2.5 py-1 rounded-full border border-white/10 font-bold">
                    অপ্টিমাইজড: {targetPlatform}
                  </span>
                </div>

                {/* Tabs selection buttons */}
                <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-thin scrollbar-thumb-white/10">
                  {result.prompts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveTab(p.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border-b-[3px] cursor-pointer ${
                        activeTab === p.id
                          ? "bg-[#6366f1] border-b-[#312e81] border-[#818cf8]/50 text-white shadow-md translate-y-[-1px]"
                          : "bg-[#040409] border border-white/5 border-b-black text-white/60 hover:text-white hover:bg-[#11111d] hover:translate-y-[-1px]"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === p.id ? "bg-yellow-300 animate-ping" : "bg-white/25"}`} />
                      {p.styleNameBn.split(' (')[0]}
                    </button>
                  ))}
                </div>

                {/* Tab content viewer */}
                {result.prompts.map((p) => {
                  if (p.id !== activeTab) return null;
                  return (
                    <div key={p.id} className="space-y-4 animate-fadeIn">
                      
                      {/* Accent Name block */}
                      <div className="flex items-center gap-2">
                        <CornerDownRight className="w-4 h-4 text-[#818cf8] animate-pulse" />
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {p.styleNameBn}
                        </h4>
                      </div>

                      {/* Prompt Output Code block in English */}
                      <div className="relative group rounded-2xl bg-black border border-white/10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] text-white/40 font-bold font-mono">
                          <span>READY TEXT PROMPT (ENGLISH)</span>
                          <span className="text-white/30 hidden xs:inline">optimized for copy</span>
                        </div>
                        
                        <div className="p-4 pr-32 font-mono text-xs sm:text-sm text-[#cbd5e1] leading-relaxed select-all selection:bg-[#6366f1]/50">
                          {p.prompt}
                        </div>

                        {/* Large Hover/Sticky action trigger for Copying */}
                        <div className="absolute right-3.5 top-9 sm:top-10">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.prompt, p.id)}
                            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border-b-[3px] shadow-md cursor-pointer ${
                              copiedId === p.id 
                                ? "bg-green-600 text-white border-green-800 active:border-b-0 active:translate-y-[3px]" 
                                : "bg-[#181926]/90 text-white hover:bg-[#6366f1] hover:text-white border border-white/15 border-b-black active:border-b-0 active:translate-y-[3px]"
                            }`}
                            title="কপি করুন"
                          >
                            {copiedId === p.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>কপি হয়েছে</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>কপি করুন</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>

              {/* C. Camera Movements and Presets block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Camera panning parameters */}
                <div className="rounded-3xl border border-white/10 bg-[#0b0c15] p-5 shadow-lg flex flex-col">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-white/10 mb-3 text-white">
                    <Camera className="w-4 h-4 text-[#818cf8]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70 font-mono">
                      ক্যামেরা ট্র্যাকিং মুভমেন্ট
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 flex-1 flex flex-col justify-center">
                    <div className="space-y-2">
                      {result.cameraPrompts && result.cameraPrompts.length > 0 ? (
                        result.cameraPrompts.map((cam, i) => (
                          <div key={i} className="bg-[#040409] p-3 rounded-xl border border-white/5 hover:border-[#818cf8]/35 transition-all shadow-inner text-xs flex flex-col justify-between gap-1">
                            <div className="flex justify-between items-center font-bold text-white">
                              <span className="text-[#a78bfa]">{cam.movementBn}</span>
                              <button 
                                onClick={() => copyToClipboard(cam.prompt, `cam-${i}`)}
                                className="text-[10px] text-white/40 hover:text-[#818cf8] transition-colors flex items-center gap-0.5 font-sans font-bold cursor-pointer"
                              >
                                {copiedId === `cam-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId === `cam-${i}` ? "কপি হয়েছে" : "কপি করুন"}</span>
                              </button>
                            </div>
                            <p className="text-white/50 italic font-mono text-[11px] leading-snug">"{cam.prompt}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-white/40 font-bold">মুভমেন্ট অপশন লোড করা যায়নি।</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Anti-slop / Negative Prompt optimization block */}
                <div className="rounded-3xl border border-white/10 bg-[#120a14] p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-2.5 border-b border-[#f43f5e]/15 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-[#f87171] font-mono">
                        নেগেティブ প্রম্পট (Anti-Deformity)
                      </span>
                    </div>

                    <div className="bg-[#040409] p-3 rounded-xl border border-white/5 text-xs leading-relaxed space-y-2">
                      <div className="font-mono text-[11px] text-[#cbd5e1] select-all relative group bg-black/40 p-2.5 rounded shadow-inner leading-relaxed">
                        {result.negativePrompt?.prompt || "ugly deformities, fast change, shaky, grainy, morphing"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.negativePrompt?.prompt || "ugly deformities, fast change, shaky, grainy, morphing", "negative")}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold mt-4 transition-all border-b-[3px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                      copiedId === "negative" 
                        ? "bg-green-600 border-green-800 text-white active:border-b-0 active:translate-y-[3px]" 
                        : "bg-red-950/30 text-red-300 border-red-900/30 border-b-black hover:bg-red-900/40 active:border-b-0 active:translate-y-[3px]"
                    }`}
                  >
                    {copiedId === "negative" ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>কপি হয়ে গেছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>নেগেティブ প্রম্পট কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

        </section>

      </main>

      {/* Footer Panel matching immersive design with real credentials */}
      <footer className="mt-auto border-t border-white/5 bg-[#08080a] py-3.5 px-4 sm:px-8 text-[10px] focus:outline-none tracking-widest text-white/40 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[#818cf8]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
              STATUS: READY
            </span>
            <span className="text-white/20">|</span>
            <span>GPU NODES: GEMINI MULTImodal PIPELINE ACTIVE</span>
          </div>
          
          <div className="flex items-center gap-5">
            <span>VERSION 2.3.1 (STABLE)</span>
            <span>•</span>
            <span>ক্রিয়েটিভ এনিমেশন ল্যাব</span>
          </div>
        </div>
      </footer>

      {/* Gemini API Key Configuration Modal Overlay */}
      {isApiKeyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/75 animate-fadeIn"
          onClick={() => setIsApiKeyModalOpen(false)}
        >
          {/* Modal Container */}
          <div 
            className="bg-[#0b0c15] border-2 border-white/10 rounded-2xl max-w-sm w-full p-5 relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glowing Accent Ring */}
            <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#818cf8]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-[#a855f7]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Title / Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-4 text-white">
              <div className="p-2.5 bg-[#818cf8]/10 rounded-xl border border-[#818cf8]/25 text-yellow-400">
                <Key className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-bold">Gemini API Key সেটিংস</h3>
                <p className="text-[9px] text-white/40 font-mono font-bold tracking-wider">SECURE CUSTOM KEY CONFIGURATION</p>
              </div>
            </div>

            {/* Explanatory Info Card */}
            <div className="bg-[#050508]/60 border border-white/5 rounded-xl p-3 mb-4 text-[11px] space-y-2 text-white/70 leading-relaxed font-sans shadow-inner text-left">
              <p>
                💡 <strong>কেন নিজের API Key যোগ করবেন?</strong><br />
                এপপ্সটি মোবাইলে বা হোম স্ক্রিনে ইনস্টল (PWA) করে চালালে অথবা সার্ভারের প্রম্পট তৈরির ফ্রি কোটা বায়াসড বা শেষ হয়ে গেলে, নিজের API Key যোগ করে ১০০% ফুললি নিরবচ্ছিন্নভাবে ব্যবহার করতে পারেন।
              </p>
              <p>
                🌐 <strong>কিভাবে ফ্রি কী নিবেন?</strong><br />
                ১ মিনিটে সম্পূর্ণ ফ্রিতে নিজের API Key পেতে নিচের বাটনে ক্লিক করে Google AI Studio থেকে কী জেনারেট করে আনুন।
              </p>
              <p className="pt-0.5 text-[#818cf8] font-semibold">
                * আপনার কীটি সম্পূর্ণ সুরক্ষিত থাকবে এবং শুধুমাত্র আপনার ডিভাইসের ব্রাউজারেই (Local Storage) সেভ থাকবে।
              </p>
            </div>

            {/* AI Studio Link Button */}
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full mb-4 px-4 py-2.5 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 hover:from-indigo-900 hover:to-purple-900 border border-indigo-500/20 border-b-[3px] border-b-black text-xs text-center text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>ফ্রি Gemini API Key তৈরি করুন ↗</span>
            </a>

            {/* Input Form */}
            <div className="space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-bold tracking-wider text-white/70 mb-1.5 uppercase font-mono">
                  আপনার Gemini API Key
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showApiKeyPlainText ? "text" : "password"}
                    placeholder="AI Studio API Key (যেমন: AIzaSy...)"
                    value={customApiKey}
                    onChange={(e) => handleSaveApiKey(e.target.value)}
                    className="w-full bg-[#040409] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none font-mono tracking-wider shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyPlainText(!showApiKeyPlainText)}
                    className="absolute right-3 text-white/40 hover:text-white/80 transition-colors p-1"
                    title={showApiKeyPlainText ? "লুকান" : "দেখুন"}
                  >
                    {showApiKeyPlainText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                {customApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveApiKey("");
                      setIsApiKeyModalOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-red-950/35 hover:bg-red-900/30 text-red-300 border border-red-500/20 border-b-[3px] border-b-black rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                  >
                     বাতিল করুন
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="flex-1 py-2.5 bg-gradient-to-b from-[#6366f1] to-[#4f46e5] border-b-[3px] border-b-black text-white hover:brightness-110 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {customApiKey ? "সেভ এবং সম্পন্ন" : "বন্ধ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
