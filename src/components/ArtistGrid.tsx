import { ArtistWithGender } from "@/lib/types";
import ArtistCard from "./ArtistCard";

export default function ArtistGrid({
  artists,
}: {
  artists: ArtistWithGender[];
}) {
  const female = artists.filter((a) => a.gender === "female");
  const male = artists.filter((a) => a.gender === "male");
  const unknown = artists.filter(
    (a) => a.gender === "unknown" || a.gender === "non-binary"
  );

  return (
    <div
      className="space-y-8 animate-slide-up w-full"
      style={{ animationDelay: "0.6s", opacity: 0 }}
    >
      {female.length > 0 && (
        <Section
          title={`${female.length} women`}
          artists={female}
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
          title={`${unknown.length} unknown / bands`}
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
