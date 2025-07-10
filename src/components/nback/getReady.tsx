interface GetReadyProps {
  N: number;
  variant: "completed" | "default" | "restart";
}

export const GetReady = ({ N, variant = "default" }: GetReadyProps) => {
  return (
    <div className="flex flex-col items-center">
      {variant === "completed" && (
        <div className="text-2xl font-bold text-black">
          <b className="text-orange-500">Trial completed!</b>
        </div>
      )}
      {variant === "restart" && (
        <div className="text-2xl font-bold text-black">
          <b className="text-orange-500">Restarting from checkpoint</b>
        </div>
      )}
      {variant !== "restart" && (
        <div className="text-4xl font-bold text-black">
          Get Ready for the <b className="text-orange-500">{N}-back</b> task!
        </div>
      )}
    </div>
  );
};
