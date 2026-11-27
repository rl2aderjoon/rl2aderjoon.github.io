(() => {
  const panel = document.getElementById("activity-panel");
  if (!panel) return;

  const status = panel.querySelector("[data-activity-status]");
  const number = new Intl.NumberFormat("ko-KR");
  const compact = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 });
  const koreanDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  });
  const dateKey = value => {
    const parts = koreanDay.formatToParts(value);
    return ["year", "month", "day"].map(type => parts.find(part => part.type === type).value).join("-");
  };
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderActivity(activity, today) {
    const days = panel.querySelector(".activity-days");
    const months = panel.querySelector(".activity-months");
    const offset = new Date(activity[0][0] + "T00:00:00Z").getUTCDay();
    panel.style.setProperty("--weeks", Math.ceil((offset + activity.length) / 7));
    for (let blank = 0; blank < offset; blank++) days.append(element("span", "activity-empty"));
    let previousMonth = "";
    let lastLabelColumn = -2;
    let streak = 0;
    for (const [index, [date, active]] of activity.entries()) {
      const cell = element("span", active ? "activity-on" : "");
      if (date === today) cell.classList.add("activity-today");
      cell.title = date + (active ? " · 활동" : " · 기록 없음");
      days.append(cell);
      const month = date.slice(0, 7);
      const column = Math.floor((index + offset) / 7) + 1;
      if (month !== previousMonth && column - lastLabelColumn >= 2) {
        const label = element("span", "", Number(month.slice(-2)) + "월");
        label.style.gridColumn = column;
        months.append(label);
        lastLabelColumn = column;
        previousMonth = month;
      }
      if (active) streak++;
      else if (date !== today) streak = 0;
    }
    const activeDays = activity.filter(([, active]) => active).length;
    days.setAttribute("aria-label", activity[0][0] + "부터 " + activity.at(-1)[0] + "까지 " + activeDays + "일 활동");
    panel.querySelector("[data-activity-streak]").textContent = streak === 90 ? "90일 이상 연속" : streak + "일 연속";
  }

  function renderGauges(tokens) {
    const gauges = panel.querySelector(".activity-gauges");
    const labels = { 1: "일간", 7: "주간", 30: "월간" };
    for (const { days, codex, claude, max } of tokens) {
      const total = codex + claude;
      const item = element("div", "activity-gauge");
      const label = element("div", "activity-gauge-label");
      label.append(element("span", "", labels[days]), element("strong", "", compact.format(total)));
      const track = element("div", "activity-track");
      track.setAttribute("role", "meter");
      track.setAttribute("aria-label", labels[days] + " 토큰 사용량");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", String(max || 1));
      track.setAttribute("aria-valuenow", String(total));
      const detail = "합계 " + number.format(total) + " 토큰, Codex " + number.format(codex) + ", Claude " + number.format(claude);
      track.setAttribute("aria-valuetext", detail);
      for (const [name, value] of [["Codex", codex], ["Claude", claude]]) {
        const segment = element("span", "activity-segment-" + name.toLowerCase());
        segment.style.width = (max ? value / max * 100 : 0) + "%";
        track.append(segment);
      }
      item.append(label, track);
      gauges.append(item);
    }
  }

  fetch("https://raw.githubusercontent.com/rl2aderjoon/rl2aderjoon.github.io/activity-data/activity.json", { cache: "no-cache" })
    .then(response => {
      if (!response.ok) throw new Error("Activity snapshot is unavailable");
      return response.json();
    })
    .then(snapshot => {
      const today = dateKey(new Date());
      renderActivity(snapshot.activity, today);
      renderGauges(snapshot.tokens);
      panel.querySelector("[data-activity-legend]").hidden = false;
      status.hidden = true;
    })
    .catch(() => { status.textContent = "활동을 불러오지 못했습니다."; });
})();
