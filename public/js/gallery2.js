let currentIndex = 0;
const container = document.querySelector(".gallery-container");
const display = document.getElementById("gallery-display");

const items = JSON.parse(container.getAttribute("data-items"));

function showItem(index) {
    const item = items[index];
    if (!item) return;

    if (item.type === "img") {
        display.innerHTML = `<img src="${item.src}" alt="gallery item">`;
    } else if (item.type === "video") {
        display.innerHTML = `
        <video controls>
            <source src="${item.src}" type="video/mp4">
            Your browser does not support the video tag.
        </video>`;
    }
}

function prevImage() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    showItem(currentIndex);
}

function nextImage() {
    currentIndex = (currentIndex + 1) % items.length;
    showItem(currentIndex);
}

// attach events
document.getElementById("prev-btn").addEventListener("click", prevImage);
document.getElementById("next-btn").addEventListener("click", nextImage);

function renderGallery() {
    if (window.innerWidth <= 954) {
        // mobile → render all items
        display.innerHTML = items.map(item => {
            if (item.type === "img") {
                return `<img src="${item.src}" alt="gallery item">`;
            } else if (item.type === "video") {
                return `<video controls>
                    <source src="${item.src}" type="video/mp4">
                    Your browser does not support video.
                </video>`;
            }
        }).join("");
    } else {
        // desktop → render only current item
        showItem(currentIndex);
    }
}

// ✅ Run once when page loads
renderGallery();

// ✅ Update on window resize (switch between layouts)
window.addEventListener("resize", renderGallery);
