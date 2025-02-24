import { useEffect, useRef, useState } from "react";

type MouseDetectionProps = {
  onDeviceTypeChange: (deviceType: "mouse" | "trackpad") => void;
};

const MouseDetection = ({ onDeviceTypeChange }: MouseDetectionProps) => {
  const [mouseType, setMouseType] = useState<"mouse" | "trackpad" | "unknown">(
    "unknown"
  );
  const lastEventRef = useRef<number>(0);
  const eventCountRef = useRef<number>(0);

  // console.log(mouseType);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handlePointerMove = (event: PointerEvent) => {
      clearTimeout(timeoutId);

      const currentTime = performance.now();
      const timeDelta = currentTime - lastEventRef.current;

      if (timeDelta < 100) {
        eventCountRef.current += 1;
      }

      lastEventRef.current = currentTime;

      timeoutId = setTimeout(() => {
        if (eventCountRef.current > 10) {
          setMouseType("trackpad");
          onDeviceTypeChange("trackpad");
        } else {
          setMouseType("mouse");
          onDeviceTypeChange("mouse");
        }
        eventCountRef.current = 0;
      }, 500);
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      clearTimeout(timeoutId);
    };
  }, [onDeviceTypeChange]);

  return null;
};

export default MouseDetection;
