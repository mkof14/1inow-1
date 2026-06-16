export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-4">
          <div className="size-2 rounded-full bg-accent animate-pulse" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
        <p className="mt-6 text-xs uppercase tracking-widest text-muted-foreground">Phase 2 module</p>
      </div>
    </div>
  );
}