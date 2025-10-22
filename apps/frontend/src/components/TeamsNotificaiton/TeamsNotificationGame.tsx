import { useEffect, useMemo, useState } from "react";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import { TeamsNotification } from "./TeamsNotification";

interface TeamsNotificationGameData {
  title?: string;
  description?: string;
  firstMessage?: string;
  teamsMessages?: Array<{ message: string }>;
  lastMessage?: string;
  logo?: { asset?: { _ref?: string } };
  contextMenuIcon?: { asset?: { _ref?: string } };
  addEmojiIcon?: { asset?: { _ref?: string } };
  closeMessageIcon?: { asset?: { _ref?: string } };
  sendMessageIcon?: { asset?: { _ref?: string } };
}

const builder = imageUrlBuilder(client);

function urlFromRef(
  imageLike?: { asset?: { _ref?: string } } | null
): string | undefined {
  if (!imageLike?.asset?._ref) return undefined;
  try {
    return builder
      .image({ _type: "image", asset: { _ref: imageLike.asset._ref } as any })
      .auto("format")
      .fit("max")
      .url();
  } catch {
    return undefined;
  }
}

type ProfileEntry = { name: string; ref: string };

export function TeamsNotificationGame() {
  const [data, setData] = useState<TeamsNotificationGameData | null>(null);
  const [dayTitle, setDayTitle] = useState<string>("");
  const [profileCatalog, setProfileCatalog] = useState<ProfileEntry[]>([]);
  const [assignedProfiles, setAssignedProfiles] = useState<ProfileEntry[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("currentGameData");
    const dayInfoRaw = sessionStorage.getItem("currentDayInfo");
    try {
      if (dayInfoRaw) {
        const parsed = JSON.parse(dayInfoRaw);
        setDayTitle(parsed?.title || "");
      }
    } catch {
      setDayTitle("");
    }
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.teamsNotificationGameData) {
        setData(parsed.teamsNotificationGameData as TeamsNotificationGameData);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Load global profile pictures (independent library)
  useEffect(() => {
    const fetchProfilePictures = async () => {
      try {
        const docs: ProfileEntry[] = await client.fetch(
          `*[_type=="profilePicture"]{name,"ref":image.asset._ref}`
        );
        console.log("Fetched profile pictures:", docs);
        const filtered = docs.filter(
          (d) => !!d?.ref && !!(d?.name || "").trim()
        );
        console.log("Filtered profile pictures:", filtered);
        setProfileCatalog(filtered as ProfileEntry[]);
      } catch (error) {
        console.error("Error fetching profile pictures:", error);
        setProfileCatalog([]);
      }
    };
    fetchProfilePictures();
  }, []);

  // Create a stable random assignment of profiles for the visible messages
  useEffect(() => {
    if (!data) {
      console.log("No data yet, waiting...");
      return;
    }
    const total =
      (data.firstMessage ? 1 : 0) + (data.teamsMessages?.length || 0);
    console.log("Total messages needed:", total);
    if (total === 0) return;

    // If no catalog, wait for it to load
    if (!profileCatalog || profileCatalog.length === 0) {
      console.log("No profile catalog yet, waiting...");
      return;
    }

    // If we already have profiles assigned and catalog hasn't changed, keep them stable
    if (assignedProfiles.length === total) {
      console.log("Already have correct number of profiles assigned");
      return;
    }

    // Generate random assignments
    const randoms: ProfileEntry[] = [];
    for (let i = 0; i < total; i++) {
      const pick =
        profileCatalog[Math.floor(Math.random() * profileCatalog.length)];
      randoms.push(pick);
    }
    console.log("Assigned profiles:", randoms);
    setAssignedProfiles(randoms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, profileCatalog.length]);

  const logoUrl = useMemo(() => urlFromRef(data?.logo ?? null), [data]);
  const contextUrl = useMemo(
    () => urlFromRef(data?.contextMenuIcon ?? null),
    [data]
  );
  const emojiUrl = useMemo(
    () => urlFromRef(data?.addEmojiIcon ?? null),
    [data]
  );
  const closeUrl = useMemo(
    () => urlFromRef(data?.closeMessageIcon ?? null),
    [data]
  );
  const sendUrl = useMemo(
    () => urlFromRef(data?.sendMessageIcon ?? null),
    [data]
  );

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Teams Notification Game</h1>
        <p className="text-sm text-gray-500">
          No game data found. Open a day with Teams Notification Game.
        </p>
      </div>
    );
  }

  const firstProfile = assignedProfiles[0] || { name: "Unknown", ref: "" };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Teams Logo"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <span className="text-2xl" role="img" aria-label="logo">
            💬
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold">
            {data.title || dayTitle || "Teams Notification"}
          </h1>
          {data.description ? (
            <p className="text-sm text-gray-600">{data.description}</p>
          ) : null}
        </div>
      </div>

      {/* Toolbar icons */}
      <div className="flex items-center gap-3 mb-4">
        {contextUrl && (
          <img
            src={contextUrl}
            alt="Context menu"
            className="h-5 w-5 object-contain"
          />
        )}
        {emojiUrl && (
          <img
            src={emojiUrl}
            alt="Add emoji"
            className="h-5 w-5 object-contain"
          />
        )}
        {closeUrl && (
          <img
            src={closeUrl}
            alt="Close message"
            className="h-5 w-5 object-contain"
          />
        )}
        {sendUrl && (
          <img
            src={sendUrl}
            alt="Send message"
            className="h-5 w-5 object-contain"
          />
        )}
      </div>

      {/* First message */}
      {data.firstMessage ? (
        <TeamsNotification
          sender={firstProfile.name}
          message={data.firstMessage}
          logo={logoUrl || ""}
          profilePicture={firstProfile.ref || ""}
          emojiIcon={emojiUrl || ""}
          closeMessageIcon={closeUrl || ""}
          sendMessageIcon={sendUrl || ""}
          contextMenuIcon={contextUrl || ""}
        />
      ) : null}

      {/* Messages */}
      {Array.isArray(data.teamsMessages) && data.teamsMessages.length > 0 ? (
        <div className="mt-3 space-y-3">
          {data.teamsMessages.map((m, idx) => {
            const ap = assignedProfiles[idx + (data.firstMessage ? 1 : 0)] || {
              name: "Unknown",
              ref: "",
            };
            return (
              <TeamsNotification
                key={idx}
                sender={ap.name}
                message={m?.message || ""}
                logo={logoUrl || ""}
                profilePicture={ap.ref || ""}
                emojiIcon={emojiUrl || ""}
                closeMessageIcon={closeUrl || ""}
                sendMessageIcon={sendUrl || ""}
                contextMenuIcon={contextUrl || ""}
              />
            );
          })}
        </div>
      ) : null}

      {/* Last message */}
      {data.lastMessage ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm mt-3">
          <p className="text-gray-900">{data.lastMessage}</p>
        </div>
      ) : null}
    </div>
  );
}
