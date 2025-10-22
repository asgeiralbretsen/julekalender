import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";

interface TeamsNotificationProps {
  sender: string;
  message: string;
  logo: string;
  profilePicture: string;
  emojiIcon: string;
  closeMessageIcon: string;
  sendMessageIcon: string;
  contextMenuIcon: string;
}

const TeamsColor = "#444791";
const sendColor = "#383966";

const builder = imageUrlBuilder(client);

// Helper to convert Sanity image ref to URL
function buildImageUrl(ref: string): string {
  if (!ref) return "";
  try {
    return builder
      .image({ _type: "image", asset: { _ref: ref } as any })
      .width(400)
      .auto("format")
      .url();
  } catch {
    return "";
  }
}

export function TeamsNotification(props: TeamsNotificationProps) {
  const {
    sender,
    message,
    logo,
    profilePicture,
    emojiIcon,
    closeMessageIcon,
    sendMessageIcon,
    contextMenuIcon,
  } = props;

  // Convert all refs to URLs
  const logoUrl = logo || "";
  const profilePictureUrl = profilePicture ? buildImageUrl(profilePicture) : "";
  const emojiIconUrl = emojiIcon || "";
  const closeMessageIconUrl = closeMessageIcon || "";
  const sendMessageIconUrl = sendMessageIcon || "";
  const contextMenuIconUrl = contextMenuIcon || "";

  return (
    <div
      style={{ backgroundColor: TeamsColor, color: "white", maxWidth: "600px" }}
      className="p-4 rounded-lg gap-4 flex flex-col"
    >
      <div className="flex flex-row justify-between">
        <div className="flex flex-row justify-between gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-6 w-6 object-contain" />
          )}
          <p>Microsoft Teams</p>
        </div>
        <div className="flex flex-row justify-between gap-4">
          {contextMenuIconUrl && (
            <img
              src={contextMenuIconUrl}
              alt="Context Menu"
              className="h-6 w-6 object-contain"
            />
          )}
          {emojiIconUrl && (
            <img
              src={emojiIconUrl}
              alt="Emoji"
              className="h-6 w-6 object-contain"
            />
          )}
          {closeMessageIconUrl && (
            <img
              src={closeMessageIconUrl}
              alt="Close Message"
              className="h-6 w-6 object-contain"
            />
          )}
        </div>
      </div>
      <div className="flex flex-row gap-3">
        {profilePictureUrl && (
          <img
            src={profilePictureUrl}
            alt="Profile Picture"
            className="w-16 h-16 rounded-full object-cover"
          />
        )}
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{sender}</p>
          <p>{message}</p>
        </div>
      </div>
      <div
        style={{ backgroundColor: sendColor }}
        className="flex flex-row justify-between gap-2 p-2 rounded-md p-2 px-4"
      >
        <p>Send et raskt svar</p>
        {sendMessageIconUrl && (
          <img
            src={sendMessageIconUrl}
            alt="Send Message"
            className="h-6 w-6 object-contain"
          />
        )}
      </div>
    </div>
  );
}
