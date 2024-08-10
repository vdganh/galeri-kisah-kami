document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav ul li a');
    const contents = document.querySelectorAll('.content');
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const photoGallery = document.getElementById('photoGallery');
    const favoriteGallery = document.getElementById('favoriteGallery');
    const deleteGallery = document.getElementById('deleteGallery');
    const trash = document.getElementById('trash');
    const homeTab = document.getElementById('home');

    const securityCode = '260823'; // Security code
    let attempts = 0;
    let isLocked = false;

    // Navigation link click event
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            if (targetId === 'upload') {
                if (isLocked) {
                    showPenaltyAlert();
                    navigateToHome();
                    return;
                }
                requestSecurityCode();
            } else {
                showContent(targetId);
            }
        });
    });

    function showContent(targetId) {
        contents.forEach(content => {
            content.classList.remove('active');
            if (content.id === targetId) {
                content.classList.add('active');
            }
        });
        if (targetId === 'delete') {
            loadDeleteGallery();
        }
    }

    function showAlert(message, type = 'success') {
        const customAlert = document.getElementById('customAlert');
        const alertMessage = document.getElementById('alertMessage');
        const alertContent = document.querySelector('.alert-content');

        alertMessage.innerText = message;
        alertContent.className = 'alert-content'; // Reset the class
        alertContent.classList.add(type); // Add the success/error class
        customAlert.classList.add('show');
        customAlert.style.display = 'flex';

        // Close the alert when the close button is clicked
        document.querySelector('.close-alert').onclick = () => {
            customAlert.classList.remove('show');
            customAlert.style.display = 'none';
        };
    }

    function requestSecurityCode() {
        const securityModal = document.getElementById('securityModal');
        const securityCodeInput = document.getElementById('securityCodeInput');
        const submitCodeButton = document.getElementById('submitCodeButton');
        const attemptMessage = document.getElementById('attemptMessage');

        securityModal.style.display = 'block';

        submitCodeButton.onclick = function () {
            const inputCode = securityCodeInput.value;
            if (inputCode === securityCode) {
                attempts = 0;
                securityModal.style.display = 'none';
                securityCodeInput.value = '';
                navigateToUpload();
            } else {
                handleFailedAttempt(attemptMessage);
            }
        };

        document.getElementById('modalClose').onclick = function () {
            securityModal.style.display = 'none';
        };
    }

    function handleFailedAttempt(attemptMessage) {
        attempts++;
        attemptMessage.innerText = `Kode salah. Anda telah mencoba sebanyak ${attempts} kali.`;
        if (attempts >= 3) {
            showAlert('Terlalu banyak percobaan yang salah. Anda akan diblokir selama 5 menit.', 'error');
            isLocked = true;
            setTimeout(() => {
                isLocked = false;
                showAlert('Anda sekarang dapat mencoba lagi.', 'success');
            }, 5 * 60 * 1000); // 5 minutes
            navigateToHome();
        }
    }

    function navigateToUpload() {
        showContent('upload');
        loadFromLocalStorage(); // Load photos from local storage
    }

    function navigateToHome() {
        showContent('home');
    }

    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        const description = descriptionInput.value;
        const date = dateInput.value;
        if (file && description && date) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const photoCard = createPhotoCard(e.target.result, description, date);
                photoGallery.appendChild(photoCard);
                saveToLocalStorage();
                fileInput.value = '';
                descriptionInput.value = '';
                dateInput.value = '';
            };
            reader.readAsDataURL(file);
        } else {
            showAlert('Mohon masukkan foto, deskripsi, dan tanggal.', 'error');
        }
    });

    photoGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            openModal(event.target);
        }
    });

    deleteGallery.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            const photoCard = event.target.parentElement;
            photoCard.classList.toggle('selected');
            updateTrashVisibility();
        }
    });

    trash.addEventListener('click', () => {
        const selectedPhotos = deleteGallery.querySelectorAll('.selected');
        if (selectedPhotos.length === 0) {
            showAlert("Tidak ada foto yang dipilih untuk dihapus.", 'error');
            return;
        }
        selectedPhotos.forEach(photo => {
            const imgSrc = photo.querySelector('img').src;
            photo.classList.add('fade-out');
            photo.addEventListener('animationend', () => {
                photo.remove();
                removePhotoFromLocalStorage(imgSrc);
                loadDeleteGallery();
            });
        });
        updateTrashVisibility();
    });

    function updateTrashVisibility() {
        const selectedPhotos = deleteGallery.querySelectorAll('.selected');
        trash.classList.toggle('active', selectedPhotos.length > 0);
    }

    function loadDeleteGallery() {
        deleteGallery.innerHTML = '';
        const galleryData = JSON.parse(localStorage.getItem('galleryData')) || [];
        galleryData.forEach(data => {
            const photoCard = document.createElement('div');
            photoCard.classList.add('photo-card');
            photoCard.innerHTML = `<img src="${data.imgSrc}" alt="Foto">`;
            deleteGallery.appendChild(photoCard);
        });
        updateTrashVisibility();
    }

    function openModal(image) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const captionText = document.getElementById('caption');
        const description = image.nextElementSibling.innerText;
        const date = image.nextElementSibling.nextElementSibling.innerText;

        modal.style.display = 'block';
        modalImage.src = image.src;
        captionText.innerHTML = `<strong>Deskripsi:</strong> ${description}<br><strong>Tanggal:</strong> ${date}`;

        const closeModal = document.getElementById('modalClose');
        closeModal.onclick = function () {
            modal.style.display = 'none';
        };
    }

    function createPhotoCard(src, description, date) {
        const photoCard = document.createElement('div');
        photoCard.classList.add('photo-card');
        photoCard.innerHTML = `
            <img src="${src}" alt="Foto">
            <div class="description">${description}</div>
            <div class="date">${date}</div>
            <span class="favorite">&#9825;</span>
        `;

        const favoriteIcon = photoCard.querySelector('.favorite');
        favoriteIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            const isCurrentlyLiked = event.target.classList.toggle('liked');
            event.target.style.color = isCurrentlyLiked ? 'red' : ''; // Change icon color
            if (isCurrentlyLiked) {
                addToFavorites(photoCard);
            } else {
                removeFromFavorites(photoCard);
            }
            saveToLocalStorage();
        });

        return photoCard;
    }

    function addToFavorites(photoCard) {
        const newPhotoCard = photoCard.cloneNode(true);
        favoriteGallery.appendChild(newPhotoCard);
    }

    function removeFromFavorites(photoCard) {
        const imgSrc = photoCard.querySelector('img').src;
        const favoriteCards = favoriteGallery.childNodes;
        favoriteCards.forEach(favCard => {
            if (favCard.querySelector('img').src === imgSrc) {
                favoriteGallery.removeChild(favCard);
            }
        });
    }

    function saveToLocalStorage() {
        const galleryData = [];
        photoGallery.childNodes.forEach(photoCard => {
            const imgSrc = photoCard.querySelector('img').src;
            const description = photoCard.querySelector('.description').innerText;
            const date = photoCard.querySelector('.date').innerText;
            const isFavorite = photoCard.querySelector('.favorite').classList.contains('liked');
            galleryData.push({ imgSrc, description, date, isFavorite });
        });
        localStorage.setItem('galleryData', JSON.stringify(galleryData));
    }

    function loadFromLocalStorage() {
        const galleryData = JSON.parse(localStorage.getItem('galleryData')) || [];
        photoGallery.innerHTML = '';
        galleryData.forEach(data => {
            const photoCard = createPhotoCard(data.imgSrc, data.description, data.date);
            photoGallery.appendChild(photoCard);
            if (data.isFavorite) {
                const newFavoriteCard = photoCard.cloneNode(true);
                favoriteGallery.appendChild(newFavoriteCard);
            }
        });
        loadDeleteGallery();
    }

    loadFromLocalStorage();
});
