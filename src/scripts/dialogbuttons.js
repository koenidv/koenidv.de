const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MORPH_DURATION = 220;
// A snappier decelerate than the CSS "ease-out" keyword — fast out of the
// gate, gentle settle. Common choice for this kind of box/scale morph.
const MORPH_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

const lockScroll = () => {
	document.body.style.overflowY = "hidden";
};

const unlockScroll = () => {
	document.body.style.overflowY = "";
};

/**
 * A manual FLIP transform: the string that, applied to an element naturally
 * laid out as `toRect`, makes it visually occupy `fromRect` instead.
 *
 * Chrome's built-in View Transitions API was tried here first, but its
 * shared-element morph doesn't reliably animate size for a <dialog> — the
 * dialog's own top-layer promotion appears to race the transition snapshot,
 * so the box always renders at its final size while only position moved.
 * Driving the same box+scale morph by hand with the Web Animations API sidesteps
 * that entirely and behaves identically across browsers.
 */
const invertTransform = (fromRect, toRect) => {
	const dx = fromRect.left - toRect.left;
	const dy = fromRect.top - toRect.top;
	const sx = fromRect.width / toRect.width;
	const sy = fromRect.height / toRect.height;
	return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
};

const morphCard = (card, fromRect, toRect, { reverse = false } = {}) => {
	const invert = invertTransform(fromRect, toRect);
	card.style.transformOrigin = "top left";
	const keyframes = reverse
		? [{ transform: "none" }, { transform: invert }]
		: [{ transform: invert }, { transform: "none" }];
	return card.animate(keyframes, { duration: MORPH_DURATION, easing: MORPH_EASING, fill: "both" });
};

const fadeContent = (content, { reverse = false } = {}) => {
	if (!content) return null;
	const keyframes = reverse
		? [{ opacity: 1, offset: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 0, offset: 1 }]
		: [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1, offset: 1 }];
	return content.animate(keyframes, { duration: MORPH_DURATION, easing: MORPH_EASING, fill: "both" });
};

const fadeBackdrop = (backdrop, { reverse = false } = {}) => {
	if (!backdrop) return null;
	// Read the resting opacity from the stylesheet (Tailwind's opacity-50) so
	// handing off to it after cancel() is seamless instead of a visible jump.
	const restingOpacity = getComputedStyle(backdrop).opacity;
	const keyframes = reverse
		? [{ opacity: restingOpacity }, { opacity: 0 }]
		: [{ opacity: 0 }, { opacity: restingOpacity }];
	return backdrop.animate(keyframes, { duration: MORPH_DURATION, easing: MORPH_EASING, fill: "both" });
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
			easing: MORPH_EASING,
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
// uncanceled here would still be "holding" its old transform/opacity the next
// time the dialog opens, fighting the new animation and corrupting it.
const runMorph = async (animations) => {
	await Promise.all(animations.map(settle));
	animations.forEach((a) => a && a.cancel());
};

const handleOpenClicked = async (origin, dialog, slug) => {
	const originRect = origin.getBoundingClientRect();

	history.replaceState({ dialog: { originid: origin.id, dialogid: dialog.id } }, "");
	history.pushState({ dialogOpen: true }, "", `#${slug}`);

	dialog.showModal();
	origin.classList.add("invisible");
	lockScroll();

	const card = dialog.querySelector(".dialog-morph-target");
	const content = dialog.querySelector(".dialog-morph-content");
	const backdrop = dialog.querySelector(".backdrop");
	if (!card || prefersReducedMotion()) return;

	const cardRect = card.getBoundingClientRect();
	await runMorph([
		morphCard(card, originRect, cardRect),
		fadeContent(content),
		fadeBackdrop(backdrop),
		fadeNativeBackdrop(dialog)
	]);
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

	if (card && !prefersReducedMotion()) {
		const cardRect = card.getBoundingClientRect();
		const originRect = origin.getBoundingClientRect();
		await runMorph([
			morphCard(card, originRect, cardRect, { reverse: true }),
			fadeContent(content, { reverse: true }),
			fadeBackdrop(backdrop, { reverse: true }),
			fadeNativeBackdrop(dialog, { reverse: true })
		]);
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
