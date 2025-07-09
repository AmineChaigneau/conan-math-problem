"use client";

import { Button } from "@/components/ui/button";
import { GAMEMODE } from "@/constants/block";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export default function Instructions() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      title: "How to Play",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/howtoplay.png" alt="Howtoplay" />
        </div>
      ),
    },
    {
      title: "How to Respond",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/howtorespond.png" alt="Howtorespond" />
        </div>
      ),
    },
    {
      title: "Number Letter",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/numberletter.png" alt="Numberletter" />
        </div>
      ),
    },
    {
      title: "Number Sequences",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img
            src={
              GAMEMODE === "restart"
                ? "/images/error_restart.png"
                : "/images/gamemode_percent.png"
            }
            alt="Numbersequences"
          />
        </div>
      ),
    },
    {
      title: "Error Reward",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/error_reward.png" alt="erro reward" />
        </div>
      ),
    },
    // {
    //   title: "Error Reward Lost",
    //   content: (
    //     <div className="flex flex-col gap-8 text-justify">
    //       <img src="/images/error_reward_lost.png" alt="erro reward lost" />
    //     </div>
    //   ),
    // },
    {
      title: "Example Difficulty",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/exampledifficulty.png" alt="Exampledifficulty" />
        </div>
      ),
    },
    {
      title: "When to Restart",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/when_restart.png" alt="When to Restart" />
        </div>
      ),
    },
    {
      title: "Ghost When to Restart",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/ghost_when_restart.png" alt="When to Restart" />
        </div>
      ),
    },
    {
      title: "Error",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img
            src={
              GAMEMODE === "restart"
                ? "/images/gamemode_restart.png"
                : "/images/error_percent.png"
            }
            alt="Error"
          />
        </div>
      ),
    },
    {
      title: "Your Goal",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/yourgoal.png" alt="Yourgoal" />
        </div>
      ),
    },
    {
      title: "Less Error",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/lesserror.png" alt="Less Error" />
        </div>
      ),
    },
    {
      title: "Start",
      content: (
        <div className="flex flex-col gap-8 text-justify">
          <img src="/images/start.png" alt="Start" />
        </div>
      ),
    },
  ];

  return (
    <div className="py-16 flex flex-col items-center justify-center gap-4 h-full w-full bg-[url('/images/background.svg')] bg-cover bg-center">
      <div className="flex flex-col w-full max-w-4xl overflow-y-scroll gap-4 p-12 border-2 bg-white border-zinc-400 rounded-lg shadow-lg">
        <div className="mb-6">{steps[currentStep - 1].content}</div>
      </div>
      <div className="flex w-full max-w-4xl justify-between">
        <Button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className={`${firaCode.className} text-lg`}
        >
          Previous
        </Button>
        {currentStep === steps.length ? (
          <Button className={`${firaCode.className} text-lg bg-orange-500 p-0`}>
            <Link
              className="w-full h-full flex justify-center items-center px-4"
              href="/training"
            >
              Start Training
            </Link>
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentStep((prev) => Math.min(steps.length, prev + 1))
            }
            disabled={currentStep === steps.length}
            className={`${firaCode.className} text-lg`}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
