// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('后台接收到消息:', request.action);
  
  if (request.action === 'saveNote') {
    console.log('准备保存笔记:', request.note);
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
  console.log('后台开始保存笔记');
  chrome.storage.local.get(['notes'], function(result) {
    try {
      // 检查笔记格式是否正确
      if (!note) {
        console.error('笔记对象为null或undefined');
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
        console.log('笔记已保存到存储:', validNote);
        // 检查是否有错误
        if (chrome.runtime.lastError) {
          console.error('保存到存储时出错:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true });
        }
      });
    } catch (e) {
      console.error('保存笔记处理过程中出错:', e);
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
      console.error('获取笔记时出错:', e);
      sendResponse({ error: e.message });
    }
  });
} 