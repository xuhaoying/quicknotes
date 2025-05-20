// 初始化
document.addEventListener('DOMContentLoaded', function() {
  try {
    // 设置标题和按钮文本
    document.getElementById('title').textContent = chrome.i18n.getMessage('extName');
    document.getElementById('clearAllBtn').textContent = chrome.i18n.getMessage('clearAll');
    document.getElementById('exportBtn').textContent = chrome.i18n.getMessage('exportNotes');
    
    // 加载笔记
    loadNotes();
    
    // 添加事件监听器
    document.getElementById('clearAllBtn').addEventListener('click', clearAllNotes);
    document.getElementById('exportBtn').addEventListener('click', showExportMenu);
  } catch (error) {
    showError('Failed to initialize popup');
  }
});

// 显示加载状态
function showLoading() {
  const notesList = document.getElementById('notesList');
  notesList.innerHTML = '<div class="loading">Loading notes...</div>';
}

// 显示错误信息
function showError(message) {
  const notesList = document.getElementById('notesList');
  notesList.innerHTML = `<div class="error-message">${message}</div>`;
}

// 加载笔记
function loadNotes() {
  showLoading();
  
  chrome.storage.local.get(['notes'], function(result) {
    try {
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
    } catch (error) {
      showError('Failed to load notes');
    }
  });
}

// 创建笔记元素
function createNoteElement(note, index) {
  try {
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
  } catch (error) {
    console.error('Failed to create note element:', error);
    return document.createElement('div');
  }
}

// 删除笔记
function deleteNote(index) {
  if (!confirm(chrome.i18n.getMessage('confirmDeleteNote'))) {
    return;
  }
  
  try {
    chrome.storage.local.get(['notes'], function(result) {
      try {
        const notes = result.notes || [];
        notes.splice(index, 1);
        
        chrome.storage.local.set({ notes: notes }, function() {
          if (chrome.runtime.lastError) {
            throw new Error(chrome.runtime.lastError);
          }
          loadNotes();
        });
      } catch (error) {
        showError('Failed to delete note');
      }
    });
  } catch (error) {
    showError('Failed to delete note');
  }
}

// 清空所有笔记
function clearAllNotes() {
  if (!confirm(chrome.i18n.getMessage('confirmClearAll'))) {
    return;
  }
  
  try {
    chrome.storage.local.set({ notes: [] }, function() {
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError);
      }
      loadNotes();
    });
  } catch (error) {
    showError('Failed to clear notes');
  }
}

// 显示导出菜单
function showExportMenu() {
  try {
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
  } catch (error) {
    showError('Failed to show export menu');
  }
}

// 导出笔记
function exportNotes(format) {
  try {
    chrome.storage.local.get(['notes'], function(result) {
      try {
        const notes = result.notes || [];
        
        if (notes.length === 0) {
          alert(chrome.i18n.getMessage('noNotesToExport'));
          return;
        }
        
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
            
          default:
            throw new Error('Unsupported export format');
        }
        
        // 创建下载链接
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        showError('Failed to export notes');
      }
    });
  } catch (error) {
    showError('Failed to export notes');
  }
} 