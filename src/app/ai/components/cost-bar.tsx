interface Props {
  cost: number;
}

export default function CostBar({ cost }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 py-1 bg-bg shrink-0">
      <span className="text-[9px] text-text-tertiary">
        本次咨询消耗 <strong>{cost}</strong> 🎮
        {cost > 150 && <span className="text-brand-coral ml-1">(已确认)</span>}
      </span>
    </div>
  );
}
