"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Volume2, RefreshCcw, Loader2 } from "lucide-react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");

  const speak = (text: string) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 1.0;
    
    // Attempt to find Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang.includes("id"));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCameraAccess(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      speak("Gagal mengakses kamera. Pastikan izin telah diberikan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    setTimeout(() => {
      startCamera();
    }, 0);
    
    // Announce the app is uninitialized
    speak("Aplikasi asisten penglihatan siap. Ketuk di mana saja di separuh layar bawah untuk mulai mendeskripsikan sekitar Anda.");

    return () => {
      stopCamera();
      window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureAndDescribe = async () => {
    if (!hasCameraAccess || isProcessing) return;

    if (videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      setError("");
      speak("Sedang memproses gambar...");

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageBase64 = canvas.toDataURL("image/jpeg", 0.7); // compress a bit

        try {
          const response = await fetch("/api/describe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageBase64,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Gagal mendapatkan deskripsi");
          }

          setDescription(data.text);
          speak(data.text);
        } catch (err: any) {
          console.error("Describe error:", err);
          setError("Terjadi kesalahan saat mendeskripsikan.");
          speak("Terjadi kesalahan jaringan.");
        } finally {
          setIsProcessing(false);
        }
      }
    }
  };

  const toggleCamera = () => {
    stopCamera();
    startCamera();
  };

  return (
    <div className="w-full h-[100dvh] bg-zinc-950 p-4 md:p-6 flex flex-col gap-4 font-sans text-zinc-100 overflow-hidden">
      {/* Hidden canvas for taking snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <header className="h-16 flex justify-between items-center bg-zinc-900/50 border border-zinc-800 px-4 md:px-6 rounded-2xl shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${hasCameraAccess ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <div className={`absolute w-6 h-6 border rounded-full ${hasCameraAccess ? 'border-emerald-500/30' : 'border-red-500/30'}`}></div>
          </div>
          <h1 className="text-xl font-black tracking-widest text-white">
            LENSA<span className="text-emerald-500">SUARA</span>
            <span className="hidden md:inline text-[10px] font-normal text-zinc-500 ml-2">ACCESSIBILITY</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-800/80 rounded-lg border border-zinc-700">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-xs font-mono tracking-widest">AUDIO ENGINE</span>
          </div>
          <button
            onClick={toggleCamera}
            className="p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition flex items-center justify-center text-zinc-400 hover:text-zinc-100"
            aria-label="Muat ulang kamera"
          >
            <RefreshCcw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 min-h-0 z-10">
        
        {/* Camera / Focus Area */}
        <section className="col-span-1 md:col-span-8 md:row-span-4 bg-zinc-900 border-2 border-zinc-800 rounded-[32px] relative overflow-hidden shadow-2xl flex flex-col min-h-[300px] md:min-h-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none"></div>
          
          <div className="absolute top-4 left-4 md:top-6 md:left-6 p-3 px-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 z-20 pointer-events-none">
            <p className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest mb-1">Analisis Lingkungan</p>
            <p className="text-sm md:text-lg font-medium">{isProcessing ? "Menganalisis bingkai..." : "Sensor Kamera Aktif"}</p>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-10">
            <div className="w-[200px] h-[200px] md:w-[400px] md:h-[400px] border border-emerald-500/10 rounded-full flex items-center justify-center">
              <div className="w-[120px] h-[120px] md:w-[240px] md:h-[240px] border border-emerald-500/20 rounded-full flex items-center justify-center">
                <div className="w-[40px] h-[40px] md:w-[80px] md:h-[80px] border border-emerald-500/40 rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Status / Output Audio Text Box */}
        <section className="col-span-1 md:col-span-4 md:row-span-4 bg-zinc-900 border border-zinc-800 rounded-[32px] p-5 md:p-6 flex flex-col shadow-lg overflow-hidden">
          <h3 className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 shrink-0">Output Deskripsi</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center gap-4 overflow-y-auto min-h-0 mb-4">
            {error ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center w-full">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            ) : description ? (
              <div className="w-full my-auto pb-4">
                 <p className="text-lg md:text-2xl font-bold leading-tight text-white mb-4 drop-shadow-lg break-words">
                  &quot;{description}&quot;
                 </p>
                 <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase border border-emerald-500/20">Narasi Selesai</span>
                 </div>
              </div>
            ) : (
               <div className="text-center my-auto">
                  <Volume2 className="w-10 h-10 md:w-16 md:h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-sm md:text-base font-semibold text-zinc-400">Menunggu Input Visual</p>
                  <p className="text-[10px] md:text-xs text-zinc-600 mt-1 uppercase tracking-widest">Ketuk pemindai di bawah</p>
               </div>
            )}
          </div>
          
          <button 
            onClick={() => window.speechSynthesis.cancel()}
            className="w-full shrink-0 py-3 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-[10px] md:text-xs uppercase tracking-widest transition-colors border border-zinc-700"
          >
            Hentikan Suara
          </button>
        </section>

        {/* Giant Action Panel */}
        <section 
          className="col-span-1 md:col-span-12 md:row-span-2 rounded-[32px] shadow-xl overflow-hidden relative group shrink-0 min-h-[140px] md:min-h-0"
        >
          <div className={`absolute inset-0 transition-all duration-300 ${hasCameraAccess && !isProcessing ? 'opacity-100 bg-emerald-500' : 'opacity-100 bg-zinc-800 border-2 border-zinc-800'}`}></div>
          <button
            onClick={captureAndDescribe}
            disabled={!hasCameraAccess || isProcessing}
            className={`relative z-10 w-full h-full p-6 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 transition-colors
              ${
                !hasCameraAccess || isProcessing
                  ? "text-zinc-500"
                  : "text-black hover:bg-emerald-400/20 active:bg-emerald-600/20"
              } 
              disabled:cursor-not-allowed`}
            aria-label="Ketuk untuk mendeskripsikan sekitar"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-10 h-10 md:w-14 md:h-14 animate-spin text-emerald-500" />
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h3 className="font-black text-xl md:text-3xl uppercase tracking-wide text-zinc-300">Memproses Frame...</h3>
                  <p className="text-sm font-medium text-zinc-500 mt-1 uppercase tracking-widest">Mengirim ke AI Engine</p>
                </div>
              </>
            ) : (
               <>
                 <div className={`p-4 rounded-2xl shrink-0 ${hasCameraAccess ? 'bg-black/10' : 'bg-black/30'}`}>
                    <Camera className="w-10 h-10 md:w-14 md:h-14 opacity-90" />
                 </div>
                 <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <h3 className="font-black text-2xl md:text-3xl uppercase tracking-wide">Pindai Area Ruangan</h3>
                    <p className={`text-xs md:text-sm font-bold mt-1 uppercase tracking-widest ${hasCameraAccess ? 'text-emerald-900' : 'text-zinc-600'}`}>
                      Sentuh tombol ini untuk deskripsi audio
                    </p>
                 </div>
               </>
            )}
          </button>
        </section>

      </main>
    </div>
  );
}
