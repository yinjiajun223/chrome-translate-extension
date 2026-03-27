/**
 * content.js - 划词翻译插件内容脚本
 * 处理选区检测、按钮显示、翻译请求和结果展示
 */

// 全局状态
let translateButton = null;
let translatePopup = null;
let isTranslating = false;
let currentSelection = '';

// ==================== 翻译功能 ====================

/**
 * 发送翻译请求到后台脚本
 * @param {string} text - 要翻译的文本
 * @returns {Promise<string>} - 翻译结果
 */
async function translateText(text) {
  return new Promise((resolve) => {
    // 发送到 background.js 处理
    chrome.runtime.sendMessage(
      { action: 'translate', text: text },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('翻译请求失败:', chrome.runtime.lastError);
          resolve(text); // 失败返回原文
        } else {
          resolve(response?.translation || text);
        }
      }
    );
  });
}

// ==================== UI 创建 ====================

/**
 * 创建翻译按钮
 */
function createTranslateButton() {
  if (translateButton) {
    translateButton.remove();
  }

  translateButton = document.createElement('div');
  translateButton.id = 'translate-btn';
  translateButton.innerHTML = '翻译';
  translateButton.style.display = 'none';
  document.body.appendChild(translateButton);

  // 点击翻译
  translateButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isTranslating || !currentSelection) return;
    
    await performTranslation(currentSelection);
  });
}

/**
 * 创建翻译结果弹窗
 */
function createTranslatePopup() {
  if (translatePopup) {
    translatePopup.remove();
  }

  translatePopup = document.createElement('div');
  translatePopup.id = 'translate-popup';
  translatePopup.innerHTML = `
    <div class="translate-popup-header">
      <span class="translate-popup-title">翻译结果</span>
      <span class="translate-popup-close">×</span>
    </div>
    <div class="translate-popup-content">
      <div class="translate-original"></div>
      <div class="translate-result"></div>
    </div>
    <div class="translate-popup-loading">翻译中...</div>
  `;
  translatePopup.style.display = 'none';
  document.body.appendChild(translatePopup);

  // 点击关闭按钮
  translatePopup.querySelector('.translate-popup-close').addEventListener('click', () => {
    hidePopup();
  });

  // 点击弹窗时不关闭（阻止冒泡）
  translatePopup.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 点击其他地方关闭
  document.addEventListener('click', (e) => {
    if (translatePopup.style.display === 'block' && 
        !translatePopup.contains(e.target) && 
        !translateButton?.contains(e.target)) {
      hidePopup();
    }
  });
}

// ==================== 翻译执行 ====================

/**
 * 执行翻译
 * @param {string} text - 要翻译的文本
 */
async function performTranslation(text) {
  if (!text || isTranslating) return;

  isTranslating = true;
  
  // 显示 loading
  showPopup(text, '翻译中...', true);

  try {
    const result = await translateText(text);
    showPopup(text, result, false);
  } catch (error) {
    console.error('翻译错误:', error);
    showPopup(text, '翻译失败', false);
  } finally {
    isTranslating = false;
  }
}

/**
 * 显示翻译结果弹窗
 * @param {string} original - 原文
 * @param {string} result - 翻译结果
 * @param {boolean} loading - 是否显示加载中
 */
function showPopup(original, result, loading) {
  if (!translatePopup) createTranslatePopup();

  const popup = translatePopup;
  const originalEl = popup.querySelector('.translate-original');
  const resultEl = popup.querySelector('.translate-result');
  const loadingEl = popup.querySelector('.translate-popup-loading');

  originalEl.textContent = original;
  
  if (loading) {
    resultEl.style.display = 'none';
    loadingEl.style.display = 'block';
  } else {
    resultEl.textContent = result;
    resultEl.style.display = 'block';
    loadingEl.style.display = 'none';
  }

  // 计算位置（按钮上方）
  const btnRect = translateButton.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let left = btnRect.left + scrollX;
  let top = btnRect.top + scrollY - 10;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  popup.style.display = 'block';

  // 边界检测
  requestAnimationFrame(() => {
    const popupRect = popup.getBoundingClientRect();
    
    // 超出右边界
    if (popupRect.right > window.innerWidth) {
      popup.style.left = `${window.innerWidth - popupRect.width - 10 + scrollX}px`;
    }
    
    // 超出左边界
    if (popupRect.left < 0) {
      popup.style.left = `${10 + scrollX}px`;
    }

    // 超出上边界（显示在按钮下方）
    if (popupRect.top < 0) {
      popup.style.top = `${btnRect.bottom + scrollY + 10}px`;
    }
  });
}

/**
 * 隐藏翻译弹窗
 */
function hidePopup() {
  if (translatePopup) {
    translatePopup.style.display = 'none';
  }
}

// ==================== 选区检测 ====================

/**
 * 获取选区的精确位置
 */
function getSelectionRect() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // 排除空选区
  if (rect.width === 0 || rect.height === 0) return null;

  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    right: rect.right + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    width: rect.width,
    height: rect.height
  };
}

/**
 * 处理选区变化
 */
function handleSelectionChange(e) {
  // 如果点击的是弹窗或按钮，不处理
  if (e && e.target) {
    if (translatePopup?.contains(e.target) || translateButton?.contains(e.target)) {
      return;
    }
  }

  const selection = window.getSelection();
  const text = selection?.toString().trim();

  // 没有选中文本
  if (!text) {
    hideButton();
    hidePopup();
    currentSelection = '';
    return;
  }

  // 保存当前选中文本
  currentSelection = text;

  // 显示翻译按钮
  const rect = getSelectionRect();
  if (rect) {
    showButton(rect);
  }
}

/**
 * 显示翻译按钮
 * @param {Object} rect - 选区位置
 */
function showButton(rect) {
  if (!translateButton) createTranslateButton();

  // 按钮显示在选区下方居中
  const left = rect.left + (rect.width / 2) - 25;
  const top = rect.bottom + 5;

  translateButton.style.left = `${left}px`;
  translateButton.style.top = `${top}px`;
  translateButton.style.display = 'block';
}

/**
 * 隐藏翻译按钮
 */
function hideButton() {
  if (translateButton) {
    translateButton.style.display = 'none';
  }
}

// ==================== 初始化 ====================

/**
 * 初始化插件
 */
function init() {
  console.log('🦞 划词翻译插件正在初始化...');
  
  // 创建 UI
  createTranslateButton();
  createTranslatePopup();
  console.log('🦞 UI 创建完成');

  // 监听选区变化
  document.addEventListener('selectionchange', handleSelectionChange);
  
  // 监听鼠标释放（选区完成后）
  document.addEventListener('mouseup', () => {
    console.log('🦞 鼠标释放，检测选区');
    setTimeout(handleSelectionChange, 10);
  });

  // 点击页面时隐藏按钮（除非点击的是翻译按钮或弹窗）
  document.addEventListener('mousedown', (e) => {
    if (translateButton && !translateButton.contains(e.target) && !translatePopup?.contains(e.target)) {
      // 延迟处理，让 click 事件先触发
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || !selection.toString().trim()) {
          hideButton();
        }
      }, 100);
    }
  });

  console.log('🦞 划词翻译插件已加载');
}

// 确保 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
