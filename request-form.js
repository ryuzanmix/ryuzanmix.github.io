// Ryuzan Mix Salon - 詳細依頼フォーム JavaScript (パステルパープル×HIG準拠)

// アクセシビリティ設定の確認
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// DOM要素の取得
const form = document.getElementById('requestForm');
const totalPriceEl = document.getElementById('totalPrice');
const priceBreakdownEl = document.getElementById('priceBreakdown');
const generateBtn = document.getElementById('generateBtn');
const outputSection = document.getElementById('outputSection');
const dmTextEl = document.getElementById('dmText');
const copyBtn = document.getElementById('copyBtn');
const twitterBtn = document.getElementById('twitterBtn');
const emailBtn = document.getElementById('emailBtn');

// フォーム状態管理
let formState = {
  isValid: false,
  errors: new Map(),
  totalPrice: 0,
  breakdown: []
};

// エラーメッセージの定義
const errorMessages = {
  required: '必須項目です',
  email: '有効なメールアドレスを入力してください',
  url: '有効なURLを入力してください',
  minLength: '最低文字数に達していません',
  maxLength: '文字数が上限を超えています'
};

// アクセシビリティ支援関数
function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// フィールドのエラー状態設定
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const existingError = document.getElementById(`${fieldId}-error`);
  
  if (!field) return;
  
  // エラー状態の設定
  field.setAttribute('aria-invalid', 'true');
  field.classList.add('error');
  
  // エラーメッセージの表示
  if (!existingError) {
    const errorDiv = document.createElement('div');
    errorDiv.id = `${fieldId}-error`;
    errorDiv.className = 'error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
    field.setAttribute('aria-describedby', 
      field.getAttribute('aria-describedby') 
        ? `${field.getAttribute('aria-describedby')} ${fieldId}-error`
        : `${fieldId}-error`
    );
  } else {
    existingError.textContent = message;
  }
  
  formState.errors.set(fieldId, message);
}

// フィールドのエラー状態解除
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  
  if (!field) return;
  
  field.setAttribute('aria-invalid', 'false');
  field.classList.remove('error');
  
  if (errorElement) {
    errorElement.remove();
    // aria-describedby の更新
    const describedBy = field.getAttribute('aria-describedby');
    if (describedBy) {
      const newDescribedBy = describedBy
        .split(' ')
        .filter(id => id !== `${fieldId}-error`)
        .join(' ');
      
      if (newDescribedBy) {
        field.setAttribute('aria-describedby', newDescribedBy);
      } else {
        field.removeAttribute('aria-describedby');
      }
    }
  }
  
  formState.errors.delete(fieldId);
}

// フィールド検証
function validateField(fieldId, value, rules = {}) {
  clearFieldError(fieldId);
  
  // 必須チェック
  if (rules.required && (!value || value.trim() === '')) {
    setFieldError(fieldId, errorMessages.required);
    return false;
  }
  
  // 値が空の場合は以降の検証をスキップ
  if (!value || value.trim() === '') {
    return true;
  }
  
  // URL検証
  if (rules.type === 'url') {
    try {
      new URL(value);
    } catch {
      setFieldError(fieldId, errorMessages.url);
      return false;
    }
  }
  
  // メール検証
  if (rules.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setFieldError(fieldId, errorMessages.email);
      return false;
    }
  }
  
  // 文字数検証
  if (rules.minLength && value.length < rules.minLength) {
    setFieldError(fieldId, `${errorMessages.minLength}（最低${rules.minLength}文字）`);
    return false;
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    setFieldError(fieldId, `${errorMessages.maxLength}（最大${rules.maxLength}文字）`);
    return false;
  }
  
  return true;
}

// カスタム入力フィールドの表示制御
document.addEventListener('change', function(e) {
  const { name, value } = e.target;
  
  switch (name) {
    case 'pitchCorrection':
      toggleCustomField('pitchCustom', value === 'custom');
      break;
    case 'timingCorrection':
      toggleCustomField('timingCustom', value === 'custom');
      break;
    case 'breathProcessing':
      toggleCustomField('breathCustom', value === 'custom');
      break;
    case 'recordingStatus':
      toggleRecordingUrlSection(value === 'recorded');
      break;
  }
  
  // フォーム検証の実行
  validateForm();
});

