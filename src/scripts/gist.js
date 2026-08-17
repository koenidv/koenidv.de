const CHECK_ICON = `
	<svg xmlns="http://www.w3.org/2000/svg" class="gist-copy-icon h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
		<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
	</svg>
`;

// GitHub's gist embed renders each line as its own cell rather than one
// text node, so plain textContent on the container would lose line breaks.
const collectCode = (container) => {
	const lines = container.querySelectorAll(".js-file-line");
	if (lines.length) return Array.from(lines).map((line) => line.textContent).join("\n");
	return container.textContent?.trim() ?? "";
};

document.querySelectorAll("[data-gist]").forEach((embed) => {
	const copyBtn = embed.querySelector(".gist-copy-btn");
	const toggleBtn = embed.querySelector(".gist-toggle-btn");
	const status = embed.querySelector('[role="status"]');

	if (copyBtn) {
		const label = copyBtn.querySelector(".gist-copy-label");
		const icon = copyBtn.querySelector(".gist-copy-icon");
		const originalIcon = icon?.outerHTML ?? "";
		let resetTimer;

		copyBtn.addEventListener("click", async () => {
			const container = document.getElementById(copyBtn.dataset.target);
			const code = container ? collectCode(container) : "";
			if (!code) return;

			try {
				if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
				await navigator.clipboard.writeText(code);
				if (label) label.textContent = "Copied!";
				if (icon) icon.outerHTML = CHECK_ICON;
				if (status) status.textContent = "Code copied to clipboard";
			} catch {
				// No blocking prompt — just say so, same as the success state
				if (status) status.textContent = "Couldn't copy the code automatically";
			}

			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => {
				if (label) label.textContent = "Copy";
				const currentIcon = copyBtn.querySelector(".gist-copy-icon");
				if (currentIcon) currentIcon.outerHTML = originalIcon;
				if (status) status.textContent = "";
			}, 2000);
		});
	}

	if (toggleBtn) {
		const collapse = document.getElementById(toggleBtn.dataset.target);
		if (collapse) {
			toggleBtn.addEventListener("click", () => {
				const expanded = collapse.classList.toggle("gist-expanded");
				toggleBtn.textContent = expanded ? "Show less" : "Show more";
				toggleBtn.setAttribute("aria-expanded", String(expanded));
			});
		}
	}
});
