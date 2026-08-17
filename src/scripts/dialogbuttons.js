const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Run a DOM update inside a view transition when the browser supports one and
 * the visitor has not asked for reduced motion.
 */
const withTransition = async (update) => {
	if (!document.startViewTransition || prefersReducedMotion()) {
		update();
		return;
	}
	const transition = document.startViewTransition(update);
	await transition.updateCallbackDone;
};

const lockScroll = () => {
	document.body.style.overflowY = "hidden";
};

const unlockScroll = () => {
	document.body.style.overflowY = "";
};

const showDialog = (origin, dialog) => {
	origin.style.viewTransitionName = "";
	dialog.showModal();
	origin.classList.add("invisible");
	lockScroll();
};

const handleOpenClicked = async (origin, dialog, slug) => {
	origin.style.viewTransitionName = "fullembed";
	history.replaceState({ dialog: { originid: origin.id, dialogid: dialog.id } }, "");
	history.pushState({ dialogOpen: true }, "", `#${slug}`);

	await withTransition(() => showDialog(origin, dialog));
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

const hideDialog = (origin, dialog) => {
	origin.style.viewTransitionName = "fullembed";
	// Un-hide before close() so the browser can restore focus to the opener
	origin.classList.remove("invisible");
	dialog.close();
};

const closeDialog = async (origin, dialog) => {
	await withTransition(() => hideDialog(origin, dialog));
	origin.style.viewTransitionName = "";

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
