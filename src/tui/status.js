// Shared mapping of pipeline status -> display color / label, used by the
// progress view. Module-level so they're created once, not per render.

export const STATUS_COLORS = {
  launch: "cyan",
  load: "cyan",
  scroll: "yellow",
  clean: "magenta",
  pdf: "blue",
  done: "green",
  error: "red",
};

export const STATUS_LABELS = {
  launch: " Launching",
  load: " Loading",
  scroll: " Scrolling",
  clean: " Cleaning",
  pdf: " Exporting",
  done: " Complete",
  error: " Error",
};
