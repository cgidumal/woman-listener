export default function TierRoast({ roast }: { roast: string }) {
  return (
    <div className="animate-slide-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
      <p className="text-xl sm:text-2xl font-medium text-center leading-relaxed max-w-md mx-auto">
        &ldquo;{roast}&rdquo;
      </p>
    </div>
  );
}
