"use client";

import { auth, storage } from "@/config/firebase";
import { ref, uploadString } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormScale } from "./form";
import { GritScale } from "./grit";

export default function Scales() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleData, setScaleData] = useState<{
    grit?: { score: number; responses: string[] };
    form?: {
      hasWorkedBefore: string;
      workDuration?: string;
      sleepQuality: string;
    };
  }>({});
  const router = useRouter();

  const handleGritComplete = async (score: number, responses: string[]) => {
    setScaleData((prev) => ({
      ...prev,
      grit: { score, responses },
    }));
    setCurrentStep(2);
  };

  const handleFormComplete = async (formData: {
    hasWorkedBefore: string;
    workDuration?: string;
    sleepQuality: string;
  }) => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user found");
        return;
      }

      const finalData = {
        ...scaleData,
        form: formData,
        timestamp: new Date().toISOString(),
      };

      const storagePath = `participants/${user.uid}`;
      const storageRef = ref(storage, `${storagePath}/scales.json`);
      await uploadString(storageRef, JSON.stringify(finalData, null, 2), "raw");

      router.push("/end"); // Navigate to end page after saving
    } catch (error) {
      console.error("Error saving scale data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <GritScale onComplete={handleGritComplete} />;
      case 2:
        return <FormScale onComplete={handleFormComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="py-16 flex flex-col items-center justify-center gap-4 h-full w-full bg-[url('/images/background.svg')] bg-cover bg-center">
      <div className="flex flex-col w-full max-w-4xl overflow-y-scroll gap-4 p-6 border-2 bg-white border-zinc-400 rounded-lg shadow-lg">
        {renderStep()}
      </div>

      {isLoading && (
        <div className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-80 flex items-center justify-center">
          <img src="/images/loading.svg" alt="Loading..." className="h-8" />
        </div>
      )}
    </div>
  );
}
