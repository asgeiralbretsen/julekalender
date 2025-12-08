import { useRef, useEffect, useState } from "react";
import { createScope, createDraggable } from "animejs";
import { ChristmasBackground } from "./ChristmasBackground";

const christmasEmojis = ["🎄", "🎅", "🎁", "❄️"];

const containerConfig = [
  {
    id: "containerA",
    width: 200,
    height: 200,
    border: "10px dashed blue",
  },
  {
    id: "containerB",
    width: 200,
    height: 200,
    border: "2px dashed blue",
  },
  {
    id: "containerC",
    width: 200,
    height: 200,
    border: "2px dashed blue",
  },
];

export default function SortGame() {
  const root = useRef(null);
  const scope = useRef(null);

  const containerRefs = useRef(
    containerConfig.map(() => useRef<HTMLDivElement | null>(null))
  ).current;
  const [highlightedTargets, setHighlightedTargets] =
    useState<Array<{ id: string; highlighted: boolean }>>();

  const containerIDs = ["containerA", "containerB", "containerC"];

  const initializeHighlightedTargets = () => {
    // Placeholder logic
    setHighlightedTargets(
      containerIDs.map((id) => ({ id: id, highlighted: false }))
    );
  };

  useEffect(() => {
    initializeHighlightedTargets();
  }, []);

  const checkPosition = (current: DOMRect, targets: HTMLElement[]) => {
    return (
      targets.find((target) => {
        const rect = target.getBoundingClientRect();
        return (
          current.left < rect.right &&
          current.right > rect.left &&
          current.top < rect.bottom &&
          current.bottom > rect.top
        );
      }) || null
    );
  };

  const onInPosition = (hit: HTMLElement | null) => {
    setHighlightedTargets((prev) =>
      prev.map((item) => ({
        ...item,
        highlighted: hit?.id === item.id,
      }))
    );
  };

  useEffect(() => {
    if (!root.current) return;

    scope.current = createScope(root.current).add(() => {
      const elems = root.current.querySelectorAll(".draggable-emoji");

      elems.forEach((el) => {
        createDraggable(el, {
          container: ".container",
          snap: 50,
          onDrag: () => {
            const rect = el.getBoundingClientRect();
            const hit = checkPosition(
              rect,
              containerRefs.map((c) => c.current!)
            );
            onInPosition(hit);
          },
          onRelease: () => {
            initializeHighlightedTargets();
          },
          onSettle: () => {
            checkPosition(
              el.getBoundingClientRect(),
              containerRefs.map((c) => c.current!)
            );
          },
        });
      });
    });

    return () => scope.current?.revert();
  }, []);

  return (
    <ChristmasBackground>
      <div className="flex justify-center">
        <div className="relative w-[80%] h-[500px]">
          <div
            ref={root}
            className="container"
            style={{
              width: "100%",
              height: "100%",
              //   backgroundColor: "white",
              display: "flex",
              gap: "50px",
              justifyContent: "space-between",
            }}
          >
            {containerConfig.map((cfg, i) => (
              <div
                key={cfg.id}
                id={cfg.id}
                ref={containerRefs[i]}
                style={{
                  width: cfg.width,
                  height: cfg.height,
                  border: highlightedTargets?.find((t) => t.id === cfg.id)
                    ?.highlighted
                    ? "10px dashed green"
                    : cfg.border,
                }}
              >
                {/* {cfg.id} */}
              </div>
            ))}

            {christmasEmojis.map((emoji, i) => (
              <div
                key={i}
                className="draggable-emoji"
                style={{
                  width: 50,
                  height: 50,
                  fontSize: 30,
                  //   background: "red",
                  position: "absolute",
                  left: 100,
                  top: 200 + i * 50,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "grab",
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChristmasBackground>
  );
}
