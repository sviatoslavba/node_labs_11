'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const petitionCreationLeave = document.querySelector('.btn.cansel-btn');
    if (petitionCreationLeave) {
        petitionCreationLeave.addEventListener('click', () => {
            window.location.replace('/');
        });
    }

    const petitionCreationForm = document.querySelector('.create-btn');
    if (petitionCreationForm) {
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

    const voteButtons = document.querySelectorAll(".btn.vote-btn");

    voteButtons.forEach(button => {
        button.addEventListener("click", async (event) => {
            const petitionId = event.target.dataset.petitionId;

            if (!petitionId) {
                console.error("Помилка: відсутній ID петиції");
                alert("Помилка: відсутній ID петиції");
                return;
            }

            try {
                const response = await fetch(`/api/petition-overview/${petitionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" }
                });

                console.log("Статус відповіді:", response.status);
                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    document.getElementById(`votes-${petitionId}`).innerText = result.petition_current;
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("Помилка:", error);
                alert("Щось пішло не так");
            }
        });
    });


    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const petitionCards = document.querySelectorAll('.petition-card');
        searchInput.addEventListener('keyup', (event) => {
            const searchIndex = searchInput.value.toLowerCase();
            petitionCards.forEach(card => {
                const title = card.querySelector("h3").textContent.toLowerCase();
                card.style.display = title.includes(searchIndex) ? "block" : "none";
            });
        });
    }
    const createBtn = document.querySelector(".btn.action-btn");
    if (createBtn) {
        createBtn.addEventListener("click", async (event) => {
            event.preventDefault();

            const title = document.getElementById("pet-title")?.value.trim();
            const text = document.getElementById("pet-text")?.value.trim();

            if (!title || !text) {
                alert("Заповніть всі поля!!");
                return;
            }

            const response = await fetch("/api/petition-creation", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({title, text})
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

    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", async () => {
            try {
                const response = await fetch("/logout", {
                    method: "GET",
                    credentials: "same-origin"
                });

                if (response.ok) {
                    window.location.href = "/login";
                } else {
                    alert("Помилка при виході. Спробуйте ще раз.");
                }
            } catch (error) {
                console.error("Помилка виходу:", error);
                alert("Виникла помилка. Перевірте з'єднання з сервером.");
            }
        });
    }

    async function checkAuth() {
        try {
            const response = await fetch("/check-auth", {
                method: "GET",
                credentials: "same-origin"
            });

            const data = await response.json();

            const logoutButton = document.getElementById("logout-btn");

            if (data.isAuthenticated) {
                // Якщо користувач авторизований, змінюємо текст на "Вийти"
                logoutButton.textContent = "Вийти";
                logoutButton.removeEventListener("click", loginHandler); // Видаляємо стару подію для входу
                logoutButton.addEventListener("click", logoutHandler);  // Додаємо нову подію для виходу
            } else {
                // Якщо користувач не авторизований, змінюємо текст на "Увійти"
                logoutButton.textContent = "Увійти";
                logoutButton.removeEventListener("click", logoutHandler); // Видаляємо стару подію для виходу
                logoutButton.addEventListener("click", loginHandler);  // Додаємо нову подію для входу
            }
        } catch (error) {
            console.error("Помилка при перевірці авторизації:", error);
        }
    }

    function loginHandler() {
        window.location.href = "/login"; // Перехід на сторінку логіну
    }

    async function logoutHandler() {
        try {
            const response = await fetch("/logout", {
                method: "GET",
                credentials: "same-origin"
            });

            if (response.ok) {
                // Якщо вийшли з акаунту, оновлюємо UI
                alert("Ви вийшли з акаунту!");
                checkAuth();  // Оновлюємо стан кнопки, змінивши її на "Увійти"
            } else {
                alert("Помилка при виході. Спробуйте ще раз.");
            }
        } catch (error) {
            console.error("Помилка виходу:", error);
            alert("Виникла помилка. Перевірте з'єднання з сервером.");
        }
    }

    checkAuth();


    const authForm = document.querySelector(".auth-form");
    if(authForm){
        authForm.addEventListener("submit", async (event) => {
            event.preventDefault()

            const username =document.getElementById("login").value.trim();
            const password =document.getElementById("password").value.trim();

            const response = await fetch("/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            });

            const data = await response.json();

            if(data.success){
            window.location.href = "/api/my-petitions";
            }
            else{
                alert(data.message);
            }
        });
    }

    const regForm = document.getElementById("register-form");
    if(regForm){
        regForm.addEventListener("submit", async (event) => {
            event.preventDefault()

            const username = document.getElementById("login").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirm-password").value;
            const message = document.getElementById("message");

            if (password !== confirmPassword) {
                message.textContent = " Паролі не співпадають!";
                message.style.color = "red";
                return;
            }

            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                message.textContent = " Реєстрація успішна! Перенаправлення...";
                message.style.color = "green";
                setTimeout(() => { window.location.href = "/login"; }, 2000);
            } else {
                message.textContent = " " + result.message;
                message.style.color = "red";
            }
        });
    }
});













