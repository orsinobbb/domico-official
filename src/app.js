import {
  createComicState,
  createJourneyState,
  createGuideState,
  advanceGuide,
  dismissGuide,
  filterProducts,
  getStoryNeighbor,
  getProductStory,
  getJourneyStage,
  getMoodRoute,
  getNextJourneyStep,
  normalizeJourneyState,
  recordJourneyMoment,
  resolveActiveChapter,
  selectCharacter,
  toggleFavorite,
  toggleWishlist,
  chapterIds,
} from "./state.js?v=20260928-1";
import { characters, storySeason } from "./ip-content.js?v=20260928-1";

const fortunes = [
  "今天的你，不用很厲害也值得被喜歡。",
  "慢一點不是落後，是在等心跟上來。",
  "今天只做完一件小事，也是前進。",
  "會說「我不會」，就是學會的第一步。",
];

const stageMeta = {
  meet: { label: "剛剛相遇", count: 0, message: "先隨便逛逛，這裡沒有必走的路。" },
  connect: { label: "有點像我", count: 1, message: "你找到一個有點像自己的夥伴了。" },
  explore: { label: "走進故事", count: 2, message: "原來你也懂這些很小、卻很重要的事。" },
  desire: { label: "想帶回家", count: 3, message: "你收好了一個想留住的感覺，隨時可以改變心意。" },
  invite: { label: "下次再見", count: 4, message: "這份喜歡已經很清楚了。要不要再見面，由你決定。" },
  belong: { label: "成為朋友", count: 4, message: "謝謝你把一點豆米口留在今天。故事後面，還有我們想做的事。" },
};

const guideSteps = [
  {
    character: "dou",
    face: "豆",
    kicker: "小豆帶路 · 1 / 3",
    message: "不用一次看完。先去找找，今天的你比較像誰？",
    action: "去認識夥伴",
    target: "#friends",
  },
  {
    character: "mi",
    face: "米",
    kicker: "小米陪讀 · 2 / 3",
    message: "看完角色後，選一則漫畫慢慢讀。遇到懂你的句子，可以留一顆心。",
    action: "走進漫畫日記",
    target: "#comic",
  },
  {
    character: "kou",
    face: "口",
    kicker: "小口收尾 · 3 / 3",
    message: "最後才是小商店。不用買，只要收藏一件真的有感覺的東西。",
    action: "去看看故事裡的物件",
    target: "#shop",
  },
];

function loadJourney() {
  try {
    const saved = JSON.parse(localStorage.getItem("doumikou-journey"));
    if (saved && typeof saved === "object") return normalizeJourneyState(saved);
  } catch {}
  return createJourneyState();
}

let journey = loadJourney();

function loadGuide() {
  return createGuideState(true);
}

let guide = loadGuide();

function saveGuide() {
  if (!guide.completed) return;
  try {
    localStorage.setItem("doumikou-guide-complete", "1");
  } catch {}
}

function renderGuide() {
  const card = document.querySelector("#guide-card");
  card.hidden = guide.completed;
  document.body.classList.toggle("guide-active", !guide.completed);
  if (guide.completed) return;

  const step = guideSteps[guide.step];
  card.dataset.character = step.character;
  card.querySelector("#guide-face").textContent = step.face;
  card.querySelector("#guide-kicker").textContent = step.kicker;
  card.querySelector("#guide-message").textContent = step.message;
  card.querySelector(".guide-next span").textContent = step.action;
  card.querySelectorAll(".guide-dots i").forEach((dot, index) => dot.classList.toggle("active", index === guide.step));
}

function renderJourney() {
  const stage = getJourneyStage(journey);
  const meta = stageMeta[stage];
  document.querySelector("#journey-label").textContent = meta.label;
  document.querySelector("#journey-count").textContent = `${meta.count} / 4`;
  document.querySelector("#journey-message").textContent = meta.message;
  const stageOrder = ["connect", "explore", "desire", "invite"];
  document.querySelectorAll("[data-stage]").forEach((item, index) => {
    const done = index < meta.count;
    item.classList.toggle("done", done);
    item.querySelector("span").textContent = done ? "●" : "○";
  });
  document.querySelector("#launch-invite").hidden = !["invite", "belong"].includes(stage);
  document.querySelectorAll("[data-product]").forEach((card) => {
    const wished = journey.wishlist.includes(card.dataset.productId);
    card.classList.toggle("is-wished", wished);
    const button = card.querySelector(".wish-button");
    button.setAttribute("aria-pressed", String(wished));
    button.innerHTML = wished ? "已收藏 <b>♥</b>" : "想收藏 <b>♡</b>";
  });
  const characterFavorite = document.querySelector("[data-character-favorite]");
  if (characterFavorite) {
    const characterId = characterFavorite.dataset.characterFavorite;
    const favorite = journey.favoriteCharacters.includes(characterId);
    const character = selectCharacter(characters, characterId);
    characterFavorite.setAttribute("aria-pressed", String(favorite));
    characterFavorite.innerHTML = favorite
      ? `今天有${character.name}陪我 <span>♥</span>`
      : `把${character.name}留在今天 <span>♡</span>`;
  }
  localStorage.setItem("doumikou-journey", JSON.stringify(journey));
}

