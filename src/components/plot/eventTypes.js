import {
  cranachElderEvents,
  cranachYoungerEvents,
  lutherEvents,
  historyEvents
} from "../../store/atoms";

export const EVENT_GAP = 0.05;

export const EVENT_TYPES = [
  { key: "elder", atom: cranachElderEvents, color: "#255982", label: "Cranach Elder" },
  { key: "younger", atom: cranachYoungerEvents, color: "#e67e22", label: "Cranach Younger" },
  { key: "luther", atom: lutherEvents, color: "#27ae60", label: "Luther" },
  { key: "history", atom: historyEvents, color: "#c0392b", label: "History" }
];

// Assign y positions with spacing from bottom up
EVENT_TYPES.forEach((t, i) => {
  t.y = i * EVENT_GAP;
});