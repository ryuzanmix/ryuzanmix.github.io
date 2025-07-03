// Ryuzan Mix Salon - メインページ JavaScript (パステルパープル×HIG準拠)

// アクセシビリティ設定の確認
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ナビゲーション表示制御
window.addEventListener('scroll', function() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  
  if (window.scrollY > 100) {
    nav.classList.add('show');
  } else {
    nav.classList.remove('show');
  }
});

// スムーススクロール (アクセシビリティ対応)
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offsetTop = target.offsetTop - 80;
        
        // モーション削減設定を考慮
        if (prefersReducedMotion) {
          window.scrollTo({
            top: offsetTop,
            behavior: 'auto'
          });
        } else {
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
        
        // フォーカス管理
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    });
  });
});

// インターセクションオブザーバーでアニメーション (アクセシビリティ対応)
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // モーション削減設定を考慮
      if (prefersReducedMotion) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      } else {
        entry.target.classList.add('visible');
      }
    }
  });
}, observerOptions);

// アニメーション対象要素を監視
document.addEventListener('DOMContentLoaded', function() {
  const animateElements = document.querySelectorAll('.card, .about-card, .workflow-step, .stat-item');
  
  animateElements.forEach(el => {
    if (!prefersReducedMotion) {
      el.classList.add('fade-in');
    }
    observer.observe(el);
  });
});

// 外部リンクのセキュリティ対応
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[target="_blank"]').forEach(link => {
    if (!link.rel.includes('noopener')) {
      link.rel = link.rel ? link.rel + ' noopener' : 'noopener';
    }
    if (!link.rel.includes('noreferrer')) {
      link.rel = link.rel + ' noreferrer';
    }
  });
});

// コンタクトボタンのアナリティクス追跡
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.contact-button, .cta').forEach(button => {
    button.addEventListener('click', function() {
      const buttonText = this.textContent.trim();
      const buttonType = this.classList.contains('cta') ? 'cta' : 'contact';
      
      // Google Analytics Event
      trackEvent('engagement', 'button_click', buttonText, {
        button_type: buttonType,
        page: 'main'
      });
    });
  });
});

// アナリティクス追跡関数
function trackEvent(category, action, label, customData = {}) {
  try {
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        ...customData
      });
    }
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

// パフォーマンス最適化：遅延読み込み
document.addEventListener('DOMContentLoaded', function() {
  const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // data-src属性がある場合の処理
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
          
          // 読み込み完了のトラッキング
          img.addEventListener('load', () => {
            trackEvent('performance', 'image_loaded', img.src);
          });
        }
      });
    });

    lazyImages.forEach(img => {
      img.classList.add('lazy');
      imageObserver.observe(img);
    });
  }
});

// キーボードナビゲーション対応
document.addEventListener('DOMContentLoaded', function() {
  // タブキー使用時の視覚的フィードバック
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
  });

  // Escキーでメニューを閉じる（将来的なモバイルメニュー対応）
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // モバイルメニューが開いている場合は閉じる
      const mobileMenu = document.querySelector('.mobile-menu.open');
      if (mobileMenu) {
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    }
  });
});

// フォーム送信エラーハンドリング
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      // 基本的なバリデーション
      const requiredFields = form.querySelectorAll('[required]');
      let hasErrors = false;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          hasErrors = true;
          field.setAttribute('aria-invalid', 'true');
          
          // エラーメッセージの表示
          let errorMsg = field.parentNode.querySelector('.error-message');
          if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'この項目は必須です';
            errorMsg.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorMsg);
          }
        } else {
          field.setAttribute('aria-invalid', 'false');
          const errorMsg = field.parentNode.querySelector('.error-message');
          if (errorMsg) {
            errorMsg.remove();
          }
        }
      });

      if (hasErrors) {
        e.preventDefault();
        // 最初のエラーフィールドにフォーカス
        const firstError = form.querySelector('[aria-invalid="true"]');
        if (firstError) {
          firstError.focus();
        }
      }
    });
  });
});

// ダークモード検出と対応（将来的な拡張用）
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function handleColorSchemeChange(e) {
  // ダークモード切り替えロジック（必要に応じて実装）
  if (e.matches) {
    document.body.classList.add('dark-theme');
    trackEvent('user_preference', 'dark_mode_detected', 'true');
  } else {
    document.body.classList.remove('dark-theme');
    trackEvent('user_preference', 'dark_mode_detected', 'false');
  }
}

prefersDarkScheme.addEventListener('change', handleColorSchemeChange);

// 初期ダークモード設定
document.addEventListener('DOMContentLoaded', function() {
  handleColorSchemeChange(prefersDarkScheme);
});

