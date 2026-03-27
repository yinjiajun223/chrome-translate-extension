// popup.js - 显示翻译配额

document.addEventListener('DOMContentLoaded', async () => {
  // 获取存储的使用量
  const result = await chrome.storage.local.get(['translationCount', 'lastResetDate']);
  
  let count = result.translationCount || 0;
  const lastReset = result.lastResetDate;
  
  // 检查是否需要重置（每天重置）
  const today = new Date().toDateString();
  if (lastReset !== today) {
    count = 0;
    await chrome.storage.local.set({ 
      translationCount: 0, 
      lastResetDate: today 
    });
  }
  
  // 估算剩余次数（假设平均每次翻译 50 字符，1000 字符 = 20 次）
  const maxPerDay = 20;
  const remaining = Math.max(0, maxPerDay - count);
  
  document.getElementById('quota').textContent = remaining + ' 次';
  
  // 更新存储的计数
  await chrome.storage.local.set({ translationCount: count });
});
