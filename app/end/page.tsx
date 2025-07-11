"use client";

import { Button } from "@/components/ui/button";
import { auth, db } from "@/config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useEffect } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const LOCALSTORAGE_KEY = "nback-task-state";

export default function End() {
  // Function to calculate payoff based on reward
  const calculatePayoff = (reward: number): number => {
    // Minimum payment: 6 euros, Maximum payment: 10 euros
    // Minimum reward: 20 points, Maximum reward: 100 points
    const minPayment = 6;
    const maxPayment = 10;
    const minReward = 20;
    const maxReward = 100;

    // Clamp reward between min and max
    const clampedReward = Math.max(minReward, Math.min(maxReward, reward));

    // Linear interpolation
    const payoff =
      minPayment +
      ((clampedReward - minReward) * (maxPayment - minPayment)) /
        (maxReward - minReward);

    // Round to 2 decimal places
    return Math.round(payoff * 100) / 100;
  };

  // Function to update payoff in Firestore
  const updatePayoffInFirestore = async (
    reward: number,
    calculatedPayoff: number
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user found for payoff update");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        payoff: calculatedPayoff,
        finalReward: reward,
      });

      console.log(
        `Payoff updated in Firestore: ${calculatedPayoff} euros for ${reward} points`
      );
    } catch (error) {
      console.error("Failed to update payoff in Firestore:", error);
    }
  };

  // Calculate and store payoff in Firestore
  useEffect(() => {
    const calculateAndStorePayoff = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user found");
          return;
        }

        // Get user's reward from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const reward = userData.reward || 0;

          // Calculate payoff
          const calculatedPayoff = calculatePayoff(reward);

          // Update payoff in Firestore
          await updatePayoffInFirestore(reward, calculatedPayoff);
        } else {
          console.error("User document not found");
        }
      } catch (error) {
        console.error("Error calculating and storing payoff:", error);
      }
    };

    calculateAndStorePayoff();

    // Clear the task state from localStorage
    localStorage.removeItem(LOCALSTORAGE_KEY);
    console.log("Cleared nback-task-state from localStorage");
  }, []);

  return (
    <div className="p-16 flex items-start justify-center gap-4 h-full w-full bg-[url('/images/background.svg')] bg-cover bg-center">
      <div className="flex flex-col w-full overflow-y-scroll gap-4 p-12 border-2 bg-white border-zinc-400 rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center gap-4">
          <h2
            className={`text-2xl text-center font-bold text-zinc-700 ${firaCode.className}`}
          >
            LadderBoard
          </h2>
        </div>
      </div>
      <div className="flex flex-col w-full overflow-y-scroll gap-4 p-12 border-2 bg-white border-zinc-400 rounded-lg shadow-lg">
        <h2
          className={`text-2xl text-center font-bold text-zinc-700 ${firaCode.className}`}
        >
          Congratulations
        </h2>
        <div className="flex flex-col items-center justify-center gap-2">
          <p
            className={`${firaCode.className} text-red-orange font-bold text-orange-500`}
          >
            Redirect to prolific
          </p>
          <Button className={`${firaCode.className} text-lg bg-orange-500`}>
            <Link
              className="w-full h-full flex justify-center items-center"
              href="https://app.prolific.com/submissions/complete?cc=C28ILGGC"
            >
              CLICK HERE
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-2">
            {/* <p className={`${pressStart2P.className}`}>Your Prolific code:</p>
              <p className="select-text">{auth.currentUser?.uid}</p> */}
            <p className={`${firaCode.className}`}>Prolific code:</p>
            <p className="select-text text-red-500 font-bold">C28ILGGC</p>
          </div>
          <div>
            <i>Copy the code to your clipboard to request your reward</i>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 ">
          <div
            className={`${firaCode.className} flex items-center justify-center gap-2`}
          >
            <p>Your reward:</p>
            <p className="text-green-500 font-bold">0$</p>
          </div>
          <div>
            <i>You will receive your reward in your Prolific account</i>
          </div>
        </div>
      </div>
    </div>
  );
}
