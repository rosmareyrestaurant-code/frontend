"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface MenuImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuImages = [
  { src: "/images/menu/menu-1.jpg", alt: "منيو روزماري - الصفحة 1" },
  { src: "/images/menu/menu-2.jpg", alt: "منيو روزماري - الصفحة 2" },
];

export default function MenuImageModal({ isOpen, onClose }: MenuImageModalProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setIsVisible(true);
      setZoom(1);
      setCurrentIndex(0);
    }
  }

  const isClosing = !isOpen && isVisible;

  useEffect(() => {
    if (!isClosing) return;
    const timer = setTimeout(() => setIsVisible(false), 280);
    return () => clearTimeout(timer);
  }, [isClosing]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isVisible) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % menuImages.length);
    setZoom(1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + menuImages.length) % menuImages.length);
    setZoom(1);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.3, 1));

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/95 backdrop-blur-sm ${
          isClosing ? "anim-backdrop-fade-out" : "anim-backdrop-fade"
        }`}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            منيو روزماري ({currentIndex + 1}/{menuImages.length})
          </h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden">
          <div
            className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
              isClosing ? "scale-90 opacity-0" : "scale-100 opacity-100"
            }`}
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="relative w-full h-full max-h-[80vh]">
              <Image
                src={menuImages[currentIndex].src}
                alt={menuImages[currentIndex].alt}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 p-4 bg-gradient-to-t from-black/80 to-transparent">
          {/* Navigation Arrows */}
          {menuImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="الصفحة السابقة"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              aria-label="تصغير"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-white min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              aria-label="تكبير"
              className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {menuImages.length > 1 && (
            <>
              <button
                onClick={handleNext}
                aria-label="الصفحة التالية"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
