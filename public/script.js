document.addEventListener("DOMContentLoaded", function() {
    var contactButtons = document.querySelectorAll(".contact-btn");
    var modal = document.querySelector("#contactModal");
    var modalContent = document.querySelector(".modal-content");
    var closeModal = document.querySelector(".close");

    contactButtons.forEach(function(button) {
        button.addEventListener("click", function() {
            var userId = this.dataset.userId;

            fetch(`/users/${userId}/contact`)
                .then(response => response.json())
                .then(data => {
                    modalContent.innerHTML = `
                        <span class="close">&times;</span>
                        <h2>Contact Information</h2>
                        <p>Name: ${data.nick}</p>
                        <p>Phone: ${data.phone}</p>
                    `;
                    modal.style.display = "block";

                    var close = document.querySelector(".close");
                    close.onclick = function() {
                        modal.style.display = "none";
                    }

                    window.onclick = function(event) {
                        if (event.target == modal) {
                            modal.style.display = "none";
                        }
                    }
                })
                .catch(error => console.error('Error:', error));
        });
    });

    const editProfileForm = document.querySelector('#edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(editProfileForm);
            fetch(editProfileForm.action, {
                method: editProfileForm.method,
                body: formData,
            })
            .then((response) => response.text())
            .then((data) => {
                alert('수정이 완료되었습니다.');
                window.location.href = '/mypage';
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('수정 중 오류가 발생했습니다.');
            });
        });
    }
});
