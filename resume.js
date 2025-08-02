async function updateVisitorCount() {
    const API_URL = 'https://{{API_URL}}/api/visitor_count';
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('count').textContent = data.count;
        } else {
            document.getElementById('count').textContent = 'Error loading count';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('count').textContent = 'Error loading count';
    }
}