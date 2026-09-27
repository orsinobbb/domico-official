export function createComicState(length, index = 0) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("Comic length must be a positive integer");
  }

  return { length, index: ((index % length) + length) % length };
}

export function moveComic(state, delta) {
  return createComicState(state.length, state.index + delta);
}

export function filterProducts(products, category) {
  return category === "all"
    ? products
    : products.filter((product) => product.category === category);
}

const productStories = {
  "adventure-tote": {
    title: "三個小家伙帆布袋",
    story: "袋子畫著三個人出門的那一刻：小豆已經走了兩步，小米還在確認清單，小口則帶了三人份的點心。適合裝下會忘記帶的小勇氣。",
    quote: "「不用準備到完美，我們可以邊走邊想。」",
  },
  "mood-pins": {
    title: "心情徽章三入組",
    story: "三枚徽章分別是「準備出發」、「正在充電」與「需要抱抱」。有些日子不想說得太多，就讓一個小圓圈先幫你開口。",
    quote: "「情緒不是太多，只是正在找一個容器。」",
  },
  "slow-mug": {
    title: "慢慢來陶瓷杯",
    story: "杯子的邊緣不是完全對稱，像每一個沒有按計畫開始的早晨。小米說，留一點不整齊，手才會記得它。",
    quote: "「你不需要追上今天，今天會等你。」",
  },
  "story-postcards": {
    title: "漫畫日記明信片",
    story: "把三則漫畫最安靜的一格留在紙上。背面有一個小小的未完句，等你寫給一個很久沒聯絡，卻沒有忘記的人。",
    quote: "「有些話晚一點到，還是會被收到。」",
  },
  "story-notebook": {
    title: "今天先寫一點筆記本",
    story: "封面像一本被三個小家伙輪流保管的日記。小豆寫下想做的事，小米替每頁留好空白，小口則在角落畫下當天的心情。",
    quote: "「不用寫成答案，留下今天就很好。」",
  },
  "daily-binder": {
    title: "散落也沒關係活頁夾",
    story: "透明活頁夾收著票根、便條與還沒完成的計畫。頁面可以隨時重排，提醒你生活不必一次整理好，慢慢找到順序就行。",
    quote: "「今天散開的，也能在明天重新排好。」",
  },
  "companion-cup-sleeve": {
    title: "陪你走一段飲料杯套",
    story: "小豆把杯套背上就想出發，小米確認提帶夠不夠穩，小口則決定把第一口留給你。它裝的不只是飲料，也是一起走路的藉口。",
    quote: "「手上有一杯，路就沒那麼長。」",
  },
  "action-tee": {
    title: "先走一步寬版 T-shirt",
    story: "胸前的小豆正跨出誇張的一大步，背後兩位伙伴追著替他補上地圖和點心。穿上它，不代表不害怕，只是願意先動一下。",
    quote: "「勇敢不是很大聲，是先往前一點。」",
  },
  "slow-sweatshirt": {
    title: "慢慢來柔軟衛衣",
    story: "小米把安靜做成一件柔軟的衣服，袖口藏著一顆小星星，只有捲起袖子時才會看見。適合需要把世界音量調低的日子。",
    quote: "「慢一點，我才聽得見自己。」",
  },
  "hug-socks": {
    title: "走累了就抱抱襪",
    story: "左右腳各有一個小口，走路時像兩個小家伙不停碰面。當今天走得有點累，就讓腳底先收到一個不用解釋的擁抱。",
    quote: "「再小的步伐，也值得被好好接住。」",
  },
};

export function getProductStory(productId) {
  const story = productStories[productId];
  if (!story) throw new Error(`Unknown product: ${productId}`);
  return { ...story };
}

export function selectCharacter(characters, id) {
  const character = characters.find((item) => item.id === id);
  if (!character) throw new Error(`Unknown character: ${id}`);
  return character;
}

export function createJourneyState() {
  return { moments: [], wishlist: [] };
}

export function recordJourneyMoment(state, moment) {
  if (!moment || state.moments.includes(moment)) return state;
  return { ...state, moments: [...state.moments, moment] };
}

export function toggleWishlist(state, productId) {
  if (!productId) return state;
  const wishlist = state.wishlist.includes(productId)
    ? state.wishlist.filter((id) => id !== productId)
    : [...state.wishlist, productId];
  return { ...state, wishlist };
}

export function getJourneyStage(state) {
  if (state.wishlist.length >= 2) return "invite";
  if (state.wishlist.length || state.moments.some((moment) => moment.startsWith("product:"))) return "desire";
  if (state.moments.some((moment) => moment.startsWith("comic:") || moment === "seeds:found")) return "explore";
  if (state.moments.some((moment) => moment.startsWith("character:"))) return "connect";
  return "meet";
}

export function createGuideState(completed = false) {
  return { step: 0, completed: Boolean(completed), dismissed: false };
}

export function advanceGuide(state, length) {
  if (state.completed || !Number.isInteger(length) || length < 1) return state;
  if (state.step >= length - 1) return { ...state, completed: true };
  return { ...state, step: state.step + 1 };
}

export function dismissGuide(state) {
  return { ...state, completed: true, dismissed: true };
}

export function resolveActiveChapter(marker, chapters) {
  if (!chapters.length) return null;
  return chapters.reduce(
    (active, chapter) => (chapter.top <= marker ? chapter.id : active),
    chapters[0].id,
  );
}

const moodRoutes = {
  push: { characterId: "dou", comicIndex: 0, productId: "adventure-tote" },
  pause: { characterId: "mi", comicIndex: 1, productId: "slow-mug" },
  hug: { characterId: "kou", comicIndex: 2, productId: "mood-pins" },
};

export function getMoodRoute(mood) {
  const route = moodRoutes[mood];
  if (!route) throw new Error(`Unknown mood: ${mood}`);
  return { ...route };
}

export function getNextJourneyStep(state) {
  const stage = getJourneyStage(state);
  const steps = {
    meet: {
      target: "#friends",
      label: "先找到像你的夥伴",
      message: "從一句有感覺的話開始。",
    },
    connect: {
      target: "#comic",
      label: "讀一篇適合你的故事",
      message: "你的夥伴已經幫你留了一頁。",
    },
    explore: {
      target: "#shop",
      label: "把一點故事帶回日常",
      message: "有些感受，可以變成陪在身邊的物件。",
    },
    desire: {
      target: "#shop",
      label: "再看一件有感覺的物件",
      message: "不用急著決定，先把喜歡收好。",
    },
    invite: {
      target: "#launch-invite",
      label: "決定要不要再見面",
      message: "你已經選出真正有感覺的東西。",
    },
  };
  return steps[stage];
}
