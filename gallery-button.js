// 갤러리 섹션에 "더 많은 사진 보기" 버튼 추가
document.addEventListener('DOMContentLoaded', function() {
    // 갤러리 컨테이너 찾기
    const galleryContainer = document.querySelector('.gallery-container');

    if (galleryContainer) {
        // 버튼 생성
        const moreButton = document.createElement('div');
        moreButton.style.cssText = `
            text-align: center;
            margin-top: 3rem;
            padding: 2rem 0;
        `;

        const button = document.createElement('a');
        button.href = 'gallery.html';
        button.textContent = '📸 더 많은 사진 보기';
        button.style.cssText = `
            display: inline-block;
            padding: 1.2rem 3rem;
            background: linear-gradient(135deg, #ff0000, #cc0000);
            color: #fff;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            transition: all 0.3s;
            box-shadow: 0 10px 30px rgba(255, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
        `;

        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 15px 40px rgba(255, 0, 0, 0.5)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 10px 30px rgba(255, 0, 0, 0.3)';
        });

        moreButton.appendChild(button);
        galleryContainer.appendChild(moreButton);
    }

    // 기존 갤러리 이미지에 라이트박스 기능 추가
    const galleryImages = document.querySelectorAll('.gallery-item img');

    if (galleryImages.length > 0 && !document.getElementById('main-lightbox')) {
        // 라이트박스 생성
        const lightbox = document.createElement('div');
        lightbox.id = 'main-lightbox';
        lightbox.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(20px);
        `;

        lightbox.innerHTML = `
            <button id="lightbox-close-btn" style="
                position: absolute;
                top: 2rem;
                right: 2rem;
                width: 50px;
                height: 50px;
                background: rgba(255, 0, 0, 0.9);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                transition: all 0.3s;
            ">
                <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #fff;">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
            <div id="lightbox-content" style="max-width: 90%; max-height: 90%; text-align: center;">
                <img id="lightbox-img" style="max-width: 100%; max-height: 90vh; border-radius: 10px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8);">
            </div>
        `;

        document.body.appendChild(lightbox);

        // 이미지 클릭 이벤트
        galleryImages.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function() {
                const lightboxImg = document.getElementById('lightbox-img');
                lightboxImg.src = this.src;
                lightbox.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        });

        // 라이트박스 닫기
        const closeBtn = document.getElementById('lightbox-close-btn');
        closeBtn.addEventListener('click', function() {
            lightbox.style.display = 'none';
            document.body.style.overflow = '';
        });

        closeBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'rotate(90deg) scale(1.1)';
        });

        closeBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'rotate(0) scale(1)';
        });

        // 배경 클릭시 닫기
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
                document.body.style.overflow = '';
            }
        });

        // ESC 키로 닫기
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') {
                lightbox.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
});
