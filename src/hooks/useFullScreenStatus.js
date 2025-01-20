"use client";

import { useLayoutEffect, useState } from "react";

export function useFullscreenStatus(elRef) {
  const [isFullscreen, setIsFullscreen] = useState(
    typeof document !== "undefined" &&
      document[getBrowserFullscreenElProp()] != null
  );

  const setFullscreen = () => {
    if (elRef.current == null) return;

    const container =
      elRef.current.closest(".fullscreen-container") || elRef.current;

    container
      .requestFullscreen()
      .then(() => {
        setIsFullscreen(
          typeof document !== "undefined" &&
            document[getBrowserFullscreenElProp()] != null
        );
      })
      .catch((err) => {
        console.error("Error attempting to enable fullscreen mode:", err);
        setIsFullscreen(false);
      });
  };

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;

    const handleFullscreenChange = () => {
      setIsFullscreen(document[getBrowserFullscreenElProp()] != null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return [isFullscreen, setFullscreen];
}

function getBrowserFullscreenElProp() {
  if (typeof document.fullscreenElement !== "undefined") {
    return "fullscreenElement";
  } else if (typeof document.mozFullScreenElement !== "undefined") {
    return "mozFullScreenElement";
  } else if (typeof document.msFullscreenElement !== "undefined") {
    return "msFullscreenElement";
    // } else if (typeof document.webkitFullscreenElement !== "undefined") {
    //   return "webkitFullscreenElement";
  } else {
    throw new Error("fullscreenElement is not supported by this browser");
  }
}
