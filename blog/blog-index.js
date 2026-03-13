const RECENT_POST_COUNT = 2;

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

        const recentPosts = posts.slice(0, RECENT_POST_COUNT);
        const archivedPosts = posts.slice(RECENT_POST_COUNT);

        let html = recentPosts.map(renderPostCard).join('');

        if (archivedPosts.length > 0) {
            html += renderArchive(archivedPosts);
        }

        listEl.innerHTML = html;

    } catch (error) {
        console.error('Error loading post list:', error);
        listEl.innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
}

function renderPostCard(post) {
    const formattedDate = formatDate(post.date);

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
}

function renderArchive(posts) {
    // Group posts by year
    const byYear = {};
    for (const post of posts) {
        const year = post.date.substring(0, 4);
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(post);
    }

    // Build year sections, newest year first
    const years = Object.keys(byYear).sort((a, b) => b - a);

    const archiveItems = years.map(year => {
        const items = byYear[year].map(post => {
            const formattedDate = formatDate(post.date);
            return `
                <li class="archive-item">
                    <a href="post.html?post=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
                    <span class="archive-date">${formattedDate}</span>
                </li>
            `;
        }).join('');

        return `
            <h4 class="archive-year">${year}</h4>
            <ul class="archive-list">${items}</ul>
        `;
    }).join('');

    return `
        <div class="blog-archive">
            <button class="archive-toggle" onclick="this.parentElement.classList.toggle('open')">
                <i class="bi bi-archive"></i> Archive (${posts.length} older post${posts.length === 1 ? '' : 's'})
                <i class="bi bi-chevron-down archive-chevron"></i>
            </button>
            <div class="archive-content">
                ${archiveItems}
            </div>
        </div>
    `;
}

function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', loadPostList);