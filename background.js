// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    saveNote(request.note, sendResponse);
    return true; // 保持消息通道开放，以便异步响应
  } else if (request.action === 'getNote') {
    getNote(request.url, request.text, sendResponse);
    return true; // 保持消息通道开放，以便异步响应
  }
});

// 添加扩展安装和更新时的监听器
chrome.runtime.onInstalled.addListener((details) => {
  console.log('扩展已安装或更新:', details.reason);
  
  // 为特定网站添加额外权限
  const specialSites = [
    "https://ahrefs.com/*",
    "https://*.ahrefs.com/*"
  ];
  
  // 确保扩展在这些网站上有正确的权限
  chrome.permissions.contains({ origins: specialSites }, (hasPermission) => {
    if (!hasPermission) {
      console.log('请求特定网站的额外权限');
      // 这里仅记录，不主动请求权限，避免打扰用户
      // 实际上content_scripts已经有权限通过manifest.json中的配置
    }
  });
});

// 保存笔记
function saveNote(note, sendResponse) {
  chrome.storage.local.get(['notes'], function(result) {
    try {
      // 检查笔记格式是否正确
      if (!note) {
        sendResponse({ success: false, error: '笔记格式错误: 对象为空' });
        return;
      }
      
      // 准备要保存的笔记
      const notes = result.notes || [];
      
      // 确保笔记有必要的字段
      const validNote = {
        highlightedText: note.highlightedText || '',
        note: note.note || '',
        url: note.url || '',
        title: note.title || '无标题页面',
        timestamp: note.timestamp || new Date().toISOString()
      };
      
      // 添加到笔记列表
      notes.push(validNote);
      
      // 保存到 Chrome 存储
      chrome.storage.local.set({ notes: notes }, function() {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true });
        }
      });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
  });
}

// 获取特定笔记
function getNote(url, text, sendResponse) {
  chrome.storage.local.get(['notes'], function(result) {
    try {
      const notes = result.notes || [];
      const note = notes.find(n => n.url === url && n.highlightedText === text);
      sendResponse({ note: note });
    } catch (e) {
      sendResponse({ error: e.message });
    }
  });
}

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  // 注入 content script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  
  // 注入样式
  chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['styles.css']
  });
}); 