import imageUrlBuilder from "@sanity/image-url";
import { client } from "../../lib/sanity";
import { useEffect, useState } from "react";
import "./TeamsNotification.css";

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
  xPosition?: number; // Position on the x-axis (default: 40)
  yPosition?: number; // Position on the y-axis (default: bottom)
  animate?: boolean; // Whether to animate the notification (default: false)
  displayDuration?: number; // How long to display before auto-hide in ms (default: 0 = never hide)
  onDismiss?: () => void; // Callback when notification is dismissed
  onClick?: () => void; // Callback when notification is clicked
}

const TEAMS_COLOR = "#444791";
const SEND_COLOR = "#383966";

export const MAX_NOTIFICATION_HEIGHT = 210;
export const MAX_NOTIFICATION_WIDTH = 450;

const builder = imageUrlBuilder(client);

// Helper to convert Sanity image ref to URL
function buildImageUrl(ref: string): string {
  if (!ref) return "";
  try {
    return builder.image(ref).width(400).auto("format").url();
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
    xPosition = 40,
    yPosition = window.innerHeight - 300,
    displayDuration = 0,
    onDismiss,
    onClick,
  } = props;

  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const handleClick = () => {
    if (onClick) {
      // Trigger disintegration animation
      setIsClosing(true);
      // Remove from DOM after animation completes
      setTimeout(() => {
        setShouldRender(false);
        onClick();
      }, 600); // Match animation duration
    }
  };

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
      draggable={false}
      style={{
        backgroundColor: TEAMS_COLOR,
        position: "fixed",
        left: xPosition,
        top: yPosition,
        color: "white",
        maxWidth: MAX_NOTIFICATION_WIDTH,
        minWidth: MAX_NOTIFICATION_WIDTH,
        maxHeight: MAX_NOTIFICATION_HEIGHT,
        cursor: onClick ? "pointer" : "default",
        zIndex: 1,
      }}
      className={`p-4 rounded-lg gap-4 flex flex-col teams-notification ${isClosing ? "disintegrate" : ""}`}
    >
      <div className="flex flex-row justify-between">
        <div className="flex flex-row justify-between gap-3">
          {logoUrl && (
            <img
              draggable={false}
              src={logoUrl}
              alt="Logo"
              className="h-6 w-6 object-contain select-none"
            />
          )}
          <p className="select-none">Microsoft Teams</p>
        </div>
        <div className="flex flex-row justify-between gap-4">
          {contextMenuIconUrl && (
            <img
              draggable={false}
              src={contextMenuIconUrl}
              alt="Context Menu"
              className="h-6 w-6 object-contain select-none"
            />
          )}
          {emojiIconUrl && (
            <img
              draggable={false}
              src={emojiIconUrl}
              alt="Emoji"
              className="h-6 w-6 object-contain select-none"
            />
          )}
          {closeMessageIconUrl && (
            <button
              onClick={handleClick}
              className="p-2 -m-2 hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <img
                draggable={false}
                src={closeMessageIconUrl}
                alt="Close Message"
                className="h-6 w-6 object-contain select-none"
              />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-row gap-3">
        {profilePictureUrl && (
          <img
            draggable={false}
            src={profilePictureUrl}
            alt="Profile Picture"
            className="w-16 h-16 rounded-full object-cover select-none"
          />
        )}
        <div className="flex flex-col gap-1">
          <p className="font-semibold select-none">{sender}</p>
          <p className="select-none">{message}</p>
        </div>
      </div>
      <div
        style={{ backgroundColor: SEND_COLOR }}
        className="flex flex-row justify-between gap-2 rounded-md p-2 px-4"
      >
        <p className="select-none">Send et raskt svar</p>
        {sendMessageIconUrl && (
          <img
            draggable={false}
            src={sendMessageIconUrl}
            alt="Send Message"
            className="h-6 w-6 object-contain select-none"
          />
        )}
      </div>
    </div>
  );
}
