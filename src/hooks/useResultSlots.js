import { useState } from "react";
export { createModeResultSnapshot } from "../results/createModeResultSnapshot.js";

export function useResultSlots(currentModeInputKey) {
  // beginnerResultSlot owns the first, simple Beginner-mode result for the current input.
  // It survives mode switches and User-mode re-fetches, and is only active when inputKey matches.
  const [beginnerResultSlot, setBeginnerResultSlot] = useState(null);
  // userResultSlot owns the deeper User-mode result for the current input.
  // It may replace prior User-mode detail, but it must not overwrite beginnerResultSlot.
  const [userResultSlot, setUserResultSlot] = useState(null);

  const activeBeginnerResultSlot =
    beginnerResultSlot?.inputKey === currentModeInputKey ? beginnerResultSlot : null;
  const activeUserResultSlot =
    userResultSlot?.inputKey === currentModeInputKey ? userResultSlot : null;

  function clearBeginnerResultSlot() {
    setBeginnerResultSlot(null);
  }

  function clearUserResultSlot() {
    setUserResultSlot(null);
  }

  function clearResultSlots() {
    setBeginnerResultSlot(null);
    setUserResultSlot(null);
  }

  return {
    beginnerResultSlot,
    userResultSlot,
    setBeginnerResultSlot,
    setUserResultSlot,
    clearBeginnerResultSlot,
    clearUserResultSlot,
    clearResultSlots,
    activeBeginnerResultSlot,
    activeUserResultSlot,
  };
}
