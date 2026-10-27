(() => {
    const image = document.getElementById('parallax');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let scheduled = false;
    function render() {
        scheduled = false;
        image.style.transform = reduced.matches ? 'none' : `translateY(${Math.min(scrollY, 600) * .17}px)`;
    }
    addEventListener('scroll', () => {
        if (!scheduled) { scheduled = true; requestAnimationFrame(render); }
    }, { passive: true });
    reduced.addEventListener('change', render);
})();
