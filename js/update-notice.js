(() => {
  const CURRENT_VERSION = "0.98.0";
  const STORAGE_KEY = "infinityWorksLastSeenUpdate";
  const ANNOUNCEMENT = {
    title: "合金炉のまとめ発注時間短縮を追加",
    items: [
      "エネルギー圧縮・交換所に「生産出力強化」「超効率化」の表示と購入操作を復旧しました。",
      "工場一覧・購入操作・セーブデータがページ読み込み直後から表示されるよう初期化処理を修正しました。",
      "既存の工場・特殊合金強化レベル・素材・研究などの進行状況は維持されます。CEは鉱石交換に使用します。"
    ]
  };

  try {
    if (localStorage.getItem(STORAGE_KEY) === CURRENT_VERSION) return;
  } catch (_) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .iw-update-overlay{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:rgba(2,6,18,.78);backdrop-filter:blur(8px)}
    .iw-update-dialog{width:min(100%,480px);max-height:min(82vh,640px);overflow:auto;padding:26px;border:1px solid rgba(77,220,255,.45);border-radius:20px;background:linear-gradient(145deg,#111e35,#080d1b 72%);color:#edf7ff;box-shadow:0 24px 90px rgba(0,0,0,.55),0 0 35px rgba(52,190,255,.12)}
    .iw-update-kicker{margin:0 0 8px;color:#67e5ff;font:700 11px/1.4 system-ui,sans-serif;letter-spacing:.18em}
    .iw-update-dialog h2{margin:0 0 8px;font:800 25px/1.3 system-ui,sans-serif;color:#fff}
    .iw-update-version{display:inline-block;margin:0 0 18px;padding:5px 10px;border-radius:999px;background:rgba(72,206,255,.13);color:#7ce9ff;font:700 13px system-ui,sans-serif}
    .iw-update-dialog ul{margin:0 0 22px;padding-left:20px;color:#c7d5e8;font:14px/1.8 system-ui,sans-serif}
    .iw-update-dialog li+li{margin-top:8px}
    .iw-update-confirm{width:100%;min-height:46px;border:0;border-radius:12px;background:linear-gradient(90deg,#13b8d9,#3879f6);color:#fff;font:700 15px system-ui,sans-serif;cursor:pointer}
    .iw-update-confirm:focus-visible{outline:3px solid #fff;outline-offset:3px}
    @media(max-width:480px){.iw-update-dialog{padding:22px}.iw-update-dialog h2{font-size:22px}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "iw-update-overlay";
  overlay.innerHTML = `
    <section class="iw-update-dialog" role="dialog" aria-modal="true" aria-labelledby="iw-update-title">
      <p class="iw-update-kicker">GAME UPDATE</p>
      <h2 id="iw-update-title"></h2>
      <p class="iw-update-version"></p>
      <ul></ul>
      <button class="iw-update-confirm" type="button">確認した</button>
    </section>`;
  overlay.querySelector("h2").textContent = ANNOUNCEMENT.title;
  overlay.querySelector(".iw-update-version").textContent = "INFINITY WORKS II v" + CURRENT_VERSION;
  const list = overlay.querySelector("ul");
  ANNOUNCEMENT.items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, CURRENT_VERSION); } catch (_) {}
    overlay.remove();
  };
  overlay.querySelector("button").addEventListener("click", close);
  document.body.appendChild(overlay);
  overlay.querySelector("button").focus();
})();