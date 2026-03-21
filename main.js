// ============================================================
// main.js — タブ切り替え・初期化・画面更新
// ============================================================

// ---------- DOM要素の取得 ----------
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const characterImg = document.getElementById("character-img");
const characterName = document.getElementById("character-name");
const yearDisplay = document.getElementById("year-display");
const advanceYearBtn = document.getElementById("advance-year-btn");
const eventSelect = document.getElementById("event-select");
const eventWeights = document.getElementById("event-weights");
const activityDate = document.getElementById("activity-date");
const activityMemo = document.getElementById("activity-memo");
const recordBtn = document.getElementById("record-btn");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
// ---------- カレンダー用の状態 ----------
let calYear = new Date().getFullYear();   // 表示中の年
let calMonth = new Date().getMonth();     // 表示中の月（0-11）

// ---------- タブ切り替え ----------
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.tab;

    // 全タブを非アクティブに
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    // クリックされたタブをアクティブに
    btn.classList.add("active");
    document.getElementById(targetId).classList.add("active");

    // 履歴タブに切り替えた時は履歴を更新
    if (targetId === "history-view") {
      renderHistory();
    }
  });
});

// ---------- パーティクルエフェクト（進化時のお祝い演出） ----------
function showParticles() {
  // Canvas要素を動的に作成してキャラクターエリアに重ねる
  const area = document.getElementById("character-area");
  area.style.position = "relative";
  const canvas = document.createElement("canvas");
  canvas.width = area.offsetWidth;
  canvas.height = area.offsetHeight;
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none"; // 下の要素を操作できるように
  area.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const colors = ["#e67e22", "#f1c40f", "#e74c3c", "#2ecc71", "#9b59b6", "#3498db"];

  // パーティクルを生成（中央から放射状に飛ぶ）
  const particles = Array.from({ length: 40 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    size: Math.random() * 6 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1.0,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // 重力
      p.life -= 0.015; // フェードアウト
      if (p.life <= 0) return;
      alive = true;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    if (alive) {
      requestAnimationFrame(animate);
    } else {
      // アニメーション終了後にCanvasを削除
      canvas.remove();
    }
  }

  animate();
}

// ---------- メイン画面の更新 ----------
function updateMainView() {
  const info = getCharacterInfo();
  const data = loadData();

  // キャラクター表示
  characterImg.src = info.image;
  characterImg.alt = info.name;
  characterName.textContent = info.name;

  // 学年表示
  yearDisplay.textContent = `${info.year}年生`;

  // スコア表示
  document.getElementById("score-sports").textContent =
    Math.round(data.scores.sports * 10) / 10;
  document.getElementById("score-knowledge").textContent =
    Math.round(data.scores.knowledge * 10) / 10;
  document.getElementById("score-tech").textContent =
    Math.round(data.scores.tech * 10) / 10;
  document.getElementById("score-business").textContent =
    Math.round(data.scores.business * 10) / 10;

  // 4年生ならボタンのテキストを変更（無効化はしない）
  if (data.year >= 4) {
    advanceYearBtn.disabled = false; // ボタンを押せるようにする
    advanceYearBtn.textContent = "卒業して1年生に戻る";
    advanceYearBtn.style.backgroundColor = "#9b59b6"; // 卒業感のある色に変更（任意）
  } else {
    advanceYearBtn.disabled = false;
    advanceYearBtn.textContent = "学年を進める";
    advanceYearBtn.style.backgroundColor = ""; // CSSのデフォルトに戻す
  }
}
// ---------- 学年を進めるボタン ----------
advanceYearBtn.addEventListener("click", () => {
  const result = advanceYear();

  if (result.success) {
    // 進化結果のメッセージ
    let msg = result.message;
    if (result.type) {
      msg += `\n${result.type.name}タイプに進化しました！`;
    }
    updateMainView();
    showParticles(); // お祝いパーティクル表示
    alert(msg);
  } else {
    alert(result.message);
  }
});

// ---------- イベント選択の初期化 ----------
populateEventSelect(eventSelect);

// 日付のデフォルトを今日に設定
activityDate.value = new Date().toISOString().split("T")[0];

// ---------- 活動記録ボタン ----------
recordBtn.addEventListener("click", () => {
  const eventName = eventSelect.value;
  const date = activityDate.value;
  const memo = activityMemo.value.trim();

  if (!eventName) {
    alert("イベントを選択してください。");
    return;
  }
  if (!date) {
    alert("活動日を入力してください。");
    return;
  }

  const success = recordActivity(eventName, date, memo);
  if (success) {
    alert(`「${eventName}」を記録しました！`);
    // フォームをリセット
    activityMemo.value = "";
    activityDate.value = new Date().toISOString().split("T")[0];
    // メイン画面のスコアも更新
    updateMainView();
  }
});

// ---------- 隠し卵を配置する日の判定 ----------
// 月ごとに数か所、ランダム風だが固定の日に隠す（シード的に月と年から決定）
function isHiddenEggDay(day, month, year) {
  // 月ごとに3つの日に隠す（1日, 中旬, 下旬あたり）
  const seed = year * 13 + month * 7;
  const days = [
    (seed % 5) + 1,          // 1〜5日のどこか
    (seed % 7) + 12,         // 12〜18日のどこか
    (seed % 6) + 23,         // 23〜28日のどこか
  ];
  if (days.includes(day)) {
    console.log(`🥚 隠し卵: ${year}年${month + 1}月${day}日`);
    return true;
  }
  return false;
}

// ---------- 履歴表示（カレンダー形式） ----------
function renderHistory() {
  const data = loadData();
  const grid = document.getElementById("calendar-grid");
  const label = document.getElementById("cal-month-label");
  const detail = document.getElementById("cal-detail");
  const emptyMsg = document.getElementById("history-empty");

  // 活動がなければメッセージ表示（カレンダーは表示する）
  emptyMsg.style.display = data.activities.length === 0 ? "block" : "none";
  detail.style.display = "none";

  // 月ラベル更新
  label.textContent = `${calYear}年 ${calMonth + 1}月`;

  // 曜日ヘッダーを残して日付セルをクリア
  const dows = grid.querySelectorAll(".cal-dow");
  grid.innerHTML = "";
  dows.forEach((d) => grid.appendChild(d));

  // 該当月の活動を日付ごとにまとめる
  const actByDate = {};
  data.activities.forEach((act) => {
    if (!actByDate[act.date]) actByDate[act.date] = [];
    actByDate[act.date].push(act);
  });

  // カレンダー生成
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 月初の曜日
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate(); // 月の日数
  const todayStr = new Date().toISOString().split("T")[0];

  // 月初までの空セル
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "cal-day empty";
    grid.appendChild(empty);
  }

  // 日付セル
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "cal-day";

    // 日付番号
    const dayNum = document.createElement("span");
    dayNum.className = "cal-day-num";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    if (dateStr === todayStr) cell.classList.add("today");

    // 活動があればテキストを積み重ねて表示
    if (actByDate[dateStr]) {
      cell.classList.add("has-activity");
      actByDate[dateStr].forEach((act) => {
        const tag = document.createElement("div");
        tag.className = "cal-activity-tag";
        tag.textContent = act.event;
        cell.appendChild(tag);
      });
    }

    // 活動がある日 かつ 隠し卵の日 → タグ領域に卵を重ねる
    if (isHiddenEggDay(d, calMonth, calYear)) {
      const egg = document.createElement("img");
      egg.src = "images/egg_kakushi.png";
      egg.className = "hidden-egg";
      // タグ領域内のランダムな位置に配置（日付から決定的に算出）
      const seed = d * 17 + calMonth * 31 + calYear;
      egg.style.top = (20 + (seed % 60)) + "%";
      egg.style.left = ((seed * 3) % 70) + "%";
      egg.addEventListener("click", (e) => {
        e.stopPropagation();
        // 活動がある日のみ反応する
        if (actByDate[dateStr]) {
          // 毎回アニメーションをリセットして再生
          if(!egg.classList.contains("found")){
            const popup = document.createElement("div");
            popup.className = "egg-popup";
            popup.textContent = "卵みっけ！";
            cell.appendChild(popup);
            // アニメーション後に自動削除
            popup.addEventListener("animationend", () => popup.remove());
          }
          egg.classList.remove("found");
          void egg.offsetWidth;
          egg.classList.add("found");
        }
      });
      cell.appendChild(egg);
    }

    // 日付クリックで詳細表示
    cell.addEventListener("click", () => {
      // 選択状態の更新
      grid.querySelectorAll(".cal-day.selected").forEach((c) => c.classList.remove("selected"));
      cell.classList.add("selected");

      showDayDetail(dateStr, actByDate[dateStr] || [], data);
    });

    grid.appendChild(cell);
  }
}

