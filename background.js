// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    saveNote(request.note);
  } else if (request.action === 'getNote') {
    getNote(request.url, request.text, sendResponse);
    return true; // 保持消息通道开放，以便异步响应
  }
});

// 保存笔记
function saveNote(note) {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    notes.push(note);
    chrome.storage.local.set({ notes: notes });
  });
}

// 获取特定笔记
function getNote(url, text, sendResponse) {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    const note = notes.find(n => n.url === url && n.highlightedText === text);
    sendResponse({ note: note });
  });
} 