function remember(moment) {
  journey = recordJourneyMoment(journey, moment);
  renderJourney();
}

function revealInlineStep(element) {
  requestAnimationFrame(() => {
    element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

const card = document.querySelector("#character-card");
const tabs = [...document.querySelectorAll("[data-character]")];
let activeCharacterId = "dou";

function renderCharacter(character) {
  activeCharacterId = character.id;
  card.style.setProperty("--character-accent", character.accent);
  card.innerHTML = `
    <div class="character-card__intro">
      <p class="character-number">${character.number}</p>
      <h3>${character.name} <span>「${character.motto}」</span></h3>
      <p class="character-story">${character.story}</p>
      <div class="traits">${character.traits.map((trait) => `<span>${trait}</span>`).join("")}</div>
    </div>
    <div class="character-layers">
      <section><small>別人先看見的我</small><p>${character.outerImpression}</p></section>
      <section><small>其實心裡</small><p>${character.innerConflict}</p></section>
      <section><small>我正在學著</small><p>${character.learning}</p></section>
      <blockquote>「${character.quote}」</blockquote>
      <button class="character-favorite" type="button" data-character-favorite="${character.id}" aria-pressed="false">把${character.name}留在今天 <span>♡</span></button>
    </div>`;
  renderJourney();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const character = selectCharacter(characters, tab.dataset.character);
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    card.animate([{ opacity: 0.35, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" });
    renderCharacter(character);
    const note = document.querySelector("#connection-note");
    note.innerHTML = `<span>${character.name} 接到你了 ✓</span><p>今天的你可能需要這句：「${character.quote}」</p><a href="#comic">讀一篇${character.name}想留給你的故事 <b>↓</b></a>`;
    note.classList.add("confirmed");
    remember(`character:${character.id}`);
  });
});

card.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-character-favorite]");
  if (!favoriteButton) return;
  journey = toggleFavorite(journey, "character", activeCharacterId);
  renderJourney();
});

let comicState = createComicState(document.querySelectorAll("[data-comic-page]").length);
const comicPages = [...document.querySelectorAll("[data-comic-page]")];
const comicCount = document.querySelector("#comic-count");
const comicTheme = document.querySelector("#comic-theme");
const storyReaction = document.querySelector("#story-reaction");

function renderStoryReaction() {
  const story = storySeason.stories[comicState.index];
  const favorite = journey.favoriteStories.includes(story.id);
  storyReaction.setAttribute("aria-pressed", String(favorite));
  storyReaction.innerHTML = favorite ? "謝謝你也懂 <span>♥</span>" : "這一話，有點懂我 <span>♡</span>";
  document.querySelector("#story-handoff").hidden = !favorite;
}

function activateComic(index, track = true, focus = false) {
  comicState = createComicState(comicState.length, index);
  comicPages.forEach((page, pageIndex) => {
    const active = pageIndex === comicState.index;
    page.hidden = !active;
    page.classList.toggle("active", active);
  });
  comicCount.textContent = `${String(comicState.index + 1).padStart(2, "0")} / ${String(comicState.length).padStart(2, "0")}`;
  comicTheme.textContent = storySeason.stories[comicState.index].theme;
  document.querySelectorAll(".comic-progress i").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === comicState.index));
  renderStoryReaction();
  if (track) remember(`comic:${storySeason.stories[comicState.index].id}`);
  if (focus) comicPages[comicState.index].focus({ preventScroll: true });
}

function navigateStory(direction, focus = true) {
  const story = storySeason.stories[comicState.index];
  const neighbor = getStoryNeighbor(storySeason, story.id, direction);
  if (!neighbor) {
    document.querySelector(".comic-intro")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  activateComic(storySeason.stories.findIndex((entry) => entry.id === neighbor.id), true, focus);
}

document.querySelectorAll("[data-season-move]").forEach((button) => {
  button.addEventListener("click", () => {
    navigateStory(button.dataset.seasonMove);
  });
});

document.querySelectorAll("[data-story-go]").forEach((button) => {
  button.addEventListener("click", () => navigateStory(button.dataset.storyGo));
});

storyReaction.addEventListener("click", () => {
  const story = storySeason.stories[comicState.index];
  journey = toggleFavorite(journey, "story", story.id);
  const active = journey.favoriteStories.includes(story.id);
  renderJourney();
  renderStoryReaction();
  const handoff = document.querySelector("#story-handoff");
  if (active) {
    remember(`comic:${story.id}`);
    handoff.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 360 });
    revealInlineStep(handoff);
  }
});