// カスタムフィールドの表示切り替え
function toggleCustomField(fieldId, show) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  if (show) {
    field.style.display = 'block';
    field.setAttribute('aria-hidden', 'false');
    const input = field.querySelector('input');
    if (input) {
      input.focus();
    }
  } else {
    field.style.display = 'none';
    field.setAttribute('aria-hidden', 'true');
  }
}

// 録音音源URL欄の表示制御
function toggleRecordingUrlSection(show) {
  const audioUrlSection = document.getElementById('audioUrlSection');
  const audioUrlInput = document.getElementById('audioUrl');
  
  if (!audioUrlSection || !audioUrlInput) return;
  
  if (show) {
    audioUrlSection.style.display = 'block';
    audioUrlSection.setAttribute('aria-hidden', 'false');
    audioUrlInput.required = true;
    audioUrlInput.setAttribute('aria-required', 'true');
  } else {
    audioUrlSection.style.display = 'none';
    audioUrlSection.setAttribute('aria-hidden', 'true');
    audioUrlInput.required = false;
    audioUrlInput.setAttribute('aria-required', 'false');
    audioUrlInput.value = '';
    clearFieldError('audioUrl');
  }
}

// 料金計算
function calculatePrice() {
  let total = 0;
  let breakdown = [];

  try {
    // メインサービス
    const mainService = document.querySelector('input[name="mainService"]:checked');
    if (mainService) {
      const price = parseInt(mainService.dataset.price, 10) || 0;
      total += price;
      if (price > 0) {
        const serviceText = mainService.parentElement.querySelector('.radio-label').textContent.split('¥')[0].trim();
        breakdown.push(`${serviceText} ¥${price.toLocaleString()}`);
      }
    }

    // お急ぎ対応
    const deadline = document.getElementById('deadline')?.value;
    if (deadline === 'rush-1week') {
      total += 1000;
      breakdown.push('お急ぎ対応（1週間） +¥1,000');
    }

    // 追加オプション
    const options = document.querySelectorAll('input[name="options"]:checked');
    options.forEach(option => {
      let price = parseInt(option.dataset.price, 10) || 0;
      let optionText = option.parentElement.textContent.trim();
      
      // コラボ追加の場合、人数に応じて価格調整
      if (option.value === 'collab') {
        const collabCount = document.getElementById('collabCount')?.value;
        if (collabCount === '5+') {
          optionText = '👥 コラボ追加 5名以上 (要相談)';
          price = 0;
        } else {
          const count = parseInt(collabCount, 10) || 1;
          price = count * 2000;
          optionText = `👥 コラボ追加 ${count}名 (+¥${price.toLocaleString()})`;
        }
      }
      
      total += price;
      if (price > 0) {
        breakdown.push(optionText);
      } else if (option.value === 'collab' && collabCount === '5+') {
        breakdown.push(optionText);
      }
    });

    // 割引
    const discounts = document.querySelectorAll('input[name="discounts"]:checked');
    discounts.forEach(discount => {
      const price = parseInt(discount.dataset.price, 10) || 0;
      total += price;
      breakdown.push(discount.parentElement.textContent.trim());
    });

    total = Math.max(0, total);

    // UI更新
    updatePriceDisplay(total, breakdown);
    
    // フォーム状態更新
    formState.totalPrice = total;
    formState.breakdown = breakdown;
    
    // フォーム検証
    validateForm();

  } catch (error) {
    console.error('Price calculation error:', error);
    announceToScreenReader('価格計算でエラーが発生しました', 'assertive');
  }
}

