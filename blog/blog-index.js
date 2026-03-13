async function loadPostList() {
    const listEl = document.getElementById('blog-post-list');

    try {
        const response = await fetch('posts/posts.json');

        if (!response.ok) {
            listEl.innerHTML = '<p>Unable to load posts.</p>';
            return;
        }

        const posts = await response.json();

        // Sort newest first by date
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (posts.length === 0) {
            listEl.innerHTML = '<p>No posts yet — check back soon!</p>';
            return;
        }

        listEl.innerHTML = posts.map(post => {
            const formattedDate = new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <article class="blog-post-card">
                    <h3><a href="post.html?post=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h3>
                    <div class="post-meta">
                        <span><i class="bi bi-calendar3"></i> ${formattedDate}</span>
                        <span><i class="bi bi-clock"></i> ${escapeHtml(post.readTime)}</span>
                    </div>
                    <p>${escapeHtml(post.summary)}</p>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading post list:', error);
        listEl.innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadPostList);