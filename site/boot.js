// Keep failures visible even when the module graph never starts.
function showRuntimeFailure() {
  const show = () => {
    const banner = document.getElementById("runtime-error");
    if (banner) banner.hidden = false;
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", show, { once: true });
  else show();
}
window.addEventListener(
  "error",
  (event) => {
    // Expected map failures have their own recovery UI.
    if (
      event instanceof ErrorEvent ||
      event.target instanceof HTMLScriptElement
    )
      showRuntimeFailure();
  },
  true,
);
window.addEventListener("unhandledrejection", showRuntimeFailure);