// 価格表示の更新
function updatePriceDisplay(total, breakdown) {
  if (totalPriceEl) {
    const priceText = total > 0 ? `¥${total.toLocaleString()}` : '無料相談';
    totalPriceEl.textContent = priceText;
    totalPriceEl.setAttribute('aria-label', `お見積もり金額: ${priceText}`);
  }
  
  if (priceBreakdownEl) {
    const breakdownText = breakdown.length > 0 
      ? breakdown.join(' + ') 
      : 'まずはお気軽にご相談ください';
    priceBreakdownEl.textContent = breakdownText;
  }
}

// フォーム全体の検証
function validateForm() {
  const clientName = document.getElementById('clientName')?.value.trim();
  const songTitle = document.getElementById('songTitle')?.value.trim();
  const mainService = document.querySelector('input[name="mainService"]:checked');
  const recordingStatus = document.querySelector('input[name="recordingStatus"]:checked')?.value;
  const audioUrl = document.getElementById('audioUrl')?.value.trim();
  
  const mainServiceVal = mainService?.value;
  
  // 基本必須項目のチェック
  let isValid = true;
  
  // 相談以外の場合は依頼者名と楽曲タイトルが必須
  if (mainServiceVal !== 'consultation') {
    if (!clientName) {
      isValid = false;
    }
    if (!songTitle) {
      isValid = false;
    }
    
    // 録音済みの場合は音源URLも必須
    if (recordingStatus === 'recorded' && !audioUrl) {
      isValid = false;
    }
  }
  
  // エラー状態も考慮
  if (formState.errors.size > 0) {
    isValid = false;
  }
  
  formState.isValid = isValid;
  
  // ボタンの状態更新
  if (generateBtn) {
    generateBtn.disabled = !isValid;
    generateBtn.setAttribute('aria-disabled', (!isValid).toString());
    
    if (!isValid) {
      generateBtn.setAttribute('aria-describedby', 'generate-help validation-error');
      if (!document.getElementById('validation-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'validation-error';
        errorDiv.className = 'sr-only';
        errorDiv.textContent = '必須項目を入力してください';
        generateBtn.parentNode.appendChild(errorDiv);
      }
    } else {
      generateBtn.setAttribute('aria-describedby', 'generate-help');
      const errorDiv = document.getElementById('validation-error');
      if (errorDiv) {
        errorDiv.remove();
      }
    }
  }
}

// リアルタイム検証のセットアップ
function setupRealTimeValidation() {
  // 必須フィールドの検証ルール
  const validationRules = {
    clientName: { required: true, minLength: 1, maxLength: 100 },
    clientContact: { required: true, minLength: 1, maxLength: 200 },
    songTitle: { required: true, minLength: 1, maxLength: 200 },
    artist: { required: true, minLength: 1, maxLength: 200 },
    songUrl: { type: 'url' },
    audioUrl: { type: 'url' },
    refUrlFull: { type: 'url' },
    refUrlPart: { type: 'url' }
  };
  
  // 各フィールドにイベントリスナーを設定
  Object.keys(validationRules).forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const rules = validationRules[fieldId];
    
    // リアルタイム検証（入力時）
    field.addEventListener('input', debounce(() => {
      validateField(fieldId, field.value, rules);
      validateForm();
    }, 300));
    
    // フォーカス時の検証（blur時）
    field.addEventListener('blur', () => {
      validateField(fieldId, field.value, rules);
      validateForm();
    });
  });
}

// デバウンス関数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// DM文章生成
function generateDMText() {
  try {
    // フォームデータの収集
    const formData = collectFormData();
    
    // 文章の組み立て
    let text = buildDMText(formData);
    
    return text;
    
  } catch (error) {
    console.error('DM text generation error:', error);
    announceToScreenReader('文章生成でエラーが発生しました', 'assertive');
    return 'エラーが発生しました。もう一度お試しください。';
  }
}

