import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

// Sanitize the post slug to prevent path traversal
function getPostSlug() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('post');

    if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
        return null;
    }
    return slug;
}

async function loadPost() {
    const contentEl = document.getElementById('blog-content');
    const slug = getPostSlug();

    if (!slug) {
        contentEl.innerHTML = '<h2>Post not found</h2><p>Return to the <a href="index.html">blog index</a>.</p>';
        return;
    }

    try {
        const response = await fetch(`posts/${slug}.md`);

        if (!response.ok) {
            contentEl.innerHTML = '<h2>Post not found</h2><p>Return to the <a href="index.html">blog index</a>.</p>';
            return;
        }

        const markdown = await response.text();
        contentEl.innerHTML = marked.parse(markdown);

        // Update page title from the first h1
        const firstH1 = contentEl.querySelector('h1');
        if (firstH1) {
            document.title = `${firstH1.textContent} - Jeremy Hessig`;
        }
    } catch (error) {
        console.error('Error loading post:', error);
        contentEl.innerHTML = '<h2>Error loading post</h2><p>Please try again later.</p>';
    }
}

loadPost();