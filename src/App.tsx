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
  Download
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

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catch PWA beforeinstallprompt event trigger
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      // Prevent automatic banner show to handle manually
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("PWA install availability detected (beforeinstallprompt fired).");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If app is already installed or runs in standalone display mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert("মোবাইলে ইনস্টল করতে ব্রাউজারের থ্রি-ডট মেনু থেকে 'Add to Home Screen' চাপুন।");
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation response outcome: ${outcome}`);
    } catch (e) {
      console.error("Installation flow failed:", e);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
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

    if (file.size > 12 * 1024 * 1024) {
      setError("ফাইলের সাইজ খুবই বড় (সর্বোচ্চ ১২ মেগাবাইট অনুমোদন করা হয়)।");
      return;
    }

    setImageName(file.name);
    setMimeType(file.type);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setSelectedImage(base64Data);
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
        const errorData = await response.json();
        throw new Error(errorData.error || "সার্ভার থেকে প্রম্পট তৈরি করতে ব্যর্থ হয়েছে।");
      }

      const rawResult: AnimationPromptResult = await response.json();
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
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#08080c]/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#6366f1] to-[#a855f7] opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-10 h-10 bg-[#0c0c14] rounded-lg border border-white/10 flex items-center justify-center text-white">
              <Sparkles className="w-5.5 h-5.5 text-[#818cf8] animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AnimAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#a78bfa] to-[#c084fc] font-semibold text-xs uppercase tracking-[0.15em] hidden sm:inline-block">Prompt Studio</span>
            </h1>
            <p className="text-[10px] text-[#818cf8] tracking-wider font-mono hidden sm:block">AI PROMPT STUDIO</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium">
          <button 
            onClick={handleInstallApp}
            className="px-2.5 py-1.5 rounded-lg border border-[#818cf8]/30 bg-[#6366f1]/10 text-[#c7d2fe] hover:bg-[#6366f1]/20 hover:border-[#818cf8]/50 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs font-semibold"
            title="মোবাইলে বা হোম স্ক্রিনে অ্যাপটি ইনস্টল করুন"
          >
            <Smartphone className={`w-3.5 h-3.5 text-emerald-400 ${isInstallable ? "animate-bounce" : "animate-pulse"}`} />
            <span>ইনস্টল করুন</span>
          </button>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
              showHistory 
                ? "bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/40" 
                : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden xs:inline">প্রম্পট আর্কাইভ</span>
            {historyList.length > 0 && (
              <span className="bg-[#6366f1] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold">
                {historyList.length}
              </span>
            )}
          </button>
          
          <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-4 text-white/40">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-[11px] font-mono tracking-wider">GEMINI 3.5 ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Hand: Upload Image, Presets, Form Configurations */}
        <section className="lg:col-span-5 flex flex-col gap-6" id="upload-deck-card">
          
          {/* History Sidebar Panel over the configs when open */}
          {showHistory && (
            <div className="bg-[#0b0c14] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col max-h-[350px] lg:max-h-none lg:flex-1 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                <span className="text-sm font-semibold flex items-center gap-2 text-white">
                  <History className="w-4 h-4 text-[#818cf8]" />
                  রিসেন্ট জেনারেশন সমূহ (History)
                </span>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-white/40 hover:text-white hover:bg-white/5 p-1 rounded-md text-xs"
                >
                  বন্ধ করুন
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <ImageIcon className="w-10 h-10 text-white/10 mb-2" />
                  <p className="text-xs text-white/40">এখনও কোনো ইমেজ প্রস্তুত করা হয়নি।</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {historyList.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => selectHistoryItem(item)}
                      className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex gap-3 cursor-pointer transition-all duration-200 hover:border-[#6366f1]/40"
                    >
                      <div className="w-14 h-14 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={item.imageData} 
                          alt={item.imageName} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-medium text-white/90 truncate pr-2 group-hover:text-[#818cf8] transition-colors">{item.imageName}</p>
                          <button 
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="text-white/30 hover:text-red-400 p-0.5 rounded transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/45 font-mono mt-1">
                          <span>{item.settings.targetPlatform}</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t border-white/5 mt-4 text-[10px] text-[#818cf8]/75 text-center italic">
                * জেনারেটকৃত সকল প্রম্পট লোকাল স্টোরেজে নিরাপদে স্টোর থাকে।
              </div>
            </div>
          )}

          {/* Core Upload and Setting form (Only show as flex-1 if history is closed or screens are small) */}
          {(!showHistory || !showHistory) && (
            <div className="bg-[#0b0c14]/40 border border-white/5 rounded-2xl p-5 sm:p-6 backdrop-blur-sm flex flex-col gap-6">
              
              {/* Image Drag N Drop Workspace */}
              <div>
                <label className="block text-xs font-bold tracking-wider text-white/60 mb-2 uppercase font-mono">
                  ১. ইমেজ আপলোড করুন <span className="text-[#a855f7]">*</span>
                </label>
                
                {!selectedImage ? (
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className="group border-2 border-dashed border-white/10 hover:border-[#6366f1]/40 bg-[#07080f]/90 hover:bg-[#0c0d17] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Glowing effect inside drag field */}
                    <div className="absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_50%)] pointer-events-none" />

                    <div className="w-14 h-14 bg-white/5 group-hover:bg-[#6366f1]/10 rounded-full flex items-center justify-center mb-4 border border-white/10 group-hover:border-[#6366f1]/30 transition-all duration-300">
                      <Upload className="w-6 h-6 text-white/50 group-hover:text-[#818cf8] transition-colors" />
                    </div>
                    
                    <h4 className="text-sm font-semibold text-white group-hover:text-[#818cf8] transition-colors">
                      ইমেজ ড্রপ করুন বা ক্লিক করে ব্রাউজ করুন
                    </h4>
                    <p className="text-xs text-white/40 mt-1 max-w-xs">
                      অনুমোদিত ফরম্যাট: PNG, JPG, JPEG, WEBP (সর্বোচ্চ ১২ মেগাবাইট)
                    </p>
                    
                    <button 
                      type="button" 
                      className="mt-4 px-4 py-1.5 bg-white/5 text-xs font-semibold text-white/80 rounded-lg border border-white/10 group-hover:bg-[#6366f1] group-hover:text-white group-hover:border-transparent transition-all duration-300"
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
                  <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex flex-col items-center">
                    <div className="relative w-full aspect-video bg-black/95 flex items-center justify-center overflow-hidden">
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
                            className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors"
                            title="ইমেজ রিমুভ করুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="bg-black/60 backdrop-blur-sm p-2 rounded-lg border border-white/10 text-white/90 text-xs truncate">
                          📄 {imageName}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tiny footer under the active image preview */}
                    <div className="w-full px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-white/50 truncate max-w-[70%]">{imageName}</span>
                      <button 
                        type="button"
                        onClick={removeSelectedImage} 
                        className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
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
                    <label className="block text-xs font-bold tracking-wider text-white/60 uppercase font-mono">
                      কাস্টম নির্দেশ (ঐচ্ছিক)
                    </label>
                    <span className="text-[10px] text-[#818cf8]">খালি রাখলে AI স্বয়ংক্রিয়ভাবে ভিডিও প্রম্পট লিখে দেবে</span>
                  </div>
                  <textarea
                    rows={2}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="যেমন: ধীরে ধীরে ক্যামেরা বামে ঘুরবে..."
                    className="w-full bg-[#07080f] border border-white/10 rounded-xl p-2.5 text-xs text-white/80 placeholder:text-white/30 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Collapsible Advanced Options Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-semibold text-[#818cf8] hover:text-[#c084fc] transition-colors font-mono py-1"
                  >
                    <Sliders className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-90 text-[#a855f7]" : ""}`} />
                    <span>{showAdvanced ? "উন্নত সেটিংস বন্ধ করুন" : "উন্নত সেটিংস (ডিফল্ট: Meta AI এবং ছবির অরিজিনাল স্টাইল)"}</span>
                  </button>
                </div>

                {showAdvanced && (
                  <div className="p-4 bg-[#07080f]/60 rounded-2xl border border-white/5 space-y-4 animate-fadeIn">
                    {/* 1. Target Platforms */}
                    <div>
                      <label className="block text-xs font-bold tracking-wider text-white/60 mb-2 uppercase font-mono">
                        ভিডিও প্ল্যাটফর্ম
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Runway Gen-3", "Luma Dream Machine", "Meta AI", "Kling AI", "Sora", "Pika Labs", "General"] as TargetPlatform[]).map((plat) => (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => setTargetPlatform(plat)}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold tracking-tight border text-center transition-all ${
                              targetPlatform === plat
                                ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] border-transparent text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                                : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10 hover:text-white"
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
                        <label className="block text-xs font-bold tracking-wider text-white/60 uppercase font-mono">
                          এনিমেশন স্পিড
                        </label>
                        <span className="text-[11px] font-mono text-[#818cf8] font-semibold">
                          {motionSpeed === "low" ? "ধীর" : motionSpeed === "medium" ? "স্বাভাবিক" : "দ্রুত"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-[#07080f] p-1 rounded-xl border border-white/5">
                        {(["low", "medium", "high"] as MotionSpeed[]).map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => setMotionSpeed(speed)}
                            className={`py-1 rounded-lg text-xs font-medium text-center transition-all ${
                              motionSpeed === speed
                                ? "bg-white/10 text-white shadow-inner font-semibold border border-white/15"
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
                      <label className="block text-xs font-bold tracking-wider text-white/60 mb-2 uppercase font-mono">
                        মোড চয়েস (স্টাইল)
                      </label>
                      <select
                        value={stylePriority}
                        onChange={(e) => setStylePriority(e.target.value)}
                        className="w-full bg-[#07080f] border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-white/80 focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none"
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
                  className={`w-full py-3.5 sm:py-4 px-4 rounded-xl font-bold transition-all relative overflow-hidden flex items-center justify-center gap-2 group ${
                    isLoading 
                      ? "bg-[#1f162e] text-white/65 border border-[#a855f7]/30 cursor-wait"
                      : !selectedImage 
                        ? "bg-[#111116] text-white/30 border border-white/5 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#6366f1] via-[#818cf8] to-[#a855f7] hover:from-[#4f46e5] hover:to-[#9333ea] text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)] active:scale-[0.98]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-[#a855f7]" />
                      <span className="font-semibold text-xs sm:text-sm tracking-wider">এনিমেশন প্রম্পট তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-100 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
                      <span className="text-xs sm:text-sm tracking-wide">ম্যাজিক প্রম্পট জেনারেট করুন 🎬</span>
                    </>
                  )}
                </button>
              </div>

              {/* Simulated Live Terminal Status during Loader */}
              {isLoading && currentStep && (
                <div className="p-3 bg-[#07080f] border border-[#a855f7]/15 rounded-xl font-mono text-[11px] leading-relaxed animate-pulse">
                  <div className="flex items-center gap-2 text-white/40 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-ping" />
                    <span>ENGINE PROCESS LOGS:</span>
                  </div>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 italic">
                    {currentStep}
                  </p>
                </div>
              )}

              {/* Client Error Warnings */}
              {error && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-100 text-xs rounded-xl flex gap-3 leading-relaxed">
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
            <div className="flex-1 rounded-2xl border border-white/5 bg-[#0b0c14]/20 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[350px]">
              {/* Abs grid elements */}
              <div className="absolute inset-0 bg-[#07080f]/40 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              <div className="absolute -inset-[10px] bg-gradient-to-tr from-[#6366f1]/5 via-transparent to-[#a855f7]/5 rounded-3xl blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-sm flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-lg">
                  <Video className="w-7 h-7 text-[#818cf8]" />
                </div>
                
                <h3 className="text-sm sm:text-base font-bold text-white mb-2 font-display">
                  এনিমেশন প্রম্পট জেনারেটর
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  বামদিকের প্যানেলে একটি ছবি আপলোড করে জেনারেট বাটনে ক্লিক করুন। আমাদের AI ইঞ্জিন ছবিটি বিশ্লেষণ করে উপযুক্ত এনিমেশন প্রম্পট বানিয়ে দিবে।
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

              {/* A. Creative Intelligence Image Analysis Summary */}
              <div className="rounded-xl border border-white/5 bg-[#0b0c14]/40 p-4.5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#818cf8] font-mono flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" />
                    ইমেজ এনালাইসিস
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  {result.imageAnalysis?.bengali || result.imageAnalysis?.english || "ইমেজের বিশ্লেষণ প্রস্তুত করা সম্ভব হয়নি।"}
                </p>
              </div>

              {/* 🏆 Master Prompt Spotlight Block (One Unified Dynamic Prompt) */}
              {result.masterPrompt && (
                <div className="rounded-2xl border-2 border-[#818cf8]/40 bg-[#0e0f1d] p-5 sm:p-6 shadow-[0_0_25px_rgba(99,102,241,0.15)] relative overflow-hidden animate-fadeIn">
                  {/* Inner decorative light */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#818cf8]/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
                      <span className="text-xs sm:text-sm font-bold tracking-wide text-white">
                        🏆 {result.masterPrompt.styleNameBn}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#818cf8]/20 text-[#c7d2fe] px-2.5 py-1 rounded-full border border-[#818cf8]/30 font-semibold uppercase tracking-wider font-mono">
                      One-Prompt 🎬
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-xs sm:text-sm text-white/90 leading-relaxed bg-[#111122]/80 p-3.5 rounded-xl border border-[#818cf8]/10">
                      <span className="text-[#a5b4fc] font-bold">📌 এনিমেশন মোশন বিবরন:</span> {result.masterPrompt.explanationBn}
                    </div>

                    {/* Main English Prompt Box */}
                    <div className="relative group rounded-xl bg-black border border-white/15 overflow-hidden">
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] text-[#818cf8] font-mono">
                        <span>RECOMMENDED SINGLE PROMPT (ENGLISH)</span>
                        <span className="text-white/30">১০০% কালার ও স্টাইল হুবহু মিল থাকবে</span>
                      </div>
                      
                      <div className="p-4 pr-32 font-mono text-xs sm:text-sm text-white leading-relaxed select-all selection:bg-[#6366f1]/50">
                        {result.masterPrompt.prompt}
                      </div>

                      {/* Copy action trigger */}
                      <div className="absolute right-3.5 top-10">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(result.masterPrompt!.prompt, "master_copied")}
                          className={`p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-xl ${
                            copiedId === "master_copied" 
                              ? "bg-green-600 text-white" 
                              : "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:from-[#4f46e5] hover:to-[#7c3aed]"
                          }`}
                        >
                          {copiedId === "master_copied" ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>কপি হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>প্রম্পট কপি করুন</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* B. Tab Layout of Prompts with Copy Utility */}
              <div className="rounded-2xl border border-white/10 bg-[#0b0c14]/75 p-5 sm:p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60 font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#818cf8]" />
                    এনিমেশন আর্ট ক্যাটাগরি (Choose Style)
                  </span>
                  <span className="text-[10px] bg-white/5 text-white/55 px-2.5 py-1 rounded-full border border-white/10">
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
                      className={`py-2 px-3 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        activeTab === p.id
                          ? "bg-[#6366f1]/25 border-[#6366f1]/50 text-white font-semibold"
                          : "bg-[#050508] border-white/5 text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${activeTab === p.id ? "bg-[#c084fc]" : "bg-white/25"}`} />
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
                        <CornerDownRight className="w-4 h-4 text-[#818cf8]" />
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {p.styleNameBn}
                        </h4>
                      </div>

                      {/* Prompt Output Code block in English */}
                      <div className="relative group rounded-xl bg-black border border-white/10 overflow-hidden">
                        <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] text-white/40 font-mono">
                          <span>READY TEXT PROMPT (ENGLISH)</span>
                          <span className="text-white/30">optimized for copy</span>
                        </div>
                        
                        <div className="p-4 pr-32 font-mono text-xs sm:text-sm text-[#cbd5e1] leading-relaxed select-all selection:bg-[#6366f1]/50">
                          {p.prompt}
                        </div>

                        {/* Large Hover/Sticky action trigger for Copying */}
                        <div className="absolute right-3 top-10">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.prompt, p.id)}
                            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all shadow-lg ${
                              copiedId === p.id 
                                ? "bg-green-600 text-white" 
                                : "bg-[#181926]/90 text-white hover:bg-[#6366f1] hover:text-white border border-white/10"
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
                <div className="rounded-xl border border-white/5 bg-[#0b0c14]/40 p-4 shadow-sm flex flex-col">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5 mb-2.5">
                    <Camera className="w-4 h-4 text-[#818cf8]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/70 font-mono">
                      ক্যামেরা ট্র্যাকিং মুভমেন্ট
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 flex-1 flex flex-col">
                    <div className="space-y-2">
                      {result.cameraPrompts && result.cameraPrompts.length > 0 ? (
                        result.cameraPrompts.map((cam, i) => (
                          <div key={i} className="bg-[#050508]/60 p-2.5 rounded-xl border border-white/5 text-xs">
                            <div className="flex justify-between items-center mb-1 font-semibold text-white">
                              <span className="text-[#a78bfa]">{cam.movementBn}</span>
                              <button 
                                onClick={() => copyToClipboard(cam.prompt, `cam-${i}`)}
                                className="text-[10px] hover:text-[#818cf8] transition-colors flex items-center gap-0.5"
                              >
                                {copiedId === `cam-${i}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId === `cam-${i}` ? "কপি" : "কপি"}</span>
                              </button>
                            </div>
                            <p className="text-white/50 italic font-mono text-[11px] leading-snug">"{cam.prompt}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-white/40">মুভমেন্ট অপশন লোড করা যায়নি।</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Anti-slop / Negative Prompt optimization block */}
                <div className="rounded-2xl border border-white/10 bg-[#0b0c14]/60 p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-2.5 border-b border-white/5 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60 font-mono">
                        নেগেটিভ প্রম্পট (Anti-Deformity)
                      </span>
                    </div>

                    <div className="bg-[#050508] p-3 rounded-xl border border-white/5 text-xs leading-relaxed space-y-2">

                      <div className="font-mono text-[11px] text-[#cbd5e1] select-all relative group bg-black/40 p-2 rounded">
                        {result.negativePrompt?.prompt || "ugly deformities, fast change"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.negativePrompt?.prompt || "", "negative")}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold mt-4 transition-all flex items-center justify-center gap-1.5 ${
                      copiedId === "negative" 
                        ? "bg-green-600 text-white" 
                        : "bg-red-950/25 text-red-300 hover:bg-red-900/30 border border-red-500/10"
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
                        <span>নেগেটিভ প্রম্পট কপি করুন</span>
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
    </div>
  );
}
