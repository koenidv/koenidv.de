---
title: "MelodyMates"
description: "Social network for young music lovers."
image: "/images/melodymates.webp"
link: "https://melodymates.app"
tags: ["Fauna", "Deno", "Flutter", "SvelteKit"]
date: "2023/03"
color: "#f1f6b7"
category: "people"
---

<p>
	MelodyMates is a social network for young music lovers.
	<br />
	Sign up with Spotify, share the songs you love, and discover what your friends are recommending.
</p>
<div class="flex flex-wrap gap-2 pb-2 pt-4">
	<a
		href="https://melodymates.app"
		target="_blank"
		class="elevated-card-hoverable elevated-1 group inline-block h-8 w-fit">
		<div class="flex h-full w-full items-center justify-center border-b-2 border-l-4 border-r-2 border-t-4 border-black px-12">
			<p class="decoration-[0.125rem] underline-offset-[0.3rem] group-hover:underline">
				Try it now
			</p>
		</div>
	</a>
	<a
		href="https://github.com/koenidv/melodymates"
		target="_blank"
		class="elevated-card-hoverable elevated-1 group inline-block h-8 w-fit">
		<div class="flex h-full w-full items-center justify-center border-b-2 border-l-4 border-r-2 border-t-4 border-black px-12">
			<p class="decoration-[0.125rem] underline-offset-[0.3rem] group-hover:underline">
				Code on GitHub
			</p>
		</div>
	</a>
</div>
<div class="imagecarousel flex flex-row gap-2 overflow-x-scroll rounded">
	<a
		target="_blank"
		class="transition-all duration-200 hover:saturate-100 lg:saturate-0"
		href="https://user-images.githubusercontent.com/32238636/234383204-cfd9e5fe-743f-45ee-b054-9dac9ad465cc.png">
		<img
			class="max-h-[40vh] min-w-[7.5rem] rounded"
			src="https://user-images.githubusercontent.com/32238636/234383204-cfd9e5fe-743f-45ee-b054-9dac9ad465cc.png"
		/>
	</a>
	<a
		target="_blank"
		class="transition-all duration-200 hover:saturate-100 lg:saturate-0"
		href="https://user-images.githubusercontent.com/32238636/234383213-91b8f412-c4a7-45c8-910a-bc2a939c4678.png">
		<img
			class="max-h-[40vh] min-w-[7.5rem] rounded"
			src="https://user-images.githubusercontent.com/32238636/234383213-91b8f412-c4a7-45c8-910a-bc2a939c4678.png"
		/>
	</a>
	<a
		target="_blank"
		class="transition-all duration-200 hover:saturate-100 lg:saturate-0"
		href="https://user-images.githubusercontent.com/32238636/234383226-4699cbfa-1de5-4492-977b-520345ba5058.png">
		<img
			class="max-h-[40vh] min-w-[7.5rem] rounded"
			src="https://user-images.githubusercontent.com/32238636/234383226-4699cbfa-1de5-4492-977b-520345ba5058.png"
		/>
	</a>
	<a
		target="_blank"
		class="transition-all duration-200 hover:saturate-100 lg:saturate-0"
		href="https://user-images.githubusercontent.com/32238636/234383242-daef942c-f03a-4a4f-bd77-ea3a1990e80c.png">
		<img
			class="max-h-[40vh] min-w-[7.5rem] rounded"
			src="https://user-images.githubusercontent.com/32238636/234383242-daef942c-f03a-4a4f-bd77-ea3a1990e80c.png"
		/>
	</a>
</div>
<h2 class="pt-4 font-poppins text-3xl">Motivation</h2>
<p>
	I often find great new songs that I want to show my friends. What I used to was sending them
	Spotify links on messengers. However, this was not only a bad user experience, I also had to send
	it to multiple people individually. Receiving links without a rich preview also meant having to
	play a song first to see what it was about. Lastly, this broke as soon as a friend was using a
	different streaming service.
</p>
<p>
	Thus was born the idea to build a platform where friends can connect to discover awesome music.
	MelodyMates can connect to different music streaming services, and will always show information
	about shared songs. Furthermore, friends can react and reply to express their feelings about a
	song.
</p>
<h2 class="pt-4 font-poppins text-3xl">Connecting Humans</h2>
<p>
	Like many of my projects, MelodyMates is all about fostering meaningful connectings between
	humans. Communally liked music can contribute to deepening the social connection people feel,
	exploring more similarities.
	<a
		class="bg-[#e8e7ed] decoration-[0.125rem] underline-offset-[0.3rem] hover:underline"
		href="https://www.semanticscholar.org/paper/Cultural-Familiarity-and-Individual-Musical-Taste-Stupacher-Witek/77fdaab24703432b2891f1fb8db30fa34830f690">
		Stupacher et al. (2020)
	</a>, for example, found that "the social context provided by music can strengthen interpersonal closeness
	by increasing temporal and affective self-other overlaps".
</p>
<h2 class="pt-4 font-poppins text-3xl">Technology</h2>
<p>
	I wanted to use this project to experiment with new technologies. Most of MelodyMate's backend is
	running on the API layer on top of the database utilized, Fauna. This includes attribute-based
	access control, database functions, and more. The client accesses this through a GraphQL endpoint.
</p>
<p>
	This client is built on SvelteKit for the Web and being built on Flutter for mobile. It directly
	communicates with the Spotify API, and eventually, the Apple Music API. This minimizes private
	user data handling on the server side.
</p>
<p>
	Furthermore, I have built a custom authentication solution, running on Google Cloud Run. It
	generates asynchronous JWTs based on a user's authenticated music service access. This token can
	be independently validated on Fauna.
</p>
<div class="flex flex-row gap-2 overflow-x-scroll">
	<a
		target="_blank"
		class="transition-all duration-200 hover:saturate-100 lg:saturate-0"
		href="https://user-images.githubusercontent.com/32238636/234679138-054267b9-162f-4359-8f8a-b34eb024165d.png">
		<img
			class="max-h-[40vh] rounded"
			src="https://user-images.githubusercontent.com/32238636/234679138-054267b9-162f-4359-8f8a-b34eb024165d.png"
		/>
	</a>
</div>
<h2 class="pt-4 font-poppins text-3xl">Challenges</h2>
<p>This is something I have yet to write.</p>
