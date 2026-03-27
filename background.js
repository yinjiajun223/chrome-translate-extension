/**
 * background.js - 划词翻译插件后台脚本
 * 处理翻译 API 请求
 */

// ==================== 翻译 API 配置 ====================

// 使用 MyMemory 免费翻译 API
const API_CONFIG = {
  // MyMemory API（免费，无需 API Key）
  // 每日限制 1000 字符
  myMemory: {
    url: 'https://api.mymemory.translated.net/get',
    params: (text) => ({
      q: text,
      langpair: 'en|zh-CN'
    })
  },
  
  // 备用：LibreTranslate（免费开源）
  libreTranslate: {
    url: 'https://libretranslate.com/translate',
    body: (text) => ({
      q: text,
      source: 'en',
      target: 'zh',
      format: 'text'
    })
  }
};

/**
 * 使用 MyMemory API 翻译
 * @param {string} text - 要翻译的文本
 * @returns {Promise<string>} - 翻译结果
 */
async function translateWithMyMemory(text) {
  const url = new URL(API_CONFIG.myMemory.url);
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'en|zh-CN');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  
  throw new Error(data.responseDetails || '翻译失败');
}

/**
 * 主翻译函数
 * @param {string} text - 要翻译的文本
 * @returns {Promise<string>} - 翻译结果
 */
async function translateText(text) {
  if (!text || !text.trim()) {
    return '';
  }

  // 限制文本长度
  const maxLength = 500;
  const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  try {
    // 尝试 MyMemory API
    const result = await translateWithMyMemory(truncated);
    return result;
  } catch (error) {
    console.error('翻译失败:', error);
    
    // 如果 API 失败，尝试返回原文或者简单的处理
    // 可以在这里添加其他翻译 API 的备用方案
    return `[翻译失败] ${text}`;
  }
}

// ==================== 消息处理 ====================

/**
 * 处理来自 content script 的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    // 异步处理
    translateText(message.text)
      .then(translation => {
        // 记录翻译次数
        trackUsage();
        sendResponse({ translation });
      })
      .catch(error => {
        console.error('翻译错误:', error);
        sendResponse({ translation: message.text, error: error.message });
      });
    
    // 返回 true 表示异步响应
    return true;
  }
});

/**
 * 追踪翻译使用量
 */
async function trackUsage() {
  const result = await chrome.storage.local.get(['translationCount', 'lastResetDate']);
  let count = result.translationCount || 0;
  const lastReset = result.lastResetDate;
  
  // 每天重置
  const today = new Date().toDateString();
  if (lastReset !== today) {
    count = 0;
  }
  
  count++;
  await chrome.storage.local.set({ 
    translationCount: count, 
    lastResetDate: today 
  });
}

// ==================== 安装提示 ====================

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('划词翻译插件已安装');
  } else if (details.reason === 'update') {
    console.log('划词翻译插件已更新');
  }
});

console.log('划词翻译插件后台脚本已加载');