// ---------- 日付クリック時の詳細表示 ----------
function showDayDetail(dateStr, activities, data) {
  const detail = document.getElementById("cal-detail");
  const dateLabel = document.getElementById("cal-detail-date");
  const list = document.getElementById("cal-detail-list");

  dateLabel.textContent = dateStr;
  list.innerHTML = "";

  if (activities.length === 0) {
    list.innerHTML = "<li style='color:#aaa;cursor:default;'>この日の活動はありません</li>";
    detail.style.display = "block";
    return;
  }

  activities.forEach((act) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${act.event}</strong>${act.memo ? `<br><span style="font-size:0.8em;color:#666;">${act.memo}</span>` : ""}`;

    // タップで削除
    li.addEventListener("click", () => {
      if (confirm(`「${act.event}」(${dateStr}) を削除しますか？`)) {
        const idx = data.activities.findIndex(
          (a) => a.event === act.event && a.date === act.date && a.memo === act.memo
        );
        if (idx !== -1) {
          // スコアを差し引く
          const event = EVENTS.find((e) => e.name === act.event);
          if (event) {
            for (const key in event.weights) {
              data.scores[key] = Math.max(0, data.scores[key] - event.power * event.weights[key]);
            }
          }
          data.activities.splice(idx, 1);
          saveData(data);
          renderHistory();
          updateMainView();
        }
      }
    });

    list.appendChild(li);
  });

  detail.style.display = "block";
}

// ---------- 月切り替えボタン ----------
document.getElementById("cal-prev-btn").addEventListener("click", () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderHistory();
});

document.getElementById("cal-next-btn").addEventListener("click", () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderHistory();
});

// --- キャラクターをタップして揺らす ---
characterImg.addEventListener("click", () => {
  // すでにアニメーション中なら一旦外す（連続タップ対応）
  characterImg.classList.remove("wiggle-active");
  
  // 強制的に再描画させてからクラスを付ける
  void characterImg.offsetWidth; 
  characterImg.classList.add("wiggle-active");

  // アニメーションが終わったらクラスを消す（JS側で管理）
  characterImg.onanimationend = () => {
    characterImg.classList.remove("wiggle-active");
  };
});

// ---------- 初期化 ----------
updateMainView();
