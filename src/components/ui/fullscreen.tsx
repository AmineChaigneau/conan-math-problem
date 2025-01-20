"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFullscreenStatus } from "@/hooks/useFullscreenStatus";
import { Fira_Code } from "next/font/google";
import React, { useCallback, useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const MIN_WIDTH = 800; // Set your minimum width in pixels
const MIN_HEIGHT = 900; // Set your minimum height in pixels
const MAX_WIDTH = 3000; // Set your maximum width in pixels
const MAX_HEIGHT = 2280; // Set your maximum height in pixels

const FullScreen: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
}> = ({ children, isActive }) => {
  const maximizeElement = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useFullscreenStatus(maximizeElement);
  const [isValidSize, setIsValidSize] = useState(true);
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(true);

  // Check browser compatibility
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isChrome = /chrome|chromium|crios/i.test(userAgent);
    const isFirefox = /firefox|fxios/i.test(userAgent);
    setIsSupportedBrowser(isChrome || isFirefox);
  }, []);

  // Only check window size after fullscreen is enabled
  useEffect(() => {
    if (isFullscreen) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const valid =
        width >= MIN_WIDTH &&
        width <= MAX_WIDTH &&
        height >= MIN_HEIGHT &&
        height <= MAX_HEIGHT;
      setIsValidSize(valid);

      const checkWindowSize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const valid =
          width >= MIN_WIDTH &&
          width <= MAX_WIDTH &&
          height >= MIN_HEIGHT &&
          height <= MAX_HEIGHT;
        setIsValidSize(valid);
      };

      window.addEventListener("resize", checkWindowSize);
      return () => window.removeEventListener("resize", checkWindowSize);
    }
  }, [isFullscreen]);

  const handleClick = useCallback(() => {
    if (typeof setIsFullscreen === "function") {
      setIsFullscreen();
    }
  }, [setIsFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      console.log(`browser detect fullscreenMode: ${isFullscreen}`);
    }
  }, [isFullscreen]);

  if (!setIsFullscreen) {
    return <div>Fullscreen mode is not supported by your browser.</div>;
  }

  if (!isSupportedBrowser) {
    return (
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={`${firaCode.className} text-center text-2xl`}
            >
              UNSUPPORTED BROWSER
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-lg text-center">
            This experiment requires <strong>Google Chrome</strong> or{" "}
            <strong>Mozilla Firefox</strong>.
            <p className="mt-4 text-center">
              Please switch to one of these supported browsers to continue.
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  // Early return if not active
  if (!isActive) {
    return children;
  }

  return (
    <div ref={maximizeElement}>
      {!isFullscreen && (
        <>
          <Dialog open>
            <DialogContent>
              <DialogHeader>
                <DialogTitle
                  className={`${firaCode.className} text-center text-2xl`}
                >
                  FULLSCREEN REQUIRED
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-lg">
                By continuing your browser will use{" "}
                <strong className="text-orange-500">
                  the entire display surface of your screen
                </strong>{" "}
                (i.e. fullscreen mode). You will not be able to interact with
                the experiment if fullscreen mode is not enabled.
              </DialogDescription>
              <Button
                onClick={handleClick}
                className={`w-full ${firaCode.className} text-lg bg-orange-500`}
              >
                Switch to fullscreen mode
              </Button>
            </DialogContent>
          </Dialog>
          <div className="h-screen w-screen bg-white"></div>
        </>
      )}

      {isFullscreen && !isValidSize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-10 max-w-md mx-auto shadow-lg">
            <div className="mb-6">
              <h2 className={`${firaCode.className} text-center text-2xl`}>
                INCOMPATIBLE SCREEN SIZE
              </h2>
            </div>
            <div className="text-lg">
              Your screen resolution ({window.innerWidth}x{window.innerHeight})
              is not compatible with this experiment.
            </div>
            <p className="text-center mt-2">
              Required dimensions:{" "}
              <b>
                {MIN_WIDTH}x{MIN_HEIGHT}
              </b>{" "}
              to{" "}
              <b>
                {MAX_WIDTH}x{MAX_HEIGHT}
              </b>{" "}
              pixels.
            </p>
            <p className="text-center mt-2">
              Please <b>adjust your window size</b> or use a different device.
              To do so, <b className="text-red-500">you can zoom out</b> (press{" "}
              <i>Ctrl/Cmb</i> and <i>-</i>)
            </p>
          </div>
        </div>
      )}

      {isFullscreen && isValidSize && children}
    </div>
  );
};

export default FullScreen;
