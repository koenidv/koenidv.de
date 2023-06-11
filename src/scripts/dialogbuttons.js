const showDialog = (origin, dialog) => {
	origin.style.viewTransitionName = "";
	dialog.showModal();
	origin.classList.add("invisible");
	document.body.style.overflowY = "hidden";
	document.body.style.top = `-${scroll}px`;
	// Disable scrolling: https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
};

const handleOpenClicked = async (origin, dialog) => {
	origin.style.viewTransitionName = "fullembed";
	const scroll = window.scrollY;
	if (!document.startViewTransition) {
		showDialog(origin, dialog);
		return;
	}

	document.startViewTransition(() => {
		showDialog(origin, dialog);
	});
};

document.querySelectorAll(".opendialog").forEach((e) => {
	const origin = document.getElementById(e.getAttribute("data-origin"));
	const dialog = document.getElementById(e.getAttribute("data-dialog"));

	dialog.addEventListener("close", (event) => {
		origin.classList.remove("invisible");
		document.body.style.overflowY = "";
		document.body.style.top = "";
	});

	e.addEventListener("click", () => handleOpenClicked(origin, dialog));
	e.addEventListener("keydown", (event) => {
		if (event.keyCode !== 13) return;
		handleOpenClicked(origin, dialog);
	});
});

const hideDialog = (origin, dialog) => {
	origin.style.viewTransitionName = "fullembed";
	dialog.close();
	origin.classList.remove("invisible");
};

const handleCloseClicked = async (origin, dialog) => {
	if (!document.startViewTransition) {
		hideDialog(origin, dialog);
		return;
	}

	const transaction = document.startViewTransition(() => {
		hideDialog(origin, dialog);
	});
	await transaction.updateCallbackDone;
	origin.style.viewTransitionName = "";
};

document.querySelectorAll(".closedialog").forEach((e) => {
	const origin = document.getElementById(e.getAttribute("data-origin"));
	const dialog = document.getElementById(e.getAttribute("data-dialog"));

	e.addEventListener("mousedown", () => handleCloseClicked(origin, dialog));
	e.addEventListener("touchstart", () => handleCloseClicked(origin, dialog));
	e.addEventListener("keydown", (event) => {
		if (event.keyCode !== 13) return;
		handleCloseClicked(origin, dialog);
	});
});
