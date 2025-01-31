import { Button } from "@/components/ui/button";
import { Fira_Code } from "next/font/google";
import Link from "next/link";

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function End() {
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
              href="#"
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
            <p className="select-text text-red-500 font-bold">C1EY8634</p>
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
