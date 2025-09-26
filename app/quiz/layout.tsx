export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col justify-center gap-4 py-6">
      <div className="inline-block justify-center">
        {children}
      </div>
    </section>
  );
}
