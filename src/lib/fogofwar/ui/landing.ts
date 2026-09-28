export function renderLanding(container: HTMLElement): {
	dropZone: HTMLElement;
	fileInput: HTMLInputElement;
	progressEl: HTMLElement;
	progressBar: HTMLElement;
	progressText: HTMLElement;
	statusMessage: HTMLElement;
} {
	container.innerHTML = `
		<div class="max-w-2xl w-full mx-4 my-8 p-6 sm:p-8 bg-beige-100 border-l-4 border-t-4 border-r-2 border-b-2 border-black elevated-card elevated-2">
			<div class="flex items-center justify-between mb-4">
				<h1 class="text-3xl sm:text-4xl font-poppins font-black tracking-wider text-[#131218] uppercase">
					Fog of War
				</h1>
				<span class="bg-mojito-500 text-black text-xs font-mono font-bold px-2 py-1 border border-black">
					100% Client-Side
				</span>
			</div>

			<p class="text-base text-[#131218] font-roboto font-semibold mb-6 leading-relaxed">
				Explore everywhere you've ever set foot. The world starts under thick drifting fog, revealing roads, cities, and journeys as you uncover your past.
			</p>

			<div class="mb-6 p-3 bg-white/70 border-l-4 border-black text-sm text-[#131218]">
				<span class="font-bold">Privacy guarantee:</span> All parsing and rendering happens locally in your browser. Your location history is never uploaded or sent to any server.
			</div>

			<div id="landing-dropzone" class="border-2 border-dashed border-black hover:border-black bg-white/50 p-8 text-center cursor-pointer transition-colors mb-6 group">
				<input type="file" id="landing-file-input" class="hidden" accept=".json,.zip" />
				<div class="w-12 h-12 mx-auto mb-3 text-black">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
					</svg>
				</div>
				<p class="font-poppins font-black text-lg text-[#131218] mb-1">
					Drop your Timeline export here
				</p>
				<p class="text-xs text-gray-600 mb-4 font-mono">
					Accepts <span class="font-bold">Zeitachse.json</span>, <span class="font-bold">Records.json</span>, or Takeout ZIP
				</p>
				<div class="group inline-block">
					<div class="elevated-card-hoverable elevated-1">
						<button type="button" class="inline-block bg-mojito-500 hover:bg-[#b0f550] text-black font-poppins font-black text-sm px-6 py-2 border-l-4 border-t-4 border-r-2 border-b-2 border-black">
							<span class="group-hover:underline underline-offset-[0.3rem] decoration-[0.125rem]">Select File</span>
						</button>
					</div>
				</div>
			</div>

			<div id="landing-progress-container" class="hidden mb-6 p-4 bg-white border-2 border-black">
				<div class="flex justify-between text-xs font-mono mb-2">
					<span id="landing-progress-text" class="font-bold">Processing...</span>
				</div>
				<div class="w-full bg-gray-200 h-3 border border-black overflow-hidden">
					<div id="landing-progress-bar" class="bg-mojito-500 h-full w-0 transition-all duration-150"></div>
				</div>
			</div>

			<div id="landing-status-message" class="hidden mb-6 p-4 border-2 border-black text-sm font-semibold"></div>

			<div class="border-t-2 border-black/20 pt-6">
				<h2 class="text-sm font-poppins font-black tracking-wider uppercase mb-3 text-[#131218]">
					How to get your Timeline data
				</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-roboto">
					<div class="p-3 bg-white/40 border border-black">
						<span class="font-bold block mb-1 font-poppins">Android (On-Device Export):</span>
						Settings → Location → Location Services → Timeline → Export Timeline data. This yields <code class="font-mono bg-white px-1">Zeitachse.json</code>.
					</div>
					<div class="p-3 bg-white/40 border border-black">
						<span class="font-bold block mb-1 font-poppins">iOS / Google Maps:</span>
						Google Maps app → Profile Picture → Your Timeline → Settings → Export Timeline data. (Or refer to <a href="https://support.google.com/maps/answer/6258979" target="_blank" rel="noopener" class="underline font-bold">Google Help</a>).
					</div>
				</div>

				<div class="mt-4 p-3 bg-lavender-200/50 border border-black text-xs">
					<span class="font-bold">Google Takeout Notice:</span> If on-device encrypted backups are enabled in Google Maps, Takeout exports will only contain <code class="font-mono bg-white px-1">Settings.json</code> and <code class="font-mono bg-white px-1">Encrypted Backups.txt</code> without your coordinates. Use the on-device export inside the Google Maps app instead.
				</div>
			</div>
		</div>
	`;

	const dropZone = container.querySelector("#landing-dropzone") as HTMLElement;
	const fileInput = container.querySelector("#landing-file-input") as HTMLInputElement;
	const progressEl = container.querySelector("#landing-progress-container") as HTMLElement;
	const progressBar = container.querySelector("#landing-progress-bar") as HTMLElement;
	const progressText = container.querySelector("#landing-progress-text") as HTMLElement;
	const statusMessage = container.querySelector("#landing-status-message") as HTMLElement;

	dropZone.addEventListener("click", () => fileInput.click());

	return {
		dropZone,
		fileInput,
		progressEl,
		progressBar,
		progressText,
		statusMessage
	};
}
