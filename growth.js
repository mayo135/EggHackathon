// ============================================================
// growth.js — 成長判定ロジック・進化ルート決定
// ============================================================

// ---------- 進化タイプ定義 ----------
// 各タイプはカテゴリキー・表示名・画像パスを持つ
// 新しい進化パターンを追加する場合はここに追記する
const EVOLUTION_TYPES = [
  { category: "sports", name: "体育会系", image: "images/sports.png" },
  { category: "knowledge", name: "研究者", image: "images/knowledge.png" },
  { category: "tech", name: "エンジニア", image: "images/tech.png" },
  { category: "business", name: "ビジネス", image: "images/business.png" },
];

// ---------- 成長段階の定義 ----------
// year に対応する段階名（将来的に段階ごとの画像分離に使える）
const GROWTH_STAGES = {
  1: "たまご",
  2: "幼体",
  3: "成長体",
  4: "完全体",
};

// ---------- 成長判定 ----------
// 現在のスコアから最もスコアの高いカテゴリを判定し、進化タイプを返す
// 全スコアが0の場合は null を返す（たまごのまま）
function determineEvolution(scores) {
  let maxCategory = null;
  let maxScore = 0;

  for (const category in scores) {
    if (scores[category] > maxScore) {
      maxScore = scores[category];
      maxCategory = category;
    }
  }

  // スコアが全て0の場合は進化なし
  if (maxCategory === null) return null;

  return EVOLUTION_TYPES.find((t) => t.category === maxCategory) || null;
}

// ---------- 学年を進める ----------
// 成長判定を行い、学年+1・進化タイプを更新して保存する
// 戻り値: { success, year, type, stageName, message }
function advanceYear() {
  const data = loadData();

  // 4年の場合はデータをリセットして1年に戻る
  if (data.year >= 4) {
    const newData = getDefaultData(); // 初期データ取得
    saveData(newData);
    return {
      success: true,
      year: newData.year,
      type: null,
      stageName: GROWTH_STAGES[newData.year],
      message: "卒業しました！新しい生活（1年生）が始まります。",
      isReset: true // リセットされたことを判定するためのフラグ（任意）
    };
  }
  
  // 学年を進める
  data.year += 1;

  // 成長判定（スコアに基づいて進化タイプを決定）
  const evolution = determineEvolution(data.scores);
  if (evolution) {
    data.currentType = evolution.category;
  }

  saveData(data);

  const stageName = GROWTH_STAGES[data.year] || "";

  return {
    success: true,
    year: data.year,
    type: evolution,
    stageName: stageName,
    message: `${data.year}年生に進級しました！`,
  };
}

// ---------- キャラクター情報を取得 ----------
// 現在の学年と進化タイプに応じた表示情報を返す
function getCharacterInfo() {
  const data = loadData();
  const stageName = GROWTH_STAGES[data.year] || "";

  // 1年生（たまご）の場合
  if (data.year === 1 || !data.currentType) {
    return {
      image: "images/egg.png",
      name: "たまご",
      stageName: stageName,
      year: data.year,
    };
  }

  // 進化後
  const evolution = EVOLUTION_TYPES.find(
    (t) => t.category === data.currentType
  );
  if (!evolution) {
    return {
      image: "images/egg.png",
      name: "たまご",
      stageName: stageName,
      year: data.year,
    };
  }

  // ────────────── 学年ごとの画像分岐 ──────────────もし画像が４つの場合、以下のコードは消して構わない
  // 学年ごとの画像（効率化版）
  const stageSuffix = {
    2: "_2",
    3: "_3",
    4: "_final",
  };

  let imgPath = evolution.image; // デフォルト画像

  if (stageSuffix[data.year]) {
  imgPath = `images/${data.currentType}${stageSuffix[data.year]}.png`;
}

  // ────────────── 返却 ──────────────
  return {
    image: imgPath,
    name: `${evolution.name}（${stageName}）`,
    stageName: stageName,
    year: data.year,
  };
}
