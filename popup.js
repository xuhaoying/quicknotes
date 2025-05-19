// 当弹出窗口打开时加载笔记
document.addEventListener('DOMContentLoaded', function() {
  loadNotes();
  
  // 添加按钮容器 - 用于放置所有操作按钮
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  
  // 添加清空全部笔记按钮
  const clearButton = document.createElement('button');
  clearButton.textContent = '清空全部笔记';
  clearButton.className = 'clear-all-btn';
  clearButton.onclick = confirmClearAllNotes;
  
  // 添加导出按钮
  const exportButton = document.createElement('button');
  exportButton.textContent = '导出笔记';
  exportButton.className = 'export-btn';
  exportButton.onclick = showExportOptions;
  
  // 将按钮添加到容器
  buttonContainer.appendChild(exportButton);
  buttonContainer.appendChild(clearButton);
  
  // 添加到页面
  const container = document.querySelector('.container');
  const title = document.querySelector('h1');
  container.insertBefore(buttonContainer, title.nextSibling);
});

// 显示导出选项
function showExportOptions() {
  // 获取笔记数据
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    
    if (notes.length === 0) {
      alert('没有笔记可供导出');
      return;
    }
    
    // 创建导出菜单
    const exportMenu = document.createElement('div');
    exportMenu.className = 'export-menu';
    
    // 创建标题
    const title = document.createElement('h3');
    title.textContent = '选择导出格式';
    exportMenu.appendChild(title);
    
    // 创建导出选项按钮
    const jsonBtn = document.createElement('button');
    jsonBtn.textContent = '导出为 JSON';
    jsonBtn.className = 'export-option-btn';
    jsonBtn.onclick = () => exportNotes(notes, 'json');
    
    const textBtn = document.createElement('button');
    textBtn.textContent = '导出为纯文本';
    textBtn.className = 'export-option-btn';
    textBtn.onclick = () => exportNotes(notes, 'text');
    
    const markdownBtn = document.createElement('button');
    markdownBtn.textContent = '导出为 Markdown';
    markdownBtn.className = 'export-option-btn';
    markdownBtn.onclick = () => exportNotes(notes, 'markdown');
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '取消';
    closeBtn.className = 'export-cancel-btn';
    closeBtn.onclick = () => document.body.removeChild(exportMenu);
    
    // 添加按钮到菜单
    exportMenu.appendChild(jsonBtn);
    exportMenu.appendChild(textBtn);
    exportMenu.appendChild(markdownBtn);
    exportMenu.appendChild(closeBtn);
    
    // 添加菜单到页面
    document.body.appendChild(exportMenu);
  });
}

// 导出笔记函数
function exportNotes(notes, format) {
  let content = '';
  let filename = `web-notes-${new Date().toISOString().split('T')[0]}`;
  let dataType = '';
  
  if (format === 'json') {
    content = JSON.stringify(notes, null, 2);
    filename += '.json';
    dataType = 'application/json';
  } 
  else if (format === 'markdown') {
    content = notes.map(note => {
      let noteText = `# ${note.title}\n\n`;
      noteText += `*${new Date(note.timestamp).toLocaleString()}*\n\n`;
      noteText += `来源: ${note.url}\n\n`;
      
      if (note.highlightedText) {
        noteText += `> ${note.highlightedText}\n\n`;
      }
      
      if (note.note) {
        noteText += `${note.note}\n\n`;
      }
      
      noteText += `---\n\n`;
      return noteText;
    }).join('');
    
    filename += '.md';
    dataType = 'text/markdown';
  }
  else { // 纯文本格式
    content = notes.map(note => {
      let noteText = `【网站标题】${note.title}\n`;
      noteText += `【时间】${new Date(note.timestamp).toLocaleString()}\n`;
      noteText += `【网址】${note.url}\n`;
      
      if (note.highlightedText) {
        noteText += `【引用文本】${note.highlightedText}\n`;
      }
      
      if (note.note) {
        noteText += `【我的笔记】${note.note}\n`;
      }
      
      noteText += `\n----------------------\n\n`;
      return noteText;
    }).join('');
    
    filename += '.txt';
    dataType = 'text/plain';
  }
  
  // 创建下载链接
  const blob = new Blob([content], { type: dataType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // 模拟点击下载
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 移除导出菜单
    const exportMenu = document.querySelector('.export-menu');
    if (exportMenu) {
      document.body.removeChild(exportMenu);
    }
  }, 100);
}

// 确认是否清空所有笔记
function confirmClearAllNotes() {
  if (confirm('确定要清空所有笔记吗？这个操作不可撤销。')) {
    chrome.storage.local.set({ notes: [] }, function() {
      loadNotes(); // 重新加载笔记列表（此时为空）
    });
  }
}

// 加载所有笔记
function loadNotes() {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
      notesList.innerHTML = '<p class="no-notes">暂无笔记</p>';
      return;
    }
    
    // 显示笔记总数
    const countElement = document.createElement('div');
    countElement.className = 'notes-count';
    countElement.textContent = `共 ${notes.length} 条笔记`;
    notesList.appendChild(countElement);
    
    // 按时间倒序排列笔记
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    notes.forEach((note, index) => {
      const noteElement = createNoteElement(note, index);
      notesList.appendChild(noteElement);
    });
  });
}

// 创建笔记元素
function createNoteElement(note, index) {
  const div = document.createElement('div');
  div.className = 'note-item';
  div.dataset.index = index;
  
  const date = new Date(note.timestamp);
  const formattedDate = date.toLocaleString();
  
  let html = '';
  
  // 添加删除按钮
  html += `<div class="note-actions">
    <button class="delete-note-btn" title="删除此笔记">×</button>
  </div>`;
  
  if (note.highlightedText) {
    html += `<div class="note-text highlight-text"><strong>引用文本：</strong>${note.highlightedText}</div>`;
  }
  
  if (note.note) {
    html += `<div class="note-text user-note"><strong>我的笔记：</strong>${note.note}</div>`;
  }
  
  html += `
    <div class="note-meta">
      <a href="${note.url}" class="note-url" target="_blank">${note.url}</a>
      <span> - ${formattedDate}</span>
    </div>
  `;
  
  div.innerHTML = html;
  
  // 添加删除笔记事件监听
  setTimeout(() => {
    const deleteBtn = div.querySelector('.delete-note-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        deleteNote(index);
      });
    }
  }, 0);
  
  return div;
}

// 删除指定笔记
function deleteNote(index) {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    if (index >= 0 && index < notes.length) {
      if (confirm('确定要删除这条笔记吗？')) {
        notes.splice(index, 1);
        chrome.storage.local.set({ notes: notes }, function() {
          loadNotes(); // 重新加载笔记列表
        });
      }
    }
  });
} 