import { cn } from "@/lib/utils";
import { Fira_Code } from "next/font/google";
import { Alert } from "./ui/alert";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export type TimeAlertProps = {
  open: boolean;
  variant?: "reached" | "warning";
};

const variants = {
  reached: {
    background: "bg-red-500",
    border: "border-red-700",
    title: "Time limit reached",
    message: "You have to be faster to respond",
  },
  warning: {
    background: "bg-orange-500",
    border: "border-orange-700",
    title: "Make your choice quickly",
    message: "You have to drag the cursor",
  },
};

export const TimeAlert = ({ open, variant = "reached" }: TimeAlertProps) => {
  const styles = variants[variant];

  return (
    <div
      className={cn(
        "fixed top-10 flex items-center justify-center z-50 w-96 transition-all duration-300",
        open ? "block" : "hidden"
      )}
    >
      <Alert
        className={cn(
          styles.background,
          `border-2 ${styles.border} text-white shadow-xl`
        )}
      >
        <h1 className={`${firaCode.className} text-2xl font-bold text-center`}>
          {styles.title}
        </h1>
        <p className="text-xl text-center">{styles.message}</p>
      </Alert>
    </div>
  );
};
