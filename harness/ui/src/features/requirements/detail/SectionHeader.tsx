export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}
