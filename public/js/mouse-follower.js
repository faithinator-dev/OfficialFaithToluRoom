const follower = document.querySelector('.mouse-follower');
let currentHighlighted = null;

document.addEventListener('mousemove', (e) => {
    // Update the position of the follower based on mouse coordinates
    follower.style.left = `${e.clientX}px`;
    follower.style.top = `${e.clientY}px`;

    const element = document.elementFromPoint(e.clientX, e.clientY);

    if (element) {
        const isTextElement = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI'].includes(element.tagName);
        
        if (isTextElement) {
            if (currentHighlighted && currentHighlighted !== element) {
                currentHighlighted.classList.remove('text-highlight');
            }
            element.classList.add('text-highlight');
            currentHighlighted = element;
        } else {
            if (currentHighlighted) {
                currentHighlighted.classList.remove('text-highlight');
                currentHighlighted = null;
            }
        }
    } else {
        if (currentHighlighted) {
            currentHighlighted.classList.remove('text-highlight');
            currentHighlighted = null;
        }
    }
});
