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
  let buffElement = document.getElementById("online-buffs");
  if (!buffElement) { buffElement = document.createElement("span"); buffElement.id = "online-buffs"; buffElement.className = "online-buffs"; buffElement.setAttribute("aria-label", "オンライン人数による生産・製造バフ"); countElement.parentElement.appendChild(buffElement); }
  const style = document.createElement("style"); style.textContent = ".online-counter{flex-wrap:wrap;gap:5px 7px;row-gap:2px}.online-buffs{flex-basis:100%;text-align:right;font-size:10px;line-height:1.35;color:#9fc8ff;white-space:normal}"; document.head.appendChild(style);
  window.__iw2OnlineCount = 0;
  function renderBuffs(count) { const players=Math.max(0,Math.floor(count)); buffElement.textContent=`自動生産 +${Math.min(20,players)}% ／ 精錬 -${Math.min(10,players*.5)}% ／ 合金 -${Math.min(20,players)}%`; window.__iw2OnlineCount=players; window.dispatchEvent(new CustomEvent("iw2-online-presence",{detail:{count:players}})); }

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
      renderBuffs(data.count);
      countElement.closest(".online-counter")?.setAttribute("aria-label", `現在オンライン中 ${data.count} 人`);
    } catch {
      countElement.textContent = "--";
      renderBuffs(0);
      countElement.closest(".online-counter")?.setAttribute("aria-label", "オンライン人数を取得できません");
    } finally {
      requestInProgress = false;
    }
  }

  refreshPresence();
  window.setInterval(refreshPresence, 30_000);
})();
