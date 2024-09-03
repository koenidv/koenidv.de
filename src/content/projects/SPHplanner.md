---
title: "Schulportal App"
slug: "sphplanner"
description: "The perfect companion for your life with Schulportal Hessen."
longDescription: "Native Android app for students to manage timetables and homework, chat with teachers, and much more."
image: "sphplanner.webp"
link: "https://github.com/koenidv/sph-planner"
tags: ["600+ Users", "Android", "Kotlin"  , "reverse-eng"]
date: "2021/01"
category: "tools"
---
<p>
  Schulportal App makes accessing Hesse's education portal a breeze. It allows students to
  manage timetables and homework, chat with teachers, and much more.
</p>
<div class="pt-4 pb-2 flex gap-2 flex-wrap">
  <div class="group">
    <a
      href="https://github.com/koenidv/sph-planner"
      target="_blank"
      class="inline-block elevated-card-hoverable elevated-1 h-8 w-fit">
      <div
        class="border-l-4 border-t-4 border-r-2 border-b-2 border-black h-full w-full flex items-center justify-center px-12">
        <p class="group-hover:underline underline-offset-[0.3rem] decoration-[0.125rem]">
          Code on GitHub
        </p>
      </div>
    </a>
  </div>
</div>
<div class="imagecarousel flex flex-row gap-2 overflow-x-scroll rounded">
  {
    [
      "Home Screen",
      "Home Screen",
      "Tasks",
      "Schedule Changes",
      "Messenger",
      "Class Summary",
      "Additional Features"
    ].map((description, index) => (
      <a
        target="_blank"
        class="transition-all duration-200 hover:saturate-100 lg:saturate-0"
        href={`/images/sphplanner/${index + 1}.png`}>
        <img
          class="max-h-[40vh] min-w-[7.5rem] rounded"
          src={`/images/sphplanner/${index + 1}.png`}
          loading="lazy"
          alt={`Screenshot from Schulportal App; ${description}`}
        />
      </a>
    ))
  }
</div>
<h2 class="text-3xl font-poppins pt-4">Motivation</h2>
<p>This is something I have yet to write.</p>
<h2 class="text-3xl font-poppins pt-4">Technology</h2>
<p>This is something I have yet to write.</p>
<h2 class="text-3xl font-poppins pt-4">Challenges</h2>
<p>This is something I have yet to write.</p>