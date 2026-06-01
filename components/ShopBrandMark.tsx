import { SerializedShopSettings } from "@/lib/shopSettings-shared";

interface Props {
  settings: Pick<SerializedShopSettings, "businessName" | "tagline" | "logoDataUrl">;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

export default function ShopBrandMark({
  settings,
  size = "md",
  showTagline = true,
  className = "",
}: Props) {
  const sizes = {
    sm: {
      logo: "h-8 w-8 rounded-lg",
      img: "h-8 w-8 rounded-lg object-contain",
      name: "text-base",
      tagline: "text-[10px]",
    },
    md: {
      logo: "h-10 w-10 rounded-xl",
      img: "h-10 w-10 rounded-xl object-contain",
      name: "text-xl",
      tagline: "text-xs",
    },
    lg: {
      logo: "h-12 w-12 rounded-2xl",
      img: "h-12 w-12 rounded-2xl object-contain",
      name: "text-2xl",
      tagline: "text-sm",
    },
  } as const;

  const config = sizes[size];
  const name = settings.businessName.trim() || "Mendy";

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      {settings.logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoDataUrl}
          alt={`${name} logo`}
          className={`${config.img} shrink-0 bg-white/80`}
        />
      ) : (
        <div
          className={`${config.logo} flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-500 to-amber-400`}
        >
          <span className="text-sm font-black text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className="min-w-0">
        <p className={`${config.name} truncate font-extrabold tracking-tight`}>
          <span className="text-violet-500 dark:text-violet-400">{name}</span>
          {!settings.logoDataUrl ? <span className="text-amber-500">.</span> : null}
        </p>
        {showTagline && settings.tagline ? (
          <p className={`${config.tagline} truncate text-muted`}>{settings.tagline}</p>
        ) : null}
      </div>
    </div>
  );
}
