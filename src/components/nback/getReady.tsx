interface GetReadyProps {
  N: number;
}

export const GetReady = ({ N }: GetReadyProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-bold text-black">
        Get Ready for the <b className="text-orange-500">{N}-back</b> task!
      </div>
    </div>
  );
};