document.querySelectorAll("[data-story-object]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll("[data-product]").forEach((product) => product.classList.remove("route-highlight"));
    const recommended = document.querySelector(`[data-product-id="${link.dataset.storyObject}"]`);
    recommended?.classList.add("route-highlight");
    setTimeout(() => recommended?.classList.remove("route-highlight"), 2400);
  });
});

const moodReplies = {
  push: "小豆說：先做一件兩分鐘能做完的事。不是為了證明你很厲害，是讓身體知道：我們開始囉。",
  pause: "小米說：現在什麼都不用解決。先找出眼前三個安靜的東西，心會慢慢跟上來。",
  hug: "小口說：那就不問今天發生了什麼。你已經撐到這裡，這就很不容易了。",
};

let activeMoodRoute = getMoodRoute("push");

document.querySelectorAll("[data-mood]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-mood]").forEach((item) => item.classList.toggle("active", item === button));
    const reply = document.querySelector("#mood-reply");
    activeMoodRoute = getMoodRoute(button.dataset.mood);
    document.querySelector(`[data-character="${activeMoodRoute.characterId}"]`)?.click();
    reply.querySelector("p").textContent = moodReplies[button.dataset.mood];
    reply.hidden = false;
    reply.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 360 });
    revealInlineStep(reply);
  });
});

document.querySelector("#mood-reply button").addEventListener("click", () => {
  activateComic(activeMoodRoute.comicIndex);
  document.querySelector("#comic")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#story-handoff a").addEventListener("click", () => {
  document.querySelectorAll("[data-product]").forEach((card) => card.classList.remove("route-highlight"));
  const recommended = document.querySelector(`[data-product-id="${activeMoodRoute.productId}"]`);
  recommended?.classList.add("route-highlight");
  setTimeout(() => recommended?.classList.remove("route-highlight"), 2400);
});

const productCards = [...document.querySelectorAll("[data-product]")];
const productData = productCards.map((element) => ({ element, category: element.dataset.category }));

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const visible = new Set(filterProducts(productData, button.dataset.filter).map((item) => item.element));
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    productCards.forEach((product) => {
      product.hidden = !visible.has(product);
      if (!product.hidden) product.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 300 });
    });
  });
});

const productDialog = document.querySelector("#product-dialog");
let dialogProductId = null;

function setWish(productId) {
  const wasWished = journey.wishlist.includes(productId);
  journey = toggleWishlist(journey, productId);
  renderJourney();
  if (dialogProductId === productId) {
    const wished = journey.wishlist.includes(productId);
    productDialog.querySelector(".dialog-wish").innerHTML = wished ? "已收進小心願 <span>♥</span>" : "收進我的小心願 <span>♡</span>";
  }
  const feedback = document.querySelector("#shop-feedback");
  const next = getNextJourneyStep(journey);
  feedback.hidden = false;
  feedback.querySelector("#shop-feedback-title").textContent = wasWished
    ? "已幫你移開，照自己的感覺就好"
    : "這件已收進你的小心願 ✓";
  feedback.querySelector("#shop-feedback-message").textContent = wasWished
    ? "改變心意不是反悔，是更知道自己喜歡什麼。"
    : next.message;
  const link = feedback.querySelector("#shop-feedback-next");
  link.href = next.target;
  link.innerHTML = `${next.label} <b>→</b>`;
  feedback.animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 360 });
  revealInlineStep(feedback);
}

document.querySelectorAll("[data-product]").forEach((product) => {
  const productId = product.dataset.productId;
  product.querySelector(".wish-button").addEventListener("click", () => setWish(productId));
  product.querySelector(".product-preview").addEventListener("click", () => {
    const detail = getProductStory(productId);
    dialogProductId = productId;
    productDialog.querySelector("#dialog-title").textContent = detail.title;
    productDialog.querySelector("#dialog-story").textContent = detail.story;
    productDialog.querySelector("#dialog-quote").textContent = detail.quote;
    const wished = journey.wishlist.includes(productId);
    productDialog.querySelector(".dialog-wish").innerHTML = wished ? "已收進小心願 <span>♥</span>" : "收進我的小心願 <span>♡</span>";
    remember(`product:${productId}`);
    productDialog.showModal();
  });
});

productDialog.querySelector(".dialog-close").addEventListener("click", () => productDialog.close());
productDialog.querySelector(".dialog-wish").addEventListener("click", () => setWish(dialogProductId));
productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) productDialog.close();
});

