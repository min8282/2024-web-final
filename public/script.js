document.addEventListener("DOMContentLoaded", function() {
    // 연락처 보기 모달
    var showContactButton = document.querySelector("#show-contact");
    var modal = document.querySelector("#contact-modal");
    var closeModal = document.querySelector(".close");

    if (showContactButton) {
        showContactButton.addEventListener("click", function() {
            modal.style.display = "block";
        });
    }

    if (closeModal) {
        closeModal.addEventListener("click", function() {
            modal.style.display = "none";
        });
    }

    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

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
