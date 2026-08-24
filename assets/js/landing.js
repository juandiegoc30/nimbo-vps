// Revelado al hacer scroll para la landing. Mejora progresiva:
// sin JS, o con movimiento reducido, todo queda visible por defecto.
(function () {
  // El navegador suele restaurar el scroll después de recargar. En una
  // landing con contenido revelado esto puede aplicar correcciones sucesivas
  // y hacer que la página parezca bajar un poco con cada actualización.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function resetScrollAfterLoad() {
    if (window.location.hash) return;
    var root = document.scrollingElement || document.documentElement;
    root.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  resetScrollAfterLoad();
  window.addEventListener("pageshow", resetScrollAfterLoad);

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  document.body.classList.add("reveal-on");

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(function (el) {
    io.observe(el);
  });
})();