// フォームデータの収集
function collectFormData() {
  return {
    clientName: document.getElementById('clientName')?.value.trim() || '',
    clientContact: document.getElementById('clientContact')?.value.trim() || '',
    contactMethod: document.getElementById('contactMethod')?.value || '',
    songTitle: document.getElementById('songTitle')?.value.trim() || '',
    artist: document.getElementById('artist')?.value.trim() || '',
    songUrl: document.getElementById('songUrl')?.value.trim() || '',
    sourceType: document.getElementById('sourceType')?.value || '',
    bpm: document.getElementById('bpm')?.value || '',
    songKey: document.getElementById('songKey')?.value.trim() || '',
    vocalistCount: document.getElementById('vocalistCount')?.value || '',
    mainService: document.querySelector('input[name="mainService"]:checked'),
    deadline: document.getElementById('deadline')?.value || '',
    recordingStatus: document.querySelector('input[name="recordingStatus"]:checked')?.value || '',
    audioUrl: document.getElementById('audioUrl')?.value.trim() || '',
    recordingNotes: document.getElementById('recordingNotes')?.value.trim() || '',
    refUrlFull: document.getElementById('refUrlFull')?.value.trim() || '',
    refUrlPart: document.getElementById('refUrlPart')?.value.trim() || '',
    pitchCorrection: document.querySelector('input[name="pitchCorrection"]:checked')?.value || '',
    timingCorrection: document.querySelector('input[name="timingCorrection"]:checked')?.value || '',
    breathProcessing: document.querySelector('input[name="breathProcessing"]:checked')?.value || '',
    longTone: document.querySelector('input[name="longTone"]:checked')?.value || '',
    harmonyDirection: document.getElementById('harmonyDirection')?.value.trim() || '',
    effects: document.getElementById('effects')?.value.trim() || '',
    specialEffects: document.getElementById('specialEffects')?.value.trim() || '',
    additionalRequests: document.getElementById('additionalRequests')?.value.trim() || ''
  };
}

