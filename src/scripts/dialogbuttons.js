const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MORPH_DURATION = 280;
// A snappier decelerate than the CSS "ease-out" keyword — fast out of the
// gate, gentle settle. Common choice for this kind of box morph.
const MORPH_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
// Deliberately different from MORPH_EASING: that curve front-loads almost
// all of its progress into the first few percent, so an opacity fade using
// it reads as an instant pop rather than a fade. ease-in keeps the fade
// perceptible across the whole duration.
const FADE_EASING = "ease-in";

const lockScroll = () => {
	document.body.style.overflowY = "hidden";
};

const unlockScroll = () => {
	document.body.style.overflowY = "";
};

/**
 * Morphs `card` between `originRect` and its own natural layout box by
 * animating real left/top/width/height, not `transform`.
 *
 * A transform-based FLIP was tried first, but `transform` makes whichever
 * element it's applied to establish a new stacking context. Put directly on
 * the card, that trapped its own negative z-index offset-shadow
 * (.elevated-card's ::before/::after) behind its own opaque background;
 * moved to a wrapper instead, the shadow still rendered inconsistently once
 * the wrapper got GPU-composited for the animation. Animating layout
 * properties never creates a stacking context, so the shadow keeps painting
 * exactly as it does at rest, every frame, in either direction.
 */
const morphCard = (card, originRect, { reverse = false } = {}) => {
	const naturalRect = card.getBoundingClientRect();

	// Freeze the box in pixels so Tailwind's responsive width/min-height/
	// max-height classes can't fight the animated values.
	card.style.position = "fixed";
	card.style.margin = "0";
	card.style.minWidth = "0";
	card.style.minHeight = "0";
	card.style.maxWidth = "none";
	card.style.maxHeight = "none";

	const collapsed = {
		left: `${originRect.left}px`,
		top: `${originRect.top}px`,
		width: `${originRect.width}px`,
		height: `${originRect.height}px`
	};
	const expanded = {
		left: `${naturalRect.left}px`,
		top: `${naturalRect.top}px`,
		width: `${naturalRect.width}px`,
		height: `${naturalRect.height}px`
	};

	return card.animate(reverse ? [expanded, collapsed] : [collapsed, expanded], {
		duration: MORPH_DURATION,
		easing: MORPH_EASING,
		fill: "both"
	});
};

const resetCardStyles = (card) => {
	card.style.position = "";
	card.style.margin = "";
	card.style.minWidth = "";
	card.style.minHeight = "";
	card.style.maxWidth = "";
	card.style.maxHeight = "";
	card.style.left = "";
	card.style.top = "";
	card.style.width = "";
	card.style.height = "";
};

// .elevated-card-hoverable halves its offset-shadow on :hover/:active/
// :focus-visible (main.scss's elevated-pressed mixin) — if the origin card
// happened to be hovered or mid-press when clicked, its shadow at that exact
// moment is smaller than its resting size. Read the actual current size
// (::before's height, ::after's width) rather than assuming rest, and morph
// the dialog's own shadow from that to its natural size alongside the box.
const morphShadow = (innerCard, originVisibleCard, { reverse = false } = {}) => {
	try {
		const collapsedHeight = getComputedStyle(originVisibleCard, "::before").height;
		const collapsedWidth = getComputedStyle(originVisibleCard, "::after").width;
		const expandedHeight = getComputedStyle(innerCard, "::before").height;
		const expandedWidth = getComputedStyle(innerCard, "::after").width;

		const heightFrames = reverse
			? [{ height: expandedHeight }, { height: collapsedHeight }]
			: [{ height: collapsedHeight }, { height: expandedHeight }];
		const widthFrames = reverse
			? [{ width: expandedWidth }, { width: collapsedWidth }]
			: [{ width: collapsedWidth }, { width: expandedWidth }];

		return [
			innerCard.animate(heightFrames, {
				duration: MORPH_DURATION,
				easing: MORPH_EASING,
				fill: "both",
				pseudoElement: "::before"
			}),
			innerCard.animate(widthFrames, {
				duration: MORPH_DURATION,
				easing: MORPH_EASING,
				fill: "both",
				pseudoElement: "::after"
			})
		];
	} catch {
		return [];
	}
};

const fadeContent = (content, { reverse = false } = {}) => {
	if (!content) return null;
	const keyframes = reverse ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
	return content.animate(keyframes, { duration: MORPH_DURATION, easing: FADE_EASING, fill: "both" });
};

const fadeBackdrop = (backdrop, { reverse = false } = {}) => {
	if (!backdrop) return null;
	// Read the resting opacity from the stylesheet (Tailwind's opacity-50) so
	// handing off to it after cancel() is seamless instead of a visible jump.
	const restingOpacity = getComputedStyle(backdrop).opacity;
	const keyframes = reverse
		? [{ opacity: restingOpacity }, { opacity: 0 }]
		: [{ opacity: 0 }, { opacity: restingOpacity }];
	return backdrop.animate(keyframes, { duration: MORPH_DURATION, easing: FADE_EASING, fill: "both" });
};

// The dim + blur behind the dialog is the UA-generated ::backdrop pseudo-
// element (main.scss), separate from the gradient `.backdrop` div above.
// It has no box of its own to run a FLIP on, so just cross-fade its opacity —
// not all browsers support animating a pseudo-element, so this degrades to
// an instant show/hide rather than throwing.
const fadeNativeBackdrop = (dialog, { reverse = false } = {}) => {
	try {
		const keyframes = reverse ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1 }];
		return dialog.animate(keyframes, {
			duration: MORPH_DURATION,
			easing: FADE_EASING,
			fill: "both",
			pseudoElement: "::backdrop"
		});
	} catch {
		return null;
	}
};

