import { useEffect, useState } from "react";
import "./Piece.css";

interface PieceProps {
  text: string;
  selected?: boolean;
  wasCorrect?: boolean;
  onClick?: () => void;
}

export default function Piece({
  text,
  selected,
  wasCorrect,
  onClick,
}: PieceProps) {
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);

  const SHAKE_DURATION = 500;

  const animateClickResult = () => {
    if (wasCorrect === false && !shake) {
      setShake(true);
      setTimeout(() => setShake(false), SHAKE_DURATION);
    }
    console.log(wasCorrect);
    if (wasCorrect && !bounce) {
      setBounce(true);
      setTimeout(() => setBounce(false), SHAKE_DURATION);
    }
  };

  useEffect(() => {
    animateClickResult();
  }, [wasCorrect]);

  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick();
        }
        animateClickResult();
      }}
      className={`piece ${selected ? "selected" : ""} ${shake ? "wrong" : ""} ${bounce ? "correct" : ""}`}
    >
      <p>{text}</p>
    </button>
  );
}
