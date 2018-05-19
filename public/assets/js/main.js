
//fkoe.org

window.onload = function () {
	refreshBackground();
	autosize($("textarea"));

	// For image lazy loading
	[].forEach.call(document.querySelectorAll('img[data-src]'), function (img) {
		img.setAttribute('src', img.getAttribute('data-src').replace("%w", img.offsetWidth));
		img.onload = function () {
			img.removeAttribute('data-src');
		};
	});
}

function fadeIn(element) {
	console.log(element);
	var op = 0;  // initial opacity
	var timer = setInterval(function () {
		if (op >= 1) {
			clearInterval(timer);
		}
		element.style.opacity = op;
		op += 0.05;
	}, 5);
}

function squashOut(element) {
	var h = element.offsetHeight;  // initial height
	var timer = setInterval(function () {
		if (h <= 0) {
			clearInterval(timer);
			element.classList.add("hidden");
		}
		element.style.height = h + "px";
		h -= 15;
	}, 1);
}

function refreshBackground() {
	var num = Math.ceil(Math.random() * 23);

	//No direct repeat
	while (num == localStorage.getItem("bg")) {
		var num = Math.ceil(Math.random() * 23);
	}

	//Check if background has been specified in URI
	if (!isNaN(dynamicContent) && dynamicContent != null) {
		num = dynamicContent;
	}

	//Save the background number to avoid direct repeat
	localStorage.setItem("bg", num);

	//document.getElementById("background").style.backgroundImage = "url(\"http://res.cloudinary.com/koenidv/image/upload/f_auto,q_auto/" + num + "\")";

	//Hide empty background
	document.getElementById("background").style.opacity = 0;
	//Wait for the background image to load
	$('<img/>').attr('src', 'https://res.cloudinary.com/koenidv/image/upload/f_auto,q_auto,w_' + document.body.offsetWidth + '/' + num + "").on('load', function () {
		$(this).remove();
		//Set background image (already loaded)
		$('#background').css('background-image', 'url(https://res.cloudinary.com/koenidv/image/upload/f_auto,q_auto,w_' + document.body.offsetWidth + '/' + num + "");
		//Fade background in
		fadeIn(document.getElementById("background"));
	});


}

function formsent() {
	//document.getElementById("contactform").classList.add("hidden");
	squashOut(document.getElementById("contactform"));
	document.getElementById("contactsubheader").innerHTML = "Your message has been sent!";
}


$.fn.moveIt = function () {
	var $window = $(window);
	var instances = [];

	$(this).each(function () {
		instances.push(new moveItItem($(this)));
	});

	window.addEventListener('scroll', function () {
		var scrollTop = $window.scrollTop();
		instances.forEach(function (inst) {
			inst.update(scrollTop);
		});
	}, { passive: true });
}

var moveItItem = function (el) {
	this.el = $(el);
	this.speed = parseFloat(this.el.attr('data-scroll-speed'));
};

moveItItem.prototype.update = function (scrollTop) {
	this.el.css('transform', 'translateY(' + -(scrollTop / this.speed) + 'px)');
};

// Scroll speed initialization
$(function () {
	$('[data-scroll-speed]').moveIt();
});

// Parse the URL parameter
function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}
// Give the parameter a variable name
var dynamicContent = getParameterByName('bg');


$(document).ready(function () {

	// Add smooth scrolling to all links
	$("a").on('click', function (event) {

		// Make sure this.hash has a value before overriding default behavior
		if (this.hash !== "") {
			// Prevent default anchor click behavior
			event.preventDefault();

			// Store hash
			var hash = this.hash;

			// Using jQuery's animate() method to add smooth page scroll
			// The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
			$('html, body').animate({
				scrollTop: $(hash).offset().top
			}, 800, function () {

				// Add hash (#) to URL when done scrolling (default click behavior)
				window.location.hash = hash;
			});
		} // End if
	});
});



/*
	Stellar by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function ($) {

	skel.breakpoints({
		xlarge: '(max-width: 1680px)',
		large: '(max-width: 1280px)',
		medium: '(max-width: 980px)',
		small: '(max-width: 736px)',
		xsmall: '(max-width: 480px)',
		xxsmall: '(max-width: 360px)'
	});

	$(function () {

		var $window = $(window),
			$body = $('body'),
			$main = $('#main');

		// Disable animations/transitions until the page has loaded.
		$body.addClass('is-loading');

		$window.on('load', function () {
			window.setTimeout(function () {
				$body.removeClass('is-loading');
			}, 100);
		});

		// Fix: Placeholder polyfill.
		$('form').placeholder();

		// Prioritize "important" elements on medium.
		skel.on('+medium -medium', function () {
			$.prioritize(
				'.important\\28 medium\\29',
				skel.breakpoint('medium').active
			);
		});

		// Nav.
		var $nav = $('#nav');

		if ($nav.length > 0) {

			// Shrink effect.
			$main
				.scrollex({
					mode: 'top',
					enter: function () {
						$nav.addClass('alt');
					},
					leave: function () {
						$nav.removeClass('alt');
					},
				});

			// Links.
			var $nav_a = $nav.find('a');

			$nav_a
				.scrolly({
					speed: 1000,
					offset: function () { return $nav.height(); }
				})
				.on('click', function () {

					var $this = $(this);

					// External link? Bail.
					if ($this.attr('href').charAt(0) != '#')
						return;

					// Deactivate all links.
					$nav_a
						.removeClass('active')
						.removeClass('active-locked');

					// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
					$this
						.addClass('active')
						.addClass('active-locked');

				})
				.each(function () {

					var $this = $(this),
						id = $this.attr('href'),
						$section = $(id);

					// No section for this link? Bail.
					if ($section.length < 1)
						return;

					// Scrollex.
					$section.scrollex({
						mode: 'middle',
						initialize: function () {

							// Deactivate section.
							if (skel.canUse('transition'))
								$section.addClass('inactive');

						},
						enter: function () {

							// Activate section.
							$section.removeClass('inactive');

							// No locked links? Deactivate all links and activate this section's one.
							if ($nav_a.filter('.active-locked').length == 0) {

								$nav_a.removeClass('active');
								$this.addClass('active');

							}

							// Otherwise, if this section's link is the one that's locked, unlock it.
							else if ($this.hasClass('active-locked'))
								$this.removeClass('active-locked');

						}
					});

				});

		}

		// Scrolly.
		$('.scrolly').scrolly({
			speed: 1000
		});

	});

})(jQuery);