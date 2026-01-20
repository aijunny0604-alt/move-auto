// 갤러리 섹션에 "더 많은 이야기 보기" 버튼 추가
document.addEventListener('DOMContentLoaded', function() {
    // 갤러리 컨테이너 찾기
    const galleryContainer = document.querySelector('.gallery-container');

    if (galleryContainer) {
        // 버튼 컨테이너 생성
        const moreButton = document.createElement('div');
        moreButton.style.cssText = `
            text-align: center;
            margin-top: 3rem;
            padding: 2rem 0;
        `;

        const button = document.createElement('a');
        button.href = 'gallery.html';
        button.innerHTML = `
            <span style="margin-right: 10px;">더 많은 이야기 보기</span>
            <svg style="width: 18px; height: 18px; vertical-align: middle; transition: transform 0.3s;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
        `;
        button.style.cssText = `
            display: inline-flex;
            align-items: center;
            padding: 1.1rem 2.8rem;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
            color: #60a5fa;
            text-decoration: none;
            border: 1px solid rgba(59, 130, 246, 0.4);
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            letter-spacing: 0.03em;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        `;

        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(139, 92, 246, 0.25))';
            this.style.borderColor = 'rgba(59, 130, 246, 0.7)';
            this.style.color = '#93c5fd';
            this.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.2)';
            const arrow = this.querySelector('svg');
            if (arrow) arrow.style.transform = 'translateX(5px)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))';
            this.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            this.style.color = '#60a5fa';
            this.style.boxShadow = 'none';
            const arrow = this.querySelector('svg');
            if (arrow) arrow.style.transform = 'translateX(0)';
        });

        moreButton.appendChild(button);
        galleryContainer.appendChild(moreButton);
    }
});
