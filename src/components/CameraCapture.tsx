import React, { useRef, useState, useEffect } from 'react';
import { Camera as CameraIcon, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Acesso à câmera negado. Por favor, permita o acesso nas configurações do seu navegador.");
      } else {
        setError("Não foi possível acessar a câmera. Verifique se ela está sendo usada por outro aplicativo.");
      }
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/jpeg');
        setCaptured(data);
        onCapture(data);
      }
    }
  };

  const reset = () => {
    setCaptured(null);
  };

  return (
    <div className="relative w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-800">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white text-sm font-medium mb-6">{error}</p>
          <button
            onClick={startCamera}
            className="px-6 py-2 bg-white text-zinc-900 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover scale-x-[-1] ${captured ? 'hidden' : ''}`}
          />
          {!captured ? (
            <button
              onClick={capture}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <CameraIcon className="w-8 h-8 text-zinc-900" />
            </button>
          ) : (
            <>
              <img src={captured} className="w-full h-full object-cover scale-x-[-1] absolute inset-0" alt="Captured" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                <div className="bg-emerald-500 text-white p-3 rounded-full shadow-lg">
                  <Check className="w-8 h-8" />
                </div>
              </div>
              <button
                onClick={reset}
                className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors"
                style={{ zIndex: 10 }}
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </>
          )}
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
