"use client";

import { Button } from "@/components/ui/button";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  const [step, setStep] = useState(1);

  return (
    <>
      <main className="w-full h-full">
        <div className="flex flex-col items-center justify-start h-full w-full bg-[url('/images/background.svg')] bg-cover bg-center">
          <div className="flex flex-col justify-center h-full">
            <div className="flex flex-col justify-center gap-4 border-2 bg-white border-zinc-400 rounded-lg shadow-lg p-8">
              {step === 1 ? (
                <div className="flex flex-col gap-4 max-w-lg p-8">
                  <h1
                    className={`text-4xl font-bold text-center ${firaCode.className}`}
                  >
                    Welcome!
                  </h1>
                  <p className="text-xl text-center">
                    In this experiment, you will make decisions about completing
                    mathematical tasks. Your choices will influence how you
                    progress and the rewards you can earn.
                  </p>
                  <Button
                    className={`w-full ${firaCode.className} text-lg`}
                    onClick={() => setStep(2)}
                  >
                    Next
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <img
                    src="/images/mouse.png"
                    alt="Mouse instruction"
                    className="max-w-lg mx-auto"
                  />
                  <Button
                    className={`w-full ${firaCode.className} text-lg p-0`}
                  >
                    <Link
                      className="w-full h-full flex justify-center items-center"
                      href="/form"
                    >
                      Start
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
