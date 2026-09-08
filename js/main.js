/**
 * ============================================================================
 * Codyssey Web Core: 나를 소개하는 웹페이지 (ottermere21)
 * 기술 스택: 순수 HTML5, CSS3, Vanilla ES6+ JavaScript
 * 핵심 패턴: 사용자 이벤트 -> 상태 변경 -> DOM 업데이트 (State -> Render)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. DOM 요소 캐싱
  // ==========================================================================
  const header = document.getElementById('header');
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');
  const navLinks = document.querySelectorAll('.nav-link');
  const backToTopBtn = document.getElementById('back-to-top');
  
  // Projects 관련 요소
  const projectsLoading = document.getElementById('projects-loading');
  const projectsError = document.getElementById('projects-error');
  const projectsEmpty = document.getElementById('projects-empty');
  const projectsGrid = document.getElementById('projects-grid');
  const retryBtn = document.getElementById('retry-btn');
  
  // Contact 폼 관련 요소
  const contactForm = document.getElementById('contact-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const messageError = document.getElementById('message-error');
  const formSuccessMsg = document.getElementById('form-success-msg');
  const currentYearSpan = document.getElementById('current-year');

  // 저작권 연도 동적 설정
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // ==========================================================================
  // 2. 상태(State) 정의
  // ==========================================================================
  
  // 2-1. 테마 상태 ('light' | 'dark')
  const themeState = {
    theme: localStorage.getItem('theme') || 'light'
  };

  // 2-2. GitHub 프로젝트 API 상태 ('loading' | 'success' | 'error' | 'empty')
  const projectsState = {
    status: 'loading',
    repos: [],
    errorMessage: ''
  };

  // 2-3. 폼 유효성 상태
  const formState = {
    errors: {
      name: '',
      email: '',
      message: ''
    },
    isSubmitted: false
  };

  // ==========================================================================
  // 3. 상태 기반 렌더링 함수 (Render Functions)
  // ==========================================================================

  /**
   * 테마 상태를 DOM에 반영
   */
  const renderTheme = () => {
    const isDark = themeState.theme === 'dark';
    document.documentElement.setAttribute('data-theme', themeState.theme);

    if (isDark) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
      themeToggle.setAttribute('aria-label', '라이트 모드로 전환');
    } else {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
      themeToggle.setAttribute('aria-label', '다크 모드로 전환');
    }
  };

  /**
   * GitHub 프로젝트 4대 상태에 따른 화면 렌더링
   */
  const renderProjects = () => {
    // 모든 상태 메시지 숨김 초기화
    projectsLoading.classList.add('hidden');
    projectsError.classList.add('hidden');
    projectsEmpty.classList.add('hidden');
    projectsGrid.innerHTML = '';

    switch (projectsState.status) {
      case 'loading':
        projectsLoading.classList.remove('hidden');
        break;

      case 'error':
        projectsError.classList.remove('hidden');
        break;

      case 'empty':
        projectsEmpty.classList.remove('hidden');
        break;

      case 'success': {
        // map()과 템플릿 리터럴을 활용한 동적 카드 렌더링
        const cardsHTML = projectsState.repos.map((repo) => {
          // 구조 분해 할당
          const {
            name,
            description,
            stargazers_count: stars,
            language,
            html_url: repoUrl
          } = repo;

          const descText = description ? description : '설명이 등록되지 않은 저장소입니다.';
          const langText = language ? language : 'General';

          return `
            <article class="project-card">
              <div class="project-card-header">
                <i class="fa-regular fa-folder-closed project-folder-icon" aria-hidden="true"></i>
                <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="project-external-link" aria-label="${name} 저장소 바로가기">
                  <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                </a>
              </div>
              <h3 class="project-title">${name}</h3>
              <p class="project-desc">${descText}</p>
              <div class="project-meta">
                <span class="project-lang">
                  <span class="lang-dot"></span>
                  <span>${langText}</span>
                </span>
                <span class="project-stats" title="GitHub Stars">
                  <i class="fa-regular fa-star" aria-hidden="true"></i>
                  <span>${stars}</span>
                </span>
              </div>
            </article>
          `;
        }).join('');

        projectsGrid.innerHTML = cardsHTML;
        break;
      }

      default:
        break;
    }
  };

  /**
   * 폼 유효성 에러 상태를 DOM에 반영
   */
  const renderFormErrors = () => {
    // 이름 필드
    nameError.textContent = formState.errors.name;
    if (formState.errors.name) {
      nameInput.classList.add('invalid');
    } else {
      nameInput.classList.remove('invalid');
    }

    // 이메일 필드
    emailError.textContent = formState.errors.email;
    if (formState.errors.email) {
      emailInput.classList.add('invalid');
    } else {
      emailInput.classList.remove('invalid');
    }

    // 메시지 필드
    messageError.textContent = formState.errors.message;
    if (formState.errors.message) {
      messageInput.classList.add('invalid');
    } else {
      messageInput.classList.remove('invalid');
    }
  };

  // ==========================================================================
  // 4. 비동기 통신 (GitHub API Fetch)
  // ==========================================================================
  
  const GITHUB_USERNAME = 'ottermere21';
  const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`;

  /**
   * GitHub API 저장소 불러오기
   */
  const fetchGitHubRepos = async () => {
    // 1) 상태를 로딩으로 전환 -> 렌더링
    projectsState.status = 'loading';
    projectsState.errorMessage = '';
    renderProjects();

    try {
      const response = await fetch(GITHUB_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP 에러: ${response.status}`);
      }

      const data = await response.json();

      // 2) 데이터 유무에 따른 상태 변경
      if (!Array.isArray(data) || data.length === 0) {
        projectsState.status = 'empty';
        projectsState.repos = [];
      } else {
        projectsState.status = 'success';
        projectsState.repos = data;
      }
    } catch (error) {
      console.error('GitHub API 연동 실패:', error);
      projectsState.status = 'error';
      projectsState.errorMessage = error.message;
    } finally {
      // 3) 변경된 상태 반영 렌더링
      renderProjects();
    }
  };

  // ==========================================================================
  // 5. 인터랙션 및 이벤트 리스너 (Event Handlers)
  // ==========================================================================

  // 5-1. 테마 토글 클릭 이벤트
  themeToggle.addEventListener('click', () => {
    themeState.theme = themeState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', themeState.theme);
    renderTheme();
  });

  // 5-2. 모바일 햄버거 메뉴 토글 이벤트
  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    menuToggle.classList.toggle('active');
    navbar.classList.toggle('active');
  });

  // 5-3. 네비게이션 링크 클릭 시 모바일 메뉴 자동 닫기 & 부드러운 스크롤
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navbar.classList.contains('active')) {
        navbar.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // 5-4. 윈도우 스크롤 이벤트 (헤더 배경 변경 60px & 스크롤 탑 버튼 300px)
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // 네비게이션 배경 스타일 변경 (스크롤 60px 이상)
    if (currentScrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // 스크롤 탑 버튼 노출 (스크롤 300px 이상)
    if (currentScrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  // 5-5. 스크롤 탑 버튼 클릭 시 최상단 부드러운 이동
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // 5-6. API 재시도 버튼 클릭 이벤트
  retryBtn.addEventListener('click', () => {
    fetchGitHubRepos();
  });

  // ==========================================================================
  // 6. Contact 폼 검증 로직
  // ==========================================================================

  /**
   * 이메일 정규식 검사
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 전체 폼 유효성 검사 실행
   */
  const validateForm = () => {
    let isValid = true;
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const msgVal = messageInput.value.trim();

    // 이름 검증
    if (nameVal === '') {
      formState.errors.name = '이름을 입력해주세요.';
      isValid = false;
    } else {
      formState.errors.name = '';
    }

    // 이메일 검증
    if (emailVal === '') {
      formState.errors.email = '이메일을 입력해주세요.';
      isValid = false;
    } else if (!isValidEmail(emailVal)) {
      formState.errors.email = '올바른 이메일 형식이 아닙니다 (예: name@domain.com).';
      isValid = false;
    } else {
      formState.errors.email = '';
    }

    // 메시지 검증
    if (msgVal === '') {
      formState.errors.message = '메시지를 입력해주세요.';
      isValid = false;
    } else if (msgVal.length < 5) {
      formState.errors.message = '메시지는 최소 5자 이상 입력해주세요.';
      isValid = false;
    } else {
      formState.errors.message = '';
    }

    return isValid;
  };

  // 실시간 입력 필드 input 이벤트 시 에러 즉시 해제
  nameInput.addEventListener('input', () => {
    if (formState.errors.name) {
      formState.errors.name = '';
      renderFormErrors();
    }
  });

  emailInput.addEventListener('input', () => {
    if (formState.errors.email) {
      formState.errors.email = '';
      renderFormErrors();
    }
  });

  messageInput.addEventListener('input', () => {
    if (formState.errors.message) {
      formState.errors.message = '';
      renderFormErrors();
    }
  });

  // 폼 제출(submit) 이벤트 핸들러
  contactForm.addEventListener('submit', (event) => {
    // 폼 제출 기본 동작(페이지 새로고침) 방지
    event.preventDefault();

    const isFormValid = validateForm();
    renderFormErrors();

    if (isFormValid) {
      // 폼 초기화 및 성공 메시지 표시
      contactForm.reset();
      formSuccessMsg.classList.remove('hidden');

      // 4초 후 성공 메시지 서서히 숨김
      setTimeout(() => {
        formSuccessMsg.classList.add('hidden');
      }, 4500);
    }
  });

  // ==========================================================================
  // 7. Intersection Observer 스크롤 애니메이션
  // ==========================================================================
  const animatedSections = document.querySelectorAll('.section, .skill-card');

  // 애니메이션 클래스 초기 부여
  animatedSections.forEach((el) => {
    el.classList.add('reveal-item');
  });

  if ('IntersectionObserver' in window) {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.2 // 명세서 권장 임계값 0.2
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // 한 번 노출된 요소는 관찰 해제
        }
      });
    }, observerOptions);

    animatedSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  } else {
    // 구형 브라우저 fallback
    animatedSections.forEach((section) => {
      section.classList.add('revealed');
    });
  }

  // ==========================================================================
  // 8. 초기 렌더링 실행
  // ==========================================================================
  renderTheme();
  fetchGitHubRepos();
});
