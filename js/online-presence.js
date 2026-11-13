(() => {
  const API_BASE = "https://infinity-works-online.onrender.com";
  const countElement = document.getElementById("online-count");
  if (!countElement) return;

  const STORAGE_KEY = "iw2-online-client-id";
  function getClientId() {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = "iw2-" + crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, id);
      }
      return id;
    } catch {
      return "iw2-" + crypto.randomUUID();
    }
  }

  const clientId = getClientId();
  let requestInProgress = false;

  async function refreshPresence() {
    if (requestInProgress) return;
    requestInProgress = true;
    try {
      const heartbeat = await fetch(API_BASE + "/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: clientId }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
      if (!heartbeat.ok) throw new Error("Presence heartbeat failed");

      const response = await fetch(API_BASE + "/presence/count", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error("Presence count failed");
      const data = await response.json();
      if (!Number.isInteger(data.count) || data.count < 0) throw new Error("Invalid count");
      countElement.textContent = data.count.toLocaleString("ja-JP");
      countElement.closest(".online-counter")?.setAttribute("aria-label", `現在オンライン中 ${data.count} 人`);
    } catch {
      countElement.textContent = "--";
      countElement.closest(".online-counter")?.setAttribute("aria-label", "オンライン人数を取得できません");
    } finally {
      requestInProgress = false;
    }
  }

  refreshPresence();
  window.setInterval(refreshPresence, 30_000);
})();
