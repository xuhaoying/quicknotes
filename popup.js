// 初始化
document.addEventListener('DOMContentLoaded', function() {
  // 设置标题和按钮文本
  document.getElementById('title').textContent = chrome.i18n.getMessage('extName');
  document.getElementById('clearAllBtn').textContent = chrome.i18n.getMessage('clearAll');
  document.getElementById('exportBtn').textContent = chrome.i18n.getMessage('exportNotes');
  
  // 加载笔记
  loadNotes();
  
  // 添加事件监听器
  document.getElementById('clearAllBtn').addEventListener('click', clearAllNotes);
  document.getElementById('exportBtn').addEventListener('click', showExportMenu);
});

// 加载笔记
function loadNotes() {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    const notesList = document.getElementById('notesList');
    const notesCount = document.getElementById('notesCount');
    
    // 更新笔记数量
    notesCount.textContent = chrome.i18n.getMessage('notesCount', [notes.length]);
    
    // 清空现有笔记
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
      notesList.innerHTML = `<div class="no-notes">${chrome.i18n.getMessage('noNotes')}</div>`;
      return;
    }
    
    // 按时间倒序排序
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // 添加笔记
    notes.forEach((note, index) => {
      const noteElement = createNoteElement(note, index);
      notesList.appendChild(noteElement);
    });
  });
}

// 创建笔记元素
function createNoteElement(note, index) {
  const noteDiv = document.createElement('div');
  noteDiv.className = 'note-item';
  
  // 添加高亮文本
  if (note.highlightedText) {
    const highlightText = document.createElement('div');
    highlightText.className = 'note-text highlight-text';
    highlightText.textContent = note.highlightedText;
    noteDiv.appendChild(highlightText);
  }
  
  // 添加用户笔记
  if (note.note) {
    const noteText = document.createElement('div');
    noteText.className = 'note-text user-note';
    noteText.textContent = note.note;
    noteDiv.appendChild(noteText);
  }
  
  // 添加分隔线
  if (note.highlightedText && note.note) {
    const divider = document.createElement('div');
    divider.className = 'note-divider';
    noteDiv.appendChild(divider);
  }
  
  // 添加来源链接
  const urlLink = document.createElement('a');
  urlLink.className = 'note-url';
  urlLink.href = note.url;
  urlLink.textContent = note.title || note.url;
  urlLink.target = '_blank';
  noteDiv.appendChild(urlLink);
  
  // 添加时间戳
  const meta = document.createElement('div');
  meta.className = 'note-meta';
  meta.textContent = new Date(note.timestamp).toLocaleString();
  noteDiv.appendChild(meta);
  
  // 添加删除按钮
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-note-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = chrome.i18n.getMessage('deleteNote');
  deleteBtn.onclick = () => deleteNote(index);
  
  const actions = document.createElement('div');
  actions.className = 'note-actions';
  actions.appendChild(deleteBtn);
  noteDiv.appendChild(actions);
  
  return noteDiv;
}

// 删除笔记
function deleteNote(index) {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    notes.splice(index, 1);
    
    chrome.storage.local.set({ notes: notes }, function() {
      loadNotes();
    });
  });
}

// 清空所有笔记
function clearAllNotes() {
  if (confirm(chrome.i18n.getMessage('confirmClearAll'))) {
    chrome.storage.local.set({ notes: [] }, function() {
      loadNotes();
    });
  }
}

// 显示导出菜单
function showExportMenu() {
  const menu = document.createElement('div');
  menu.className = 'export-menu';
  menu.innerHTML = `
    <h3>${chrome.i18n.getMessage('exportFormat')}</h3>
    <button class="export-option-btn" data-format="txt">${chrome.i18n.getMessage('exportTxt')}</button>
    <button class="export-option-btn" data-format="md">${chrome.i18n.getMessage('exportMd')}</button>
    <button class="export-option-btn" data-format="json">${chrome.i18n.getMessage('exportJson')}</button>
    <button class="export-cancel-btn">${chrome.i18n.getMessage('cancel')}</button>
  `;
  
  // 添加事件监听器
  menu.querySelectorAll('.export-option-btn').forEach(btn => {
    btn.onclick = () => {
      exportNotes(btn.dataset.format);
      menu.remove();
    };
  });
  
  menu.querySelector('.export-cancel-btn').onclick = () => menu.remove();
  
  document.body.appendChild(menu);
}

// 导出笔记
function exportNotes(format) {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    let content = '';
    let filename = 'notes';
    let mimeType = 'text/plain';
    
    switch (format) {
      case 'txt':
        content = notes.map(note => {
          let text = '';
          if (note.highlightedText) {
            text += `Highlight: ${note.highlightedText}\n`;
          }
          if (note.note) {
            text += `Note: ${note.note}\n`;
          }
          text += `Source: ${note.title || note.url}\n`;
          text += `Time: ${new Date(note.timestamp).toLocaleString()}\n`;
          text += '---\n';
          return text;
        }).join('\n');
        filename += '.txt';
        break;
        
      case 'md':
        content = notes.map(note => {
          let text = '';
          if (note.highlightedText) {
            text += `> ${note.highlightedText}\n\n`;
          }
          if (note.note) {
            text += `${note.note}\n\n`;
          }
          text += `[Source](${note.url}) - ${new Date(note.timestamp).toLocaleString()}\n`;
          text += '---\n';
          return text;
        }).join('\n');
        filename += '.md';
        mimeType = 'text/markdown';
        break;
        
      case 'json':
        content = JSON.stringify(notes, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
    }
    
    // 创建下载链接
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });
} 