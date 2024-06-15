document.addEventListener("DOMContentLoaded", function() {
    // 연락처 보기 모달
    var contactButton = document.querySelector("#show-contact");
    var modal = document.querySelector("#contact-modal");
    var modalContent = document.querySelector(".modal-content");
    var closeModal = document.querySelector(".close");

    if (contactButton && modal && modalContent && closeModal) {
        contactButton.addEventListener("click", function() {
            var userId = this.dataset.userId;

            fetch(`/users/${userId}/contact`)
                .then(response => response.json())
                .then(data => {
                    modalContent.innerHTML = `
                        <span class="close">&times;</span>
                        <h2>Contact Information</h2>
                        <p>이름: ${data.nick}</p>
                        <p>연락처: ${data.contact}</p>
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
    } else {
        console.error('One or more elements not found:', { contactButton, modal, modalContent, closeModal });
    }

    // 프로필 수정 폼 제출
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

    // Like button logic
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (button.disabled) return; // Prevent multiple clicks
            button.disabled = true; // Disable button to prevent multiple clicks

            const postId = button.dataset.postId;
            const isLiked = button.classList.contains('liked');

            try {
                let response;
                if (isLiked) {
                    response = await fetch(`/post/${postId}/unlike`, { method: 'DELETE' });
                    if (response.ok) {
                        button.classList.remove('liked');
                        button.textContent = '좋아요';
                        // 관심목록 페이지에서 좋아요 취소 후 게시글 제거
                        const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
                        if (postCard && window.location.pathname === '/favorites') {
                            postCard.remove();
                        }
                    } else {
                        const errorData = await response.json();
                        alert(errorData.message || '좋아요 취소 처리에 실패했습니다.');
                    }
                } else {
                    response = await fetch(`/post/${postId}/like`, { method: 'POST' });
                    if (response.ok) {
                        button.classList.add('liked');
                        button.textContent = '좋아요 취소';
                    } else {
                        const errorData = await response.json();
                        alert(errorData.message || '좋아요 처리에 실패했습니다.');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('좋아요 처리 중 오류가 발생했습니다.');
            } finally {
                button.disabled = false; // Re-enable button
            }
        });
    });
});