document.querySelector("#notify-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  form.innerHTML = `<p class="notify-success"><b>謝謝你想收到這張小紙條 ●</b><br>目前是概念預覽，這次不會儲存或送出你的信箱；正式通知串接後，我們會再請你確認一次。</p><a class="notify-next" href="#brand-world">看看故事背後的豆米口 <span>→</span></a>`;
  remember("notify:launch");
});

const journeyHandle = document.querySelector(".journey-handle");
journeyHandle.addEventListener("click", () => {
  const panel = document.querySelector("#journey-panel");
  const expanded = journeyHandle.getAttribute("aria-expanded") !== "true";
  journeyHandle.setAttribute("aria-expanded", String(expanded));
  panel.hidden = !expanded;
});

document.querySelector(".guide-next").addEventListener("click", () => {
  const current = guideSteps[guide.step];
  guide = advanceGuide(guide, guideSteps.length);
  saveGuide();
  renderGuide();
  document.querySelector(current.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector(".guide-skip").addEventListener("click", () => {
  guide = dismissGuide(guide);
  saveGuide();
  renderGuide();
});

document.querySelector("#replay-guide").addEventListener("click", () => {
  guide = createGuideState();
  renderGuide();
  document.querySelector("#journey-panel").hidden = true;
  journeyHandle.setAttribute("aria-expanded", "false");
  document.querySelector("#top")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-image-slot]").forEach((slot) => {
  const image = new Image();
  const product = slot.closest("[data-product]");
  image.alt = product ? product.querySelector("h3").textContent : "";
  image.addEventListener("load", () => {
    if (product) {
      slot.classList.remove("product-image-pending");
      slot.replaceChildren(image);
    } else {
      slot.classList.add("has-scene-image");
      slot.prepend(image);
    }
  });
  image.src = slot.dataset.imageSlot;
});

let fortuneIndex = -1;
const fortune = document.querySelector("#fortune");
document.querySelector("#fortune-button").addEventListener("click", () => {
  fortuneIndex = (fortuneIndex + 1) % fortunes.length;
  fortune.querySelector("p").textContent = fortunes[fortuneIndex];
  fortune.hidden = false;
  fortune.animate([{ opacity: 0, transform: "translateY(8px) rotate(-1deg)" }, { opacity: 1, transform: "translateY(0) rotate(-1deg)" }], { duration: 420 });
});

let seeds = 0;
const counter = document.querySelector("#seed-counter");
document.querySelectorAll("[data-secret]").forEach((secret) => {
  secret.addEventListener("click", () => {
    if (secret.classList.contains("collected")) return;
    secret.classList.add("collected");
    seeds += 1;
    counter.querySelector("b").textContent = seeds;
    counter.classList.add("visible");
    if (seeds === 2) {
      counter.innerHTML = "<span>✦</span> 你找到今天的兩顆靈感豆！";
      document.body.classList.add("all-seeds-found");
      remember("seeds:found");
    }
  });
});

const parallax = document.querySelector("[data-parallax]");
if (matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) {
  parallax.addEventListener("pointermove", (event) => {
    const bounds = parallax.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    parallax.style.setProperty("--parallax-x", `${x * 14}px`);
    parallax.style.setProperty("--parallax-y", `${y * 10}px`);
  });
  parallax.addEventListener("pointerleave", () => {
    parallax.style.setProperty("--parallax-x", "0px");
    parallax.style.setProperty("--parallax-y", "0px");
  });
}

const soundToggle = document.querySelector(".sound-toggle");
soundToggle.addEventListener("click", () => {
  const active = soundToggle.getAttribute("aria-pressed") !== "true";
  soundToggle.setAttribute("aria-pressed", String(active));
  soundToggle.querySelector(".sound-label").textContent = active ? "想像有音樂" : "安靜模式";
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("revealed");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".section, .ending").forEach((section) => observer.observe(section));

const chapterElements = chapterIds.map((id) => ({ id, element: document.querySelector(`#${id}`) }));
let scrollFrame = 0;

function updateReadingPosition() {
  scrollFrame = 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
  document.querySelector("#reading-progress-bar").style.width = `${progress * 100}%`;

  const chapters = chapterElements.map(({ id, element }) => ({ id, top: element.offsetTop }));
  const active = resolveActiveChapter(scrollY + innerHeight * 0.34, chapters);
  document.querySelectorAll("[data-chapter-link]").forEach((link) => {
    const current = link.dataset.chapterLink === active;
    link.classList.toggle("is-current", current);
    if (current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

addEventListener("scroll", () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReadingPosition);
}, { passive: true });
addEventListener("scrollend", updateReadingPosition, { passive: true });
addEventListener("resize", updateReadingPosition);
addEventListener("hashchange", updateReadingPosition);
addEventListener("load", () => setTimeout(updateReadingPosition, 0));

renderJourney();
renderStoryReaction();
renderGuide();
updateReadingPosition();