// DM文章の組み立て
function buildDMText(data) {
  let text = '';

  // 挨拶
  text += 'こんにちは！Ryuzan Mix Salonの件でご連絡いたします☺️\n\n';

  // 依頼者情報
  text += '【依頼者情報】\n';
  text += `依頼者名：${data.clientName || '未入力'}\n`;
  if (data.clientContact) text += `連絡先：${data.clientContact}\n`;
  if (data.contactMethod) {
    const methodMap = {
      'twitter': 'X（Twitter）DM',
      'email': 'メール',
      'discord': 'Discord',
      'line': 'LINE',
      'other': 'その他'
    };
    text += `希望連絡方法：${methodMap[data.contactMethod]}\n`;
  }
  text += '\n';

  // 楽曲情報
  text += '【楽曲情報】\n';
  text += `楽曲タイトル：${data.songTitle || '未入力'}\n`;
  if (data.artist) text += `アーティスト：${data.artist}\n`;
  if (data.songUrl) text += `楽曲URL：${data.songUrl}\n`;
  
  if (data.sourceType) {
    const sourceMap = {
      'original-karaoke': '公式カラオケ音源',
      'nicokaraoke': 'ニコカラオケ',
      'youtube-karaoke': 'YouTube カラオケ',
      'instrumental': 'インストゥルメンタル',
      'midi': 'MIDI・自作音源',
      'other': 'その他'
    };
    text += `使用音源：${sourceMap[data.sourceType]}\n`;
  }
  
  if (data.bpm) text += `BPM：${data.bpm}\n`;
  if (data.songKey) text += `キー：${data.songKey}\n`;
  
  if (data.vocalistCount) {
    const countMap = {
      '1': '1人（ソロ）',
      '2': '2人（デュエット）',
      '3': '3人',
      '4': '4人',
      '5+': '5人以上'
    };
    text += `歌唱人数：${countMap[data.vocalistCount]}\n`;
  }
  text += '\n';

  // 録音音源情報
  text += '【録音音源情報】\n';
  const statusMap = {
    'recorded': '録音済み',
    'not-recorded': '録音前'
  };
  text += `録音状況：${statusMap[data.recordingStatus] || '未指定'}\n`;
  
  if (data.recordingStatus === 'recorded' && data.audioUrl) {
    text += `録音音源URL：${data.audioUrl}\n`;
  }
  if (data.recordingNotes) {
    text += `録音についての追記事項：${data.recordingNotes}\n`;
  }
  text += '\n';

  // サービス内容
  if (data.mainService?.value === 'consultation') {
    text += '【ご相談内容】\n';
    text += 'MIXについて相談したいことがあります。\n\n';
  } else {
    text += '【ご希望サービス】\n';
    const serviceMap = {
      'full': '⭐ フルコーラス MIX（ハモリ2トラック込み）',
      'one': 'ワンコーラス MIX（ハモリ2トラック込み）',
      'guide-single': '🎤 ガイドボーカル作成（単体）'
    };
    text += `${serviceMap[data.mainService?.value] || '未選択'}\n`;
    
    if (data.deadline) {
      const deadlineMap = {
        'standard': '標準納期（2-3週間）',
        'rush-1week': 'お急ぎ対応（1週間）',
        'rush-3days': '超特急（3日）',
        'specific': '特定日指定'
      };
      text += `希望納期：${deadlineMap[data.deadline]}\n`;
    }
    text += '\n';

    // 参考音源
    if (data.refUrlFull || data.refUrlPart) {
      text += '【参考音源】\n';
      if (data.refUrlFull) text += `全体参考：${data.refUrlFull}\n`;
      if (data.refUrlPart) text += `部分参考：${data.refUrlPart}\n`;
      text += '\n';
    }

    // MIX詳細設定
    text += '【MIX詳細設定】\n';
    const pitchMap = {
      'complete': '完全に揃える',
      'natural': '自然に揃える',
      'minimal': 'ほぼ原音のまま',
      'custom': 'その他（具体的に）'
    };
    text += `ピッチ補正：${pitchMap[data.pitchCorrection] || '未設定'}\n`;
    
    const timingMap = {
      'tight': 'しっかり揃える',
      'loose': 'ゆるめに揃える',
      'custom': 'その他'
    };
    text += `タイミング補正：${timingMap[data.timingCorrection] || '未設定'}\n`;
    
    const breathMap = {
      'remove': '削除',
      'keep': '残す',
      'custom': 'その他'
    };
    text += `ブレス処理：${breathMap[data.breathProcessing] || '未設定'}\n`;
    
    const longToneMap = {
      'natural': '自然な長さ',
      'reference': 'リファレンスに合わせる'
    };
    text += `ロングトーン処理：${longToneMap[data.longTone] || '自然な長さ'}\n`;
    text += '\n';

    // ハモリ・エフェクト
    if (data.harmonyDirection || data.effects || data.specialEffects) {
      text += '【ハモリ・エフェクト】\n';
      if (data.harmonyDirection) text += `ハモリの方向性：${data.harmonyDirection}\n`;
      if (data.effects) text += `エフェクト：${data.effects}\n`;
      if (data.specialEffects) text += `特殊演出：${data.specialEffects}\n`;
      text += '\n';
    }

    // 追加オプション
    const options = Array.from(document.querySelectorAll('input[name="options"]:checked'));
    if (options.length > 0) {
      text += '【追加オプション】\n';
      options.forEach(opt => {
        const optionMap = {
          'harmony': 'ハモリ追加（3トラック目から）',
          'encode': '🎬 動画エンコード',
          'collab': '👥 コラボ追加',
          'guide-with-mix': '🎤 ガイドボーカル作成（MIX同時依頼）'
        };
        
        if (opt.value === 'collab') {
          const collabCount = document.getElementById('collabCount')?.value || '1';
          text += `👥 コラボ追加（${collabCount}名）\n`;
        } else {
          text += `${optionMap[opt.value] || opt.value}\n`;
        }
      });
      text += '\n';
    }

    // 割引・調整オプション
    const discounts = Array.from(document.querySelectorAll('input[name="discounts"]:checked'));
    if (discounts.length > 0) {
      text += '【割引・調整】\n';
      const discountMap = {
        'no-pitch': '🔈 ピッチ補正なし',
        'repeater': '🎁 リピーター割'
      };
      discounts.forEach(disc => {
        text += `${discountMap[disc.value] || disc.value}\n`;
      });
      text += '\n';
    }

    // その他要望
    if (data.additionalRequests) {
      text += '【その他要望】\n';
      text += `${data.additionalRequests}\n\n`;
    }
  }

  // 締めの文章
  if (data.mainService?.value === 'consultation') {
    text += 'お時間のあるときに、詳しく教えていただけると嬉しいです。\n';
  } else {
    if (data.recordingStatus === 'not-recorded') {
      text += '録音完了後に音源データをお送りいたします。録音前のご相談も可能ですので、お気軽にお声がけください。\n';
    } else {
      text += '上記URLから音源データをご確認いただけます。ご質問やご要望があればお気軽にお声がけください。\n';
    }
  }
  
  text += 'よろしくお願いいたします🌸';

  return text;
}

