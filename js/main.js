/**
 * ============================================================================
 * Codyssey Web Core: 나를 소개하는 웹페이지 (ottermere21)
 * 기술 스택: 순수 HTML5, CSS3, Vanilla ES6+ JavaScript
 * 핵심 패턴: 사용자 이벤트 -> 상태 변경 -> DOM 업데이트 (State -> Render)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. DOM 요소 캐싱: HTML 문서에서 id가 '~~'인 요소를 찾아옴. 미리 캐싱하여 반복적인 DOM 탐색 비용 절감
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
  /*
  - localStorage는 브라우저 내부의 단순한 Key-Value 저장소. 사용자가 이탈 후 재방문 시 테마 정보 유지
  - 방문한 적O, 테마 설정O -> 'theme'에 저장된 값 반환
  - 방문한 적X, 테마 설정한 적X -> null 반환. '||' 연산자에 의해 'light'가 기본값으로 반환됨 => null || 'light'
    - localStorage 조회 후 값이 없을 때, 기본값 'light'를 반환하면, 다크 모드를 기본으로 할 수 없어짐. 
  */
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

  /*
  테마 상태를 DOM에 반영하는 함수
  */
  const renderTheme = () => {
    // isDark: 테마 상태가 'dark'면 true, 아니면 false
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
    // 모든 상태 메시지 숨김 초기화: UI 요소에 'hidden' 클래스를 붙여 화면에서 숨김
    projectsLoading.classList.add('hidden');
    projectsError.classList.add('hidden');
    projectsEmpty.classList.add('hidden');
    // 프로젝트 카드가 들어갈 그리드 영역의 기존 HTML 내용을 완전히 비움
    projectsGrid.innerHTML = '';


    // 해당하면 'hidden'을 제거하여 화면에 노출
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
        // repos 데이터 배열을 map으로 순회하며 HTML 카드 문자열 배열로 변환
        const cardsHTML = projectsState.repos.map((repo) => {
          // 구조 분해 할당: repo 객체 내부의 속성들을 개별 변수로 가져옴
          // stargazers_count -> stars로 할당
          // html_url -> repoUrl로 할당
          const {
            name,
            description,
            stargazers_count: stars,
            language,
            html_url: repoUrl
          } = repo;

          // description이 null or undefined이면 기본 대체 문구 할당
          const descText = description ? description : '설명이 등록되지 않은 저장소입니다.';
          // language가 null or undefined이면 기본 대체 문구 할당
          const langText = language ? language : 'General';

          // 프로젝트 카드의 HTMl 문자열을 백틱(템플릿 리터럴)을 이용해 dynamic하게 생성하여 리턴
          return `
            <article class="project-card">
              <div class="project-card-header">
                <!-- 폴더 아이콘 -->
                <i class="fa-regular fa-folder-closed project-folder-icon" aria-hidden="true"></i>
                <!-- 저장소 바로 가기 링크 (새 탭에서 열기 지정) -->
                <a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="project-external-link" aria-label="${name} 저장소 바로가기">
                  <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                </a>
              </div>
              <!-- 프로젝트 이름-->
              <h3 class="project-title">${name}</h3>
              <!-- 프로젝트 설명-->
              <p class="project-desc">${descText}</p>
              <div class="project-meta">
                <!-- 주사용 언어 또는 기술 -->
                <span class="project-lang">
                  <span class="lang-dot"></span>
                  <span>${langText}</span>
                </span>
                <!-- 깃허브 스타 개수-->
                <span class="project-stats" title="GitHub Stars">
                  <i class="fa-regular fa-star" aria-hidden="true"></i>
                  <span>${stars}</span>
                </span>
              </div>
            </article>
          `;
        }).join(''); // 생성된 HTML 문자열 배열을 하나의 긴 문자열로 이어 붙임

        // 완성된 카드 HTMl 문자열을 화면(DOM) 그리드 요소에 추가
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
    // [1. 이름 필드]
    nameError.textContent = formState.errors.name;
    if (formState.errors.name) {
      // 에러O -> input 창에 'invalid' 클래스 추가 -> 에러 스타일 줄 수 있음
      nameInput.classList.add('invalid');
    } else {
      // 에러X -> 'invalid' 클래스 제거 -> 원래대로 복구
      nameInput.classList.remove('invalid');
    }

    // [2. 이메일 필드]
    emailError.textContent = formState.errors.email;
    if (formState.errors.email) {
      emailInput.classList.add('invalid');
    } else {
      emailInput.classList.remove('invalid');
    }

    // [3. 메시지 필드]
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

  // ?sort=updated (최근 업데이트순 정렬) & per_page=12 (최대 12개 가져오기) 옵션
  const GITHUB_USERNAME = 'ottermere21';
  const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=12`;

  /* GitHub API 저장소 불러오기 */
  // async 키워드를 사용해 비동기 함수임을 명시
  const fetchGitHubRepos = async () => {
    // [1단계] 상태를 로딩으로 전환 후, 렌더링
    projectsState.status = 'loading';
    // 이전 에러 메시지 있으면 초기화
    projectsState.errorMessage = '';
    // 렌더링 함수 호출
    renderProjects();

    try {
      // [2단계] 네트워크 요청
      // fetch API를 이용해 GITHUB_API_URL로 HTTP GET 요청을 보내고 응답을 기다림(await)
      const response = await fetch(GITHUB_API_URL);

      // 응답 상태 코드(status)가 200~299 범위가 아니면 에러 발생시킴
      if (!response.ok) {
        throw new Error(`HTTP 에러: ${response.status}`);
      }

      // 응답 본문(JSON)을 자바스크립트 객체/배열로 파싱
      const data = await response.json();

      // [3단계] 데이터 결과 분석 및 상태 저장
      // 받아온 데이터가 배열이 아니거나, 배열 길이가 0(저장소 없음)인 경우
      if (!Array.isArray(data) || data.length === 0) {
        // 상태를 'empty'로 변경 후, repos를 빈 배열로 채움
        projectsState.status = 'empty';
        projectsState.repos = [];
      } else {
        // 데이터 정상적으로 있으면 상태를 'success'로 변경 후, 받아온 데이터를 저장
        projectsState.status = 'success';
        projectsState.repos = data;
      }
    } catch (error) {
      // [4단계] 에러 예외 처리
      // 네트워크 연결 실패, API 요청 제한, response.ok 실패 등으로 인한 에러 감지
      console.error('GitHub API 연동 실패:', error);
      // 상태를 'error'로 변경
      projectsState.status = 'error';
      // 발생한 에러 메시지를 상태에 저장
      projectsState.errorMessage = error.message;
    } finally {
      // [5단계] 변경된 상태 반영 렌더링
      // try or catch 실행이 끝난 후 무조건 실행됨
      // 변경된 최종 상태를 화면(DOM)에 반영
      renderProjects();
    }
  };

  // ==========================================================================
  // 5. 인터랙션 및 이벤트 리스너 (Event Handlers)
  // ==========================================================================

  // 5-1. 테마 토글 클릭 이벤트
  // themeToggle 요소에 'click' 이벤트 등록
  themeToggle.addEventListener('click', () => {
    // themeState.theme가 'dark'이면 'light'로, 아니면 'dark'으로 변경
    themeState.theme = themeState.theme === 'dark' ? 'light' : 'dark';
    // 변경된 테마를 localStorage에 저장
    localStorage.setItem('theme', themeState.theme);
    // 변경된 테마를 화면(DOM)에 반영
    renderTheme();
  });

  // 5-2. 모바일 햄버거 메뉴 토글 이벤트
  menuToggle.addEventListener('click', () => {
    // 버튼의 'aria-expanded' 속성값이 'true'인지 확인하여 현재 메뉴가 열려있는지 값 저장
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    // 현재 상태의 반대값(!isExpanded)을 문자열로 변환하여 'aria-expanded' 속성에 다시 설정 (스크롤 리더용 접근성)
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    // 햄버거 버튼 아이콘에 'active' 클래스 토글 (있으면 제거, 없으면 추가) (x자 변형 애니메이션 등)
    menuToggle.classList.toggle('active');
    // 네비게이션 메뉴 바에(navbar)에 'active' 클래스 토글 -> 모바일 메뉴 창을 띄우거나 닫음
    navbar.classList.toggle('active');
  });

  // 5-3. 네비게이션 링크 클릭 시 모바일 메뉴 자동 닫기 & 부드러운 스크롤
  // navLinks 배열/NodeList를 순회하며 각각의 링크 아이템에 이벤트를 붙임
  navLinks.forEach((link) => {
    // 각 네이게이션 링크에 'click' 이벤트 등록
    link.addEventListener('click', () => {
      // navbar에 'active' 클래스 붙어있을 경우(= 모바일 메뉴가 열려있는 상태)
      if (navbar.classList.contains('active')) {
        // 1. navbar에서 'active' 클래스 제거 (모바일 메뉴 닫음)
        navbar.classList.remove('active');
        // 2. menuToggle에서 'active' 클래스 제거 (햄버거 버튼 X자 해제)
        menuToggle.classList.remove('active');
        // 3. menuToggle의 'aria-expanded' 속성을 'false'로 변경 (접근성 업데이트)
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // 5-4. 윈도우 스크롤 이벤트 (헤더 배경 변경 60px & 스크롤 탑 버튼 300px)
  // 전체 브라우저 창에 화면을 스크롤할 때 'scroll' 이벤트 리스너 등록
  window.addEventListener('scroll', () => {
    // window.scrollY: 현재 스크롤된 수직 거리(px)
    const currentScrollY = window.scrollY;

    // [네비게이션 배경 스타일 변경] (스크롤 60px 이상이면)
    if (currentScrollY > 60) {
      // 60px 초과시 header 요소에 'scrolled' 클래스를 추가 -> 블러/그림자 효과
      header.classList.add('scrolled');
    } else {
      // 60px 이하이면 'scrolled' 클래스 제거 (원래대로)
      header.classList.remove('scrolled');
    }

    // [스크롤 탑 버튼 노출] (스크롤 300px 이상이면)
    if (currentScrollY > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  // 5-5. [스크롤 탑 버튼 클릭 시 최상단 부드러운 이동]
  backToTopBtn.addEventListener('click', () => {
    // 화면을 최상단으로 이동시키는 함수 실행
    window.scrollTo({
      // 최상단 y축 위치(0px)를 지정
      top: 0,
      // 스크롤리 부드럽게 감속하며 올라가도록 부드러운 애니메이션 효과 적용
      behavior: 'smooth'
    });
  });

  // 5-6. [API 재시도 버튼 클릭 이벤트]
  // retryBtn(에러 발생 시 노출되는 재시도 버튼) 요소에 'click' 이벤트 등록
  retryBtn.addEventListener('click', () => {
    // 앞서 선언해둔 GitHub API 불러오기 함수를 다시 실행하여 데이터를 재요청함
    fetchGitHubRepos();
  });

  // ==========================================================================
  // 6. Contact 폼 검증 로직
  // ==========================================================================

  /* 이메일 정규식 검사 */
  // email 매개변수를 받아 유효성을 판단하는 화살표 함수 선언
  const isValidEmail = (email) => {
    // 이메일 형식 검사를 위한 정규표현식(Regex) 정의
    //[공백/골뱅이 제외 문자들] + @ + [공백/골뱅이 제외 문자들] + . + [공백/골뱅이 제외 문자들]
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // 정규식 test() 메서드를 사용해, 입력받은 email이 규칙에 맞는지 확인
    return emailRegex.test(email);
  };

  /* 전체 폼 유효성 검사 실행 */
  // 폼 전체의 유효성 검사 후, 통과 여부(boolean)를 반환하는 함수 선언
  const validateForm = () => {
    // 폼 전체 통과 여부 기록 변수. 초기값 true로 설정한 이유는, 하나라도 유효성 검사를 통과하지 못하면 false로 바뀔 것이기 때문에
    let isValid = true;
    // 입력 필드의 앞뒤 공백을 제거한 값을 변수에 저장
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const msgVal = messageInput.value.trim();

    // [이름 검증]
    // 빈 문자열인지 확인
    if (nameVal === '') {
      formState.errors.name = '이름을 입력해주세요.';
      isValid = false;
    } else {
      // 정상 입력되면, 에러 메시지를 빈 문자열로 초기화
      formState.errors.name = '';
    }

    // [이메일 검증]
    // 빈 문자열인지 확인
    if (emailVal === '') {
      formState.errors.email = '이메일을 입력해주세요.';
      isValid = false;
    } else if (!isValidEmail(emailVal)) {
      // 빈 값이  아니지만 정규식 검사를 통과하지 못한 경우
      formState.errors.email = '올바른 이메일 형식이 아닙니다 (예: name@domain.com).';
      isValid = false;
    } else {
      // 이메일이 정상인 경우, 에러 메시지 초기화
      formState.errors.email = '';
    }

    // [메시지 검증]
    // 빈 문자열인지 확인
    if (msgVal === '') {
      formState.errors.message = '메시지를 입력해주세요.';
      isValid = false;
    } else if (msgVal.length < 5) {
      // 메시지 길이가 5자 미만이면 에러
      formState.errors.message = '메시지는 최소 5자 이상 입력해주세요.';
      isValid = false;
    } else {
      formState.errors.message = '';
    }

    // 모든 검사 후, 통과 여부 반환
    return isValid;
  };

  // [실시간 입력 필드 input 이벤트 시 에러 즉시 해제]
  // 이름 입력창에 타이핑할 때마다(input) 실행되는 이벤트 등록
  nameInput.addEventListener('input', () => {
    // 기존에 이름 에러 메시지 존재했는지 확인
    if (formState.errors.name) {
      // 다시 입력 시작했으니까 에러 메시지를 지움
      formState.errors.name = '';
      // 화면에 에러 메시지 렌더링
      renderFormErrors();
    }
  });

  // 이메일 입력창
  emailInput.addEventListener('input', () => {
    if (formState.errors.email) {
      formState.errors.email = '';
      renderFormErrors();
    }
  });

  // 메시지 입력창
  messageInput.addEventListener('input', () => {
    if (formState.errors.message) {
      formState.errors.message = '';
      renderFormErrors();
    }
  });

  // [폼 제출(submit) 이벤트 핸들러]
  // contactForm 요소의 'submit' 이벤트 등록
  contactForm.addEventListener('submit', (event) => {
    // 폼 제출 기본 동작(페이지 새로고침) 방지
    event.preventDefault();

    // validateForm() 함수를 호출하여 폼 유효성 검사 후 결과를 isFormValid 변수에 저장
    const isFormValid = validateForm();
    renderFormErrors();

    // 폼 전체 유효성 검사 결과가 true(통과)이면
    if (isFormValid) {
      // 폼 초기화 및 성공 메시지 표시
      contactForm.reset();
      formSuccessMsg.classList.remove('hidden');

      // 4.5초(4500ms) 후 성공 메시지 서서히 숨김
      setTimeout(() => {
        formSuccessMsg.classList.add('hidden');
      }, 4500);
    }
  });

  // ==========================================================================
  // 7. Intersection Observer 스크롤 애니메이션
  // ==========================================================================
  // 애니메이션을 적용할 모든 섹션, 스킬 카드 요소를 선택하여 NodeList로 반환
  const animatedSections = document.querySelectorAll('.section, .skill-card');

  // [애니메이션 클래스 초기 부여]
  // forEach() 메서드를 사용하여 선택된 모든 요소에 숨김/초기 상태 스타일이 정의된 'reveal-item' 클래스 부여
  animatedSections.forEach((el) => {
    el.classList.add('reveal-item');
  });

  // 브라우저가 IntersectionObserver API를 지원하는지 확인
  if ('IntersectionObserver' in window) {
    // Observer의 동작 방식을 설정하는 옵션 객체 정의
    const observerOptions = {
      // root: 기준이 되는 요소. null이면 뷰포트(브라우저 화면 전체)를 기준으로 함
      root: null,
      // rootMargin: 뷰포트 기준 여유/부족 영역 설정. 0px이면 감지 영역의 여백X
      rootMargin: '0px',
      // threshold: 관찰 대상이 뷰포트에 보이는 비율(0 ~ 1). 0.2는 20% 보일 때 콜백 함수 실행
      threshold: 0.2
    };

    // IntersectionObserver 콜백 함수
    const sectionObserver = new IntersectionObserver((entries, observer) => {
      // 감지 대상(entries)를 순회하며 상태 변화 확인
      entries.forEach((entry) => {
        // 요소가 뷰포트안에 실제로 들어왔는지 확인
        if (entry.isIntersecting) {
          // 'revealed' 클래스 추가해서 등장 애니메이션 재생
          entry.target.classList.add('revealed');
          // 한 번 노출된 요소는 관찰 해제 -> 불필요한 이벤트 호출과 메모리 낭비 방지
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // 선택된 모든 애니메이션 대상 요소들을 Observer의 관찰 대상으로 등록
    animatedSections.forEach((section) => {
      sectionObserver.observe(section);
    });
  } else {
    // 구형 브라우저 fallback
    // IntersectionObserver를 지원하지 않는 브라우저에서도 콘텐츠가 보이도록 바로 'revealed' 클래스 추가
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