const settle = (animation) => (animation ? animation.finished.catch(() => {}) : Promise.resolve());

// fill: "both" keeps an animation's last frame in effect, overriding the
// element's real styles, until it's explicitly canceled — an animation left
// uncanceled here would still be "holding" its old value the next time the
// dialog opens, fighting the new animation and corrupting it.
const runMorph = async (animations) => {
	await Promise.all(animations.map(settle));
	animations.forEach((a) => a && a.cancel());
};

// If a click fires again before the previous morph settled — a fast
// double-click, or open-then-immediately-close — the in-flight animation is
// still actively overriding the card's box. Measuring geometry mid-flight
// would capture that transitional box instead of the true resting one, so
// force any leftover animation on these targets to its end state first.
const settleImmediately = (targets) => {
	document.getAnimations().forEach((animation) => {
		const target = animation.effect && animation.effect.target;
		if (target && targets.includes(target)) {
			animation.finish();
			animation.cancel();
		}
	});
};

const handleOpenClicked = async (origin, dialog, slug) => {
	const card = dialog.querySelector(".dialog-morph-target");
	const content = dialog.querySelector(".dialog-morph-content");
	const backdrop = dialog.querySelector(".backdrop");
	settleImmediately([card, content, backdrop, dialog].filter(Boolean));
	// settleImmediately only cancels the animation; morphCard's own static
	// overrides (position: fixed, margin: 0, ...) are separate inline styles
	// that survive a cancel, which would leave an interrupted card stuck
	// position: fixed with no left/top/width/height — reset before re-measuring.
	if (card) resetCardStyles(card);

	const originRect = origin.getBoundingClientRect();

	history.replaceState({ dialog: { originid: origin.id, dialogid: dialog.id } }, "");
	history.pushState({ dialogOpen: true }, "", `#${slug}`);

	dialog.showModal();
	origin.classList.add("invisible");
	lockScroll();

	if (!card || prefersReducedMotion()) return;

	const originVisibleCard = origin.querySelector(".opendialog") ?? origin;
	const innerCard = card.querySelector(":scope > div");

	await runMorph([
		morphCard(card, originRect),
		...(innerCard ? morphShadow(innerCard, originVisibleCard) : []),
		fadeContent(content),
		fadeBackdrop(backdrop),
		fadeNativeBackdrop(dialog)
	]);
	resetCardStyles(card);
};

document.querySelectorAll(".opendialog").forEach((e) => {
	const origin = document.getElementById(e.getAttribute("data-origin"));
	const dialog = document.getElementById(e.getAttribute("data-dialog"));
	const slug = e.getAttribute("data-slug");

	dialog.addEventListener("close", () => {
		origin.classList.remove("invisible");
		unlockScroll();
		// Escape closes the dialog natively, without going through our handlers —
		// step back so the URL stops claiming a dialog is open.
		if (history.state?.dialogOpen) history.back();
	});

	e.addEventListener("click", (evt) => {
		if (evt.target.closest("a")) return;
		handleOpenClicked(origin, dialog, slug);
	});
	e.addEventListener("keydown", (event) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		// Let a nested link handle its own activation
		if (event.target.closest("a")) return;
		event.preventDefault();
		handleOpenClicked(origin, dialog, slug);
	});
});

const closeDialog = async (origin, dialog) => {
	const card = dialog.querySelector(".dialog-morph-target");
	const content = dialog.querySelector(".dialog-morph-content");
	const backdrop = dialog.querySelector(".backdrop");
	settleImmediately([card, content, backdrop, dialog].filter(Boolean));
	if (card) resetCardStyles(card);

	if (card && !prefersReducedMotion()) {
		const originRect = origin.getBoundingClientRect();
		const originVisibleCard = origin.querySelector(".opendialog") ?? origin;
		const innerCard = card.querySelector(":scope > div");

		await runMorph([
			morphCard(card, originRect, { reverse: true }),
			...(innerCard ? morphShadow(innerCard, originVisibleCard, { reverse: true }) : []),
			fadeContent(content, { reverse: true }),
			fadeBackdrop(backdrop, { reverse: true }),
			fadeNativeBackdrop(dialog, { reverse: true })
		]);
		resetCardStyles(card);
	}

	dialog.close();
	origin.classList.remove("invisible");
	unlockScroll();

	const opener = origin.querySelector(".opendialog") ?? origin;
	if (typeof opener.focus === "function") opener.focus();
};

const handleCloseClicked = async (origin, dialog) => {
	// The dialog pushed a history entry when it opened, so stepping back both
	// closes it and restores the previous URL. popstate does the closing.
	if (history.state?.dialogOpen) {
		history.back();
		return;
	}
	history.replaceState({}, "", "/");
	await closeDialog(origin, dialog);
};

document.querySelectorAll(".closedialog").forEach((e) => {
	const origin = document.getElementById(e.getAttribute("data-origin"));
	const dialog = document.getElementById(e.getAttribute("data-dialog"));

	// A single click listener: binding mousedown *and* touchstart fired twice per
	// tap on mobile, stepping the visitor two entries back through history.
	e.addEventListener("click", () => handleCloseClicked(origin, dialog));
});

onpopstate = async (event) => {
	if (!event.state || !event.state.dialog) return;
	const origin = document.getElementById(event.state.dialog.originid);
	const dialog = document.getElementById(event.state.dialog.dialogid);
	if (!origin || !dialog || !dialog.open) return;

	await closeDialog(origin, dialog);
};