// FAQ アコーディオンのアクセシビリティ強化
document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.faq-item details');
  
  faqItems.forEach(details => {
    const summary = details.querySelector('summary');
    
    if (summary) {
      // ARIA属性の設定
      summary.setAttribute('aria-expanded', 'false');
      summary.setAttribute('role', 'button');
      
      // 開閉状態の管理
      details.addEventListener('toggle', function() {
        const isOpen = details.hasAttribute('open');
        summary.setAttribute('aria-expanded', isOpen.toString());
        
        // アナリティクス追跡
        trackEvent('interaction', 'faq_toggle', summary.textContent.trim(), {
          action: isOpen ? 'open' : 'close'
        });
      });
    }
  });
});

// プレイリスト動画の遅延読み込み
document.addEventListener('DOMContentLoaded', function() {
  const playlistWrapper = document.querySelector('.playlist-wrapper');
  const iframe = playlistWrapper?.querySelector('iframe');
  
  if (iframe && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // YouTubeの場合、autoplayパラメータを調整
          const src = iframe.src;
          if (src && !src.includes('autoplay=0')) {
            iframe.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=0';
          }
          videoObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    videoObserver.observe(playlistWrapper);
  }
});

// エラーハンドリングとレポート
window.addEventListener('error', function(e) {
  console.warn('Non-critical error occurred:', e.error);
  
  // エラー情報をアナリティクスに送信
  trackEvent('error', 'javascript_error', e.error?.message || 'Unknown error', {
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno
  });
});

// 未処理のPromise拒否
window.addEventListener('unhandledrejection', function(e) {
  console.warn('Unhandled promise rejection:', e.reason);
  
  trackEvent('error', 'promise_rejection', e.reason?.message || 'Unknown rejection');
  
  // エラーを処理済みとマーク（必要に応じて）
  // e.preventDefault();
});

// パフォーマンス監視
if ('PerformanceObserver' in window) {
  const perfObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    entries.forEach((entry) => {
      switch (entry.entryType) {
        case 'largest-contentful-paint':
          // LCPの監視
          if (entry.startTime > 2500) {
            console.info('LCP optimization may be needed:', entry.startTime);
            trackEvent('performance', 'lcp_slow', entry.startTime.toString());
          }
          break;
          
        case 'first-input-delay':
          // FIDの監視
          if (entry.processingStart - entry.startTime > 100) {
            console.info('FID optimization may be needed:', entry.processingStart - entry.startTime);
            trackEvent('performance', 'fid_slow', (entry.processingStart - entry.startTime).toString());
          }
          break;
          
        case 'layout-shift':
          // CLSの監視
          if (entry.value > 0.1) {
            console.info('CLS issue detected:', entry.value);
            trackEvent('performance', 'cls_issue', entry.value.toString());
          }
          break;
      }
    });
  });
  
  try {
    perfObserver.observe({ 
      entryTypes: ['largest-contentful-paint', 'first-input-delay', 'layout-shift'] 
    });
  } catch (e) {
    // サポートされていないブラウザでは無視
    console.info('Performance Observer not fully supported');
  }
}

// ページロード完了時の処理
window.addEventListener('load', function() {
  // ページロード時間の測定
  const loadTime = performance.now();
  trackEvent('performance', 'page_load_time', loadTime.toString());
  
  // 初期表示の最適化確認
  const nav = document.getElementById('nav');
  if (nav) {
    nav.style.visibility = 'visible';
  }
});

// リサイズ時の処理（デバウンス付き）
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    // リサイズ後の処理
    trackEvent('user_interaction', 'window_resize', `${window.innerWidth}x${window.innerHeight}`);
  }, 250);
});

// ユーザーの活動状況監視（エンゲージメント測定）
let userActive = true;
let activityTimeout;

function resetActivityTimer() {
  clearTimeout(activityTimeout);
  
  if (!userActive) {
    userActive = true;
    trackEvent('user_engagement', 'user_returned', Date.now().toString());
  }
  
  activityTimeout = setTimeout(() => {
    userActive = false;
    trackEvent('user_engagement', 'user_idle', Date.now().toString());
  }, 60000); // 1分間非活動でアイドル状態
}

// ユーザー活動の監視
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetActivityTimer, { passive: true });
});

// 初期タイマー設定
document.addEventListener('DOMContentLoaded', resetActivityTimer);

// ページ離脱時の処理
window.addEventListener('beforeunload', function() {
  // 最後のエンゲージメント時間を記録
  trackEvent('user_engagement', 'page_unload', Date.now().toString());
});

// Service Worker登録（PWA対応の準備）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.info('ServiceWorker registration successful');
        trackEvent('pwa', 'sw_registered', 'success');
      })
      .catch(function(err) {
        console.info('ServiceWorker registration failed');
        trackEvent('pwa', 'sw_registration_failed', err.message);
      });
  });
}

// 初期化完了の通知
document.addEventListener('DOMContentLoaded', function() {
  console.info('Ryuzan Mix Salon - Main page initialized');
  trackEvent('system', 'initialization_complete', 'main_page');
});
