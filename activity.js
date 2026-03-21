// ============================================================
// activity.js — イベントデータ定義・活動記録・localStorage読み書き
// ============================================================

// ---------- イベント定義 ----------
// 各イベントは4カテゴリへの重み（合計1.0）と強度（power）を持つ
// 新しいイベントを追加する場合はこの配列に追記する
const EVENTS = [
  {
    name: "ハッカソン",
    weights: { sports: 0, knowledge: 0.4, tech: 0.6, business: 0 },
    power: 3,
  },
  {
    name: "体育大会",
    weights: { sports: 0.9, knowledge: 0, tech: 0, business: 0.1 },
    power: 2,
  },
  {
    name: "学会発表",
    weights: { sports: 0, knowledge: 0.8, tech: 0.2, business: 0 },
    power: 3,
  },
  {
    name: "バイト",
    weights: { sports: 0, knowledge: 0, tech: 0, business: 1.0 },
    power: 1,
  },
  {
    name: "技術系インターン",
    weights: { sports: 0, knowledge: 0.1, tech: 0.7, business: 0.2 },
    power: 3,
  },
  {
    name: "就労型インターン",
    weights: { sports: 0, knowledge: 0.1, tech: 0.1, business: 0.8 },
    power: 3,
  },
  {
    name: "サークル活動",
    weights: { sports: 0.5, knowledge: 0.1, tech: 0.1, business: 0.3 },
    power: 1,
  },
  {
    name: "ボランティア",
    weights: { sports: 0.2, knowledge: 0.2, tech: 0, business: 0.6 },
    power: 2,
  },
  {
    name: "研究活動",
    weights: { sports: 0, knowledge: 0.7, tech: 0.3, business: 0 },
    power: 2,
  },
  {
    name: "部活動（運動部）",
    weights: { sports: 0.9, knowledge: 0, tech: 0, business: 0.1 },
    power: 2,
  },
];

// ---------- localStorageキー ----------
const STORAGE_KEY = "tamagotchi_data";

// ---------- デフォルトデータ ----------
function getDefaultData() {
  return {
    year: 1,
    scores: { sports: 0, knowledge: 0, tech: 0, business: 0 },
    activities: [],
    currentType: null,
  };
}

// ---------- データ読み込み ----------
// localStorageからデータを取得。なければデフォルト値を返す
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getDefaultData();
  try {
    return JSON.parse(raw);
  } catch (e) {
    return getDefaultData();
  }
}

// ---------- データ保存 ----------
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------- 活動を記録 ----------
// イベント名・日付・メモを受け取り、スコアを加算して保存する
function recordActivity(eventName, date, memo) {
  const event = EVENTS.find((e) => e.name === eventName);
  if (!event) return false;

  // --- イースターエッグ演出ここから ---
  if (memo === 'EasterEggHackathon2026') {
      const easterEggImage = document.getElementById('easter-egg-image');
      if (easterEggImage) {
          easterEggImage.classList.remove('animate-easter-egg');
          void easterEggImage.offsetWidth; // アニメーションのリセット
          easterEggImage.classList.add('animate-easter-egg');
          
          easterEggImage.addEventListener('animationend', () => {
              easterEggImage.classList.remove('animate-easter-egg');
          }, { once: true });
      }
  }
  // --- イースターエッグ演出ここまで ---

  const data = loadData();

  // power × weights を各カテゴリスコアに加算
  for (const category in event.weights) {
    data.scores[category] += event.power * event.weights[category];
  }

  // 活動履歴に追加
  data.activities.push({
    event: eventName,
    date: date,
    memo: memo || "",
  });

  saveData(data);
  return true;
}

// ---------- セレクトボックスにイベントを追加 ----------
function populateEventSelect(selectElement) {
  EVENTS.forEach((event) => {
    const option = document.createElement("option");
    option.value = event.name;
    option.textContent = event.name;
    selectElement.appendChild(option);
  });
}

// ---------- イベントの重み情報を表示用テキストにする ----------
function getWeightsText(eventName) {
  const event = EVENTS.find((e) => e.name === eventName);
  if (!event) return "";

  const labels = {
    sports: "運動",
    knowledge: "知識",
    tech: "技術",
    business: "ビジネス",
  };

  const parts = [];
  for (const key in event.weights) {
    if (event.weights[key] > 0) {
      parts.push(`${labels[key]} ${Math.round(event.weights[key] * 100)}%`);
    }
  }

  return `強度: ${event.power} ／ ${parts.join(" ・ ")}`;
}
