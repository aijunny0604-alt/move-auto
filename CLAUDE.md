# Move Automotive - D1 LIGHTS Sponsorship Website

## Project Overview
D1 LIGHTS 드리프트 레이싱팀 **무브 오토모티브**의 공식 스폰서십 랜딩 페이지.
한국인 최초 D1 Grand Prix LIGHTS 도전 - 진태욱 드라이버.

- **배포 URL**: https://aijunny0604-alt.github.io/move-auto/
- **GitHub**: https://github.com/aijunny0604-alt/move-auto.git
- **배포 방식**: GitHub Pages (정적 사이트, 빌드 과정 없음)

## Tech Stack
- **HTML5 / CSS3 / Vanilla JavaScript** (프레임워크 없음)
- **Lenis** (`js/lenis.min.js`) - 부드러운 스크롤 라이브러리 (로컬 파일)
- **Google Fonts** - Noto Sans KR, Orbitron
- **GitHub Pages** - 호스팅/배포

## File Structure
```
move-auto-main/
├── index.html          # 메인 페이지 (~8300줄, CSS+JS 인라인)
├── gallery.html        # 사진 전시관 (연도별 갤러리)
├── admin.html          # 갤러리 관리자 페이지
├── 360view.html        # 차량 360도 뷰어
├── gallery-button.js   # 갤러리 버튼 자동 추가 스크립트
├── intro.mp4           # 인트로 비디오 (99MB)
├── parallax1.jpg       # 배경 이미지
├── parallax2.jpg       # 배경 이미지
├── js/
│   └── lenis.min.js    # 스크롤 라이브러리 (로컬)
└── images/
    ├── 360/            # 360도 뷰 이미지
    ├── projects/       # 프로젝트 사진
    ├── sponsor/        # 스폰서 로고
    ├── trackday/       # 트랙데이 포스터
    ├── og-image.jpg    # 소셜 미리보기 이미지
    └── photo_*.jpg     # 갤러리 사진들
```

## Key Files

### index.html (메인 페이지)
- CSS (~4400줄) + HTML (~1200줄) + JS (~2700줄) 모두 인라인
- 16개 섹션: Hero, Driver, Competition, Benefits, Sponsorship, Contact 등
- 4개 국어 번역 시스템 (ko, en, ja, zh) - `translations` 객체
- Google Translate 연동 (PC 한국어 외 언어)
- 인트로 영상 재생 → Enter 화면 → 메인 콘텐츠

### gallery.html (갤러리)
- 연도별 사진 전시 (2023, 2024, 2025)
- 자체 번역 시스템 (`galleryTranslations`)
- 라이트박스 (확대, ESC 닫기, 좌우 화살표 네비게이션)
- `goToMain()` 함수: HEAD 섹션에 정의 (onclick보다 먼저)

## Important Notes

### 배포
```bash
git add index.html gallery.html
git commit -m "메시지"
git push origin main
# GitHub Pages 자동 배포 (1-2분 소요)
```

### 로컬 테스트
```bash
cd D:\move-auto-main
npx http-server -p 8080
# http://127.0.0.1:8080 접속
```

### 주의사항
- **index.html이 매우 큼** (~2.4MB) - 편집 시 라인 번호 참조 필수
- **로고는 base64 인라인** - enter-screen에 포함, 파비콘/로딩에서 JS로 복사 사용
- **Lenis는 로컬 파일 사용** - CDN 사용 금지 (보안)
- **document.write() 사용 금지** - createElement 방식 사용
- **모바일(768px 이하)에서 애니메이션 비활성화** - 성능 최적화
- **갤러리 goToMain 함수는 HEAD에 위치** - onclick보다 먼저 정의 필요
- **sessionStorage로 페이지 간 데이터 전달** (skipAllIntro, scrollTarget)

### 번역 시스템
- index.html: `changeLanguage(lang)` 함수 + Google Translate
- gallery.html: `setLanguage(lang)` 함수 (자체 번역만)
- 모든 번역 가능 요소에 `data-i18n` 속성 사용
- 언어 저장: `localStorage.setItem('selectedLang', lang)`

### 스폰서십 가격 (부가세 별도)
- Title: 3,000만원
- Main: 1,500만원
- Official: 700만원
- Technical Official: 300만원
- Supplier: 100만원
- Personal Supporter: 30만원/50만원/100만원

## Development History
1. 초기 사이트 구축 (HTML/CSS/JS 단일 파일)
2. 인트로 영상 + Enter 화면 추가
3. 4개 국어 번역 시스템 구현
4. 갤러리 페이지 분리
5. 스폰서십 섹션 상세화 (가격, 혜택, 데칼)
6. OG 메타태그 + 소셜 미리보기
7. 파비콘 + 비디오 로딩 애니메이션
8. 갤러리 ↔ 메인 스크롤 위치 복원
9. 보안/성능/SEO 최적화 (2026-02)
   - rel="noopener noreferrer" 추가
   - Lenis CDN → 로컬 파일
   - document.write → createElement
   - passive scroll, lazy loading
   - meta description, canonical URL
