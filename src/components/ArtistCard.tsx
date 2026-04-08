import { ArtistWithGender } from "@/lib/types";

const GENDER_BADGE: Record<string, { label: string; className: string }> = {
  female: { label: "F", className: "bg-female text-white" },
  male: { label: "M", className: "bg-male text-white" },
  "non-binary": { label: "NB", className: "bg-warning text-black" },
  unknown: { label: "?", className: "bg-unknown text-white" },
};

export default function ArtistCard({ artist }: { artist: ArtistWithGender }) {
  const badge = GENDER_BADGE[artist.gender];
  const imageUrl = artist.images?.[0]?.url;

  return (
    <div className="flex items-center gap-3 bg-surface rounded-lg p-3">
      <div className="relative shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={artist.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-text-muted text-xs">
            {artist.name.charAt(0)}
          </div>
        )}
        <span
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium truncate block">{artist.name}</span>
        {artist.rank && (
          <span className="text-[10px] text-text-muted">#{artist.rank} most played</span>
        )}
      </div>
    </div>
  );
}