// イベントリスナーの設定
function setupEventListeners() {
  // フォーム変更イベント
  if (form) {
    form.addEventListener('change', calculatePrice);
    form.addEventListener('input', calculatePrice);
  }

  // コラボ人数選択時の価格更新
  const collabCountSelect = document.getElementById('collabCount');
  if (collabCountSelect) {
    collabCountSelect.addEventListener('change', calculatePrice);
  }

  // サービス選択時の制御
  document.addEventListener('change', function(e) {
    if (e.target.name === 'mainService') {
      handleServiceChange(e.target.value);
    }
  });

  // 文章生成ボタン
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerateClick);
  }

  // コピーボタン
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyClick);
  }
}

// サービス選択時の制御
function handleServiceChange(serviceValue) {
  const harmonyCheckbox = document.querySelector('input[value="harmony"]');
  const collabCheckbox = document.querySelector('input[value="collab"]');
  const guideWithMixCheckbox = document.querySelector('input[value="guide-with-mix"]');
  const allOptions = document.querySelectorAll('input[name="options"]');
  const allDiscounts = document.querySelectorAll('input[name="discounts"]');

  // 全て有効化（デフォルト）
  allOptions.forEach(option => {
    option.disabled = false;
    option.closest('.checkbox-item').style.opacity = '1';
    option.setAttribute('aria-disabled', 'false');
  });
  
  allDiscounts.forEach(discount => {
    discount.disabled = false;
    discount.closest('.checkbox-item').style.opacity = '1';
    discount.setAttribute('aria-disabled', 'false');
  });

  // サービス別制御
  switch(serviceValue) {
    case 'consultation':
      // まずは相談：全て無効化
      allOptions.forEach(option => {
        option.disabled = true;
        option.checked = false;
        option.closest('.checkbox-item').style.opacity = '0.5';
        option.setAttribute('aria-disabled', 'true');
      });
      allDiscounts.forEach(discount => {
        discount.disabled = true;
        discount.checked = false;
        discount.closest('.checkbox-item').style.opacity = '0.5';
        discount.setAttribute('aria-disabled', 'true');
      });
      break;

    case 'guide-single':
      // ガイドボーカル作成（単体）：特定オプションを無効化
      [harmonyCheckbox, collabCheckbox, guideWithMixCheckbox].forEach(checkbox => {
        if (checkbox) {
          checkbox.disabled = true;
          checkbox.checked = false;
          checkbox.closest('.checkbox-item').style.opacity = '0.5';
          checkbox.setAttribute('aria-disabled', 'true');
        }
      });
      break;
  }
  
  calculatePrice();
}

