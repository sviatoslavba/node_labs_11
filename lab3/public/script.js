'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const petitionCreationLeave = document.querySelector('.btn.cansel-btn');
    if(petitionCreationLeave) {
        petitionCreationLeave.addEventListener('click', () => {
            window.location.href = '/api/petitions';
        });
    }




    const petitionCreationForm = document.querySelector('.create-btn');
    if(petitionCreationForm) {
        petitionCreationForm.addEventListener('click', () => {
            window.location.href = '/api/petition-creation';
        })
    }

    const petitionDetails = document.querySelectorAll('.details-btn');

    petitionDetails.forEach(button => {
        button.addEventListener('click', (event) => {
            const petitionId = event.target.dataset.id;
            window.location.href = `/api/petition-overview/${petitionId}`;
        });
    });


    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const petitionCards = document.querySelectorAll('.petition-card');
        searchInput.addEventListener('input', (event) => {
            const searchIndex = searchInput.value.toLowerCase();
            petitionCards.forEach(card => {
                const title = card.querySelector("h3").textContent.toLowerCase();
                card.style.display = title.includes(searchIndex) ? "block" : "none";
            });
        });
    }
    const createBtn = document.querySelector(".btn.action-btn");
    if (createBtn) {
        createBtn.addEventListener("click", async(event) => {
            console.log("Кнопка натиснута");
            event.preventDefault();

            const title = document.getElementById("pet-title")?.value.trim();
            const text = document.getElementById("pet-text")?.value.trim();

            if (!title || !text) {
                alert("Заповніть всі поля!!");
                return;
            }

            const response = await fetch("/api/petition-creation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, text })
            });

            if (!response.ok) {
                alert("Сталася помилка! Перевірте консоль.");
                console.error(await response.text());
                return;
            }

            const result = await response.json();
            alert(`Петиція створена, її номер: ${result.data.petition.id}`);
        });
    }
})








