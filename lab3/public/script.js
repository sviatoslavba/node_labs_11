document.querySelector('.create-btn').addEventListener('click', () => {
    window.location.href = '/api/petition-creation';
});


document.querySelectorAll('.details-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        const petitionId = event.target.dataset.id;
        window.location.href = `/api/petition-overview/${petitionId}`;

    });
});