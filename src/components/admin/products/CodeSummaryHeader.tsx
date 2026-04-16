interface CodeSummaryHeaderProps {
  totalCodes: number;
  availableCodes: number;
}

export function CodeSummaryHeader({ totalCodes, availableCodes }: CodeSummaryHeaderProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>
        <span className="font-semibold text-foreground">{totalCodes}</span> total
      </span>
      <span>·</span>
      <span>
        <span className="font-semibold text-success">{availableCodes}</span> available
      </span>
      <span>·</span>
      <span>
        <span className="font-semibold text-destructive">{totalCodes - availableCodes}</span> used
      </span>
    </div>
  );
}
