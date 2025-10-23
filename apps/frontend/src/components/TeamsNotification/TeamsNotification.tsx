import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import { useEffect, useState } from "react";

interface TeamsNotificationProps {
  sender: string;
  message: string;
  logo: string;
  profilePicture: string;
  emojiIcon: string;
  closeMessageIcon: string;
  sendMessageIcon: string;
  contextMenuIcon: string;
  duration?: number; // Animation duration in ms (default: 500)
  side?: "left" | "right"; // Side to slide in from (default: "right")
  delay?: number; // Delay before animation starts in ms (default: 0)
  xPosition?: number; // Position on the x-axis (default: 40)
  yPosition?: number; // Position on the y-axis (default: bottom)
  animate?: boolean; // Whether to animate the notification (default: false)
  displayDuration?: number; // How long to display before auto-hide in ms (default: 0 = never hide)
  onDismiss?: () => void; // Callback when notification is dismissed
  onClick?: () => void; // Callback when notification is clicked
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
    duration = 500,
    side = "right",
    delay = 0,
    xPosition = 40,
    yPosition = window.innerHeight - 300,
    animate = false,
    displayDuration = 0,
    onDismiss,
    onClick,
  } = props;

  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  const handleClick = () => {
    if (onClick) {
      // Slide out
      setIsVisible(false);
      // Remove from DOM after animation completes
      setShouldRender(false);
      onClick();
    }
  };

  // Slide in animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Auto-dismiss after displayDuration
  useEffect(() => {
    if (displayDuration > 0 && isVisible) {
      const dismissTimer = setTimeout(() => {
        // Slide out
        setIsVisible(false);
        // Remove from DOM after animation completes
        setTimeout(() => {
          setShouldRender(false);
          onDismiss?.();
        }, duration);
      }, displayDuration);
      return () => clearTimeout(dismissTimer);
    }
  }, [displayDuration, isVisible, duration, onDismiss]);

  // Don't render if dismissed
  if (!shouldRender) {
    return null;
  }

  // Convert all refs to URLs
  const logoUrl = logo || "";
  const profilePictureUrl = profilePicture ? buildImageUrl(profilePicture) : "";
  const emojiIconUrl = emojiIcon || "";
  const closeMessageIconUrl = closeMessageIcon || "";
  const sendMessageIconUrl = sendMessageIcon || "";
  const contextMenuIconUrl = contextMenuIcon || "";

  return (
    <div
      style={{
        backgroundColor: TeamsColor,
        position: "fixed",
        left: xPosition,
        top: yPosition,
        color: "white",
        maxWidth: "500px",
        minWidth: "500px",
        cursor: onClick ? "pointer" : "default",
        zIndex: 1,
      }}
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
              onClick={handleClick}
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
