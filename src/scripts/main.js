const revealElements = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("reveal-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

revealElements.forEach((el) => revealObserver.observe(el));


const header = document.querySelector("header");
let lastScroll = 0;

window.addEventListener("scroll", () => {
  const current = window.scrollY;

  if (current > 60 && current > lastScroll) {
    header.classList.add("header-shrink");
  } else {
    header.classList.remove("header-shrink");
  }

  lastScroll = current;
});


const parallaxElements = document.querySelectorAll("[data-parallax]");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  parallaxElements.forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 0.3;
    el.style.transform = `translateY(${scrollY * speed}px)`;
  });
});

