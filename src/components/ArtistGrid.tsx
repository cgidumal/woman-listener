import { ArtistWithGender } from "@/lib/types";
import ArtistCard from "./ArtistCard";

export default function ArtistGrid({
  artists,
}: {
  artists: ArtistWithGender[];
}) {
  // Non-men = female + non-binary (the good stuff)
  const nonMen = artists.filter(
    (a) => a.gender === "female" || a.gender === "non-binary"
  );
  const male = artists.filter((a) => a.gender === "male");
  const unknown = artists.filter((a) => a.gender === "unknown");

  return (
    <div
      className="space-y-8 animate-slide-up w-full"
      style={{ animationDelay: "0.6s", opacity: 0 }}
    >
      {nonMen.length > 0 && (
        <Section
          title={`${nonMen.length} non-men`}
          artists={nonMen}
          accentColor="text-female"
        />
      )}
      {male.length > 0 && (
        <Section
          title={`${male.length} men`}
          artists={male}
          accentColor="text-male"
        />
      )}
      {unknown.length > 0 && (
        <Section
          title={`${unknown.length} unknown`}
          artists={unknown}
          accentColor="text-unknown"
        />
      )}
    </div>
  );
}

function Section({
  title,
  artists,
  accentColor,
}: {
  title: string;
  artists: ArtistWithGender[];
  accentColor: string;
}) {
  return (
    <div>
      <h3
        className={`text-sm font-semibold uppercase tracking-wider mb-3 ${accentColor}`}
      >
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {artists.map((a) => (
          <ArtistCard key={a.id} artist={a} />
        ))}
      </div>
    </div>
  );
}
