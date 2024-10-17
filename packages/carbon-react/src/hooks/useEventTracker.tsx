import { createContext } from "react";
import { useState } from "react";
import { useContext } from "react";
import { EventTracker } from "../core/EventTracker";

const InnerEventTrackerContext = createContext<EventTracker | null>(null);

export const EventTrackerProvider = ({ children }) => {
  const [eventTracker] = useState(new EventTracker());
  return (
    <InnerEventTrackerContext.Provider value={eventTracker}>
      {children}
    </InnerEventTrackerContext.Provider>
  );
};

export const useEventTracker = () => {
  return useContext(InnerEventTrackerContext);
};