// 文章生成ボタンクリック処理
function handleGenerateClick() {
  if (!formState.isValid) {
    announceToScreenReader('必須項目を入力してください', 'assertive');
    // 最初のエラーフィールドにフォーカス
    const firstError = document.querySelector('[aria-invalid="true"]');
    if (firstError) {
      firstError.focus();
    }
    return;
  }

  try {
    const dmText = generateDMText();
    
    if (dmTextEl) {
      dmTextEl.textContent = dmText;
    }
    
    if (outputSection) {
      outputSection.classList.add('show');
      outputSection.setAttribute('aria-hidden', 'false');
      
      // スムーススクロール
      if (!prefersReducedMotion) {
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        outputSection.scrollIntoView({ block: 'start' });
      }
      
      // フォーカスを結果セクションに移動
      setTimeout(() => {
        outputSection.focus();
      }, prefersReducedMotion ? 0 : 500);
    }

    // URLを生成
    const encodedText = encodeURIComponent(dmText);
    if (twitterBtn) {
      twitterBtn.href = `https://x.com/messages/compose?recipient_id=ryuzanmix&text=${encodedText}`;
    }
    if (emailBtn) {
      emailBtn.href = `mailto:ryuzan.mix@gmail.com?subject=MIX依頼のご相談&body=${encodedText}`;
    }
    
    announceToScreenReader('DM用文章が生成されました', 'polite');
    
  } catch (error) {
    console.error('Generate DM text error:', error);
    announceToScreenReader('文章の生成に失敗しました', 'assertive');
  }
}

// コピーボタンクリック処理
async function handleCopyClick() {
  if (!dmTextEl) return;
  
  try {
    const text = dmTextEl.textContent;
    
    // Clipboard API を使用
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // フォールバック
      copyToClipboardFallback(text);
    }
    
    // 成功フィードバック
    updateCopyButtonState(true);
    announceToScreenReader('文章をクリップボードにコピーしました', 'polite');
    
  } catch (err) {
    console.error('Copy failed:', err);
    
    // フォールバック処理
    try {
      copyToClipboardFallback(dmTextEl.textContent);
      updateCopyButtonState(true);
      announceToScreenReader('文章をクリップボードにコピーしました', 'polite');
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
      announceToScreenReader('コピーに失敗しました', 'assertive');
    }
  }
}

// フォールバックコピー処理
function copyToClipboardFallback(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  const result = document.execCommand('copy');
  document.body.removeChild(textArea);
  
  if (!result) {
    throw new Error('execCommand copy failed');
  }
}

// コピーボタンの状態更新
function updateCopyButtonState(success) {
  if (!copyBtn) return;
  
  const originalText = copyBtn.innerHTML;
  const originalAriaLabel = copyBtn.getAttribute('aria-label');
  
  if (success) {
    copyBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> コピー完了！';
    copyBtn.classList.add('copied');
    copyBtn.setAttribute('aria-label', 'コピー完了');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.classList.remove('copied');
      copyBtn.setAttribute('aria-label', originalAriaLabel || 'コピー');
    }, 2000);
  }
}

// 初期化処理
function initialize() {
  // リアルタイム検証のセットアップ
  setupRealTimeValidation();
  
  // イベントリスナーの設定
  setupEventListeners();
  
  // 初期計算と表示制御
  calculatePrice();
  
  // 初期状態での録音状況表示制御
  const initialRecordingStatus = document.querySelector('input[name="recordingStatus"]:checked')?.value;
  toggleRecordingUrlSection(initialRecordingStatus === 'recorded');
  
  // アクセシビリティ設定
  setupAccessibility();
  
  // アナリティクス
  trackEvent('page', 'load', 'request_form');
}

// アクセシビリティ設定
function setupAccessibility() {
  // 出力セクションを初期状態で隠す
  if (outputSection) {
    outputSection.setAttribute('aria-hidden', 'true');
    outputSection.setAttribute('tabindex', '-1');
  }
  
  // フォームのaria-describedby設定
  const form = document.getElementById('requestForm');
  if (form) {
    form.setAttribute('novalidate', ''); // HTML5バリデーションを無効化してカスタム検証を使用
  }
}

// アナリティクス追跡
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

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', initialize);

// エラーハンドリング
window.addEventListener('error', function(e) {
  console.error('JavaScript error in request form:', e.error);
  trackEvent('error', 'javascript_error', e.error?.message || 'Unknown error', {
    page: 'request_form'
  });
});

// 未処理のPromise拒否
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection in request form:', e.reason);
  trackEvent('error', 'promise_rejection', e.reason?.message || 'Unknown rejection', {
    page: 'request_form'
  });
  e.preventDefault();
});
