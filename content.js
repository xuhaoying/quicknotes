// 存储当前选中的文本
let selectedText = '';
let noteInput = null;
let isSelectionInProgress = false;

// 只监听 mouseup 事件，简化逻辑
document.addEventListener('mouseup', handleMouseUp);

// 处理鼠标释放事件
function handleMouseUp(e) {
  // 检查是否点击了输入框内部，如果是，不处理
  if (noteInput && noteInput.contains(e.target)) {
    return;
  }
  
  // 增加延时，确保选择完成
  setTimeout(() => {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
    
    // 只在有足够长的选中文本时创建输入框
    if (selectedText && selectedText.length > 3) {
      console.log('选中文本:', selectedText);
      
      // 移除现有的笔记输入框
      if (noteInput) {
        try {
          noteInput.remove();
        } catch (e) {
          console.error('Error removing note input:', e);
        }
      }
      
      // 创建笔记输入框，使用简单的位置计算
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const x = Math.max(5, rect.right + window.scrollX);
        const y = Math.max(5, rect.bottom + window.scrollY + 5); // 稍微偏下一点
        createNoteInput(x, y);
      } catch (e) {
        console.error('Error getting selection position:', e);
        // 如果获取位置失败，使用鼠标位置
        createNoteInput(e.pageX, e.pageY);
      }
    }
  }, 50); // 短延时，确保选择已完成
}

// 创建笔记输入框
function createNoteInput(x, y) {
  console.log('创建笔记输入框', x, y);
  
  // 创建主容器
  noteInput = document.createElement('div');
  noteInput.className = 'note-input';
  
  // 设置内联样式确保显示
  Object.assign(noteInput.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: '2147483647',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    width: '300px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    color: '#333'
  });
  
  // 创建文本区域
  const textarea = document.createElement('textarea');
  Object.assign(textarea.style, {
    width: '100%',
    minHeight: '80px',
    marginBottom: '10px',
    padding: '8px',
    boxSizing: 'border-box',
    border: '1px solid #ddd',
    borderRadius: '3px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  });
  textarea.placeholder = '添加笔记...';
  
  // 将选中的文字自动填入笔记框，作为引用文本
  if (selectedText) {
    textarea.value = `"${selectedText}"\n\n`;
    // 将光标定位到文本末尾
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }, 0);
  }
  
  // 创建按钮容器
  const btnGroup = document.createElement('div');
  btnGroup.style.textAlign = 'right';
  
  // 保存按钮
  const saveButton = document.createElement('button');
  Object.assign(saveButton.style, {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px'
  });
  saveButton.textContent = '保存笔记';
  saveButton.onclick = saveNote;
  
  // 取消按钮
  const cancelButton = document.createElement('button');
  Object.assign(cancelButton.style, {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '3px',
    marginLeft: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  });
  cancelButton.textContent = '取消';
  cancelButton.onclick = cancelNote;
  
  // 组装DOM
  btnGroup.appendChild(saveButton);
  btnGroup.appendChild(cancelButton);
  noteInput.appendChild(textarea);
  noteInput.appendChild(btnGroup);
  
  // 添加到页面
  try {
    document.body.appendChild(noteInput);
    // 自动聚焦到文本框并将光标移到末尾
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
  } catch (e) {
    console.error('Error appending note input to body:', e);
    try {
      // 备选方案：添加到文档
      document.documentElement.appendChild(noteInput);
      textarea.focus();
    } catch (e2) {
      console.error('Error appending note input to documentElement:', e2);
    }
  }
  
  // 点击外部关闭
  document.addEventListener('mousedown', handleClickOutside);
}

// 处理点击外部
function handleClickOutside(e) {
  if (noteInput && !noteInput.contains(e.target)) {
    cancelNote();
    document.removeEventListener('mousedown', handleClickOutside);
  }
}

// 保存笔记
function saveNote() {
  if (!noteInput) {
    console.error('保存失败：笔记输入框不存在');
    return;
  }
  
  const textarea = noteInput.querySelector('textarea');
  if (!textarea) {
    console.error('保存失败：找不到文本区域');
    return;
  }
  
  // 获取原始文本内容
  let rawText = textarea.value.trim();
  console.log('原始笔记内容:', rawText);
  
  // 如果文本区域为空且没有选中文本，则不保存
  if (!rawText && !selectedText) {
    console.log('没有内容可保存，取消保存');
    closeNoteInput();
    return;
  }
  
  // 移除引用文本部分，避免重复保存
  if (selectedText && rawText.startsWith(`"${selectedText}"`)) {
    // 移除引用文本和后面最多两个换行符
    rawText = rawText.substring(`"${selectedText}"`.length).trim();
    if (rawText.startsWith('\n\n')) {
      rawText = rawText.substring(2).trim();
    } else if (rawText.startsWith('\n')) {
      rawText = rawText.substring(1).trim();
    }
  }
  
  // 准备笔记对象
  const note = {
    highlightedText: selectedText || '',
    note: rawText || '',
    url: window.location.href,
    title: document.title || '无标题',
    timestamp: new Date().toISOString()
  };
  
  console.log('正在保存笔记对象:', note);
  
  // 保存到本地存储
  saveNoteLocally(note);
}

// 保存笔记到本地，尝试通过后台脚本，如果失败则直接保存
function saveNoteLocally(note) {
  try {
    // 先显示保存中提示
    showSavingNotification();
    
    // 尝试通过消息发送到后台
    chrome.runtime.sendMessage({
      action: 'saveNote',
      note: note
    }, function(response) {
      // 检查是否发生了错误
      if (chrome.runtime.lastError) {
        console.error('消息发送错误:', chrome.runtime.lastError);
        // 如果是上下文失效错误，尝试直接保存
        directlySaveNote(note);
        return;
      }
      
      console.log('保存笔记响应:', response);
      
      if (response && response.success) {
        console.log('笔记保存成功');
        // 尝试高亮选中的文本
        tryHighlightText();
        // 显示保存成功提示
        showSavedNotification();
      } else {
        console.error('通过后台保存失败，尝试直接保存:', response ? response.error : '未知错误');
        // 尝试直接保存
        directlySaveNote(note);
        return;
      }
      
      // 关闭笔记输入框
      closeNoteInput();
    });
  } catch (error) {
    console.error('保存过程中发生错误:', error);
    // 尝试直接保存
    directlySaveNote(note);
  }
}

// 直接保存笔记到本地存储（不通过后台脚本）
function directlySaveNote(note) {
  try {
    // 直接使用 chrome.storage.local API
    chrome.storage.local.get(['notes'], function(result) {
      if (chrome.runtime.lastError) {
        console.error('读取存储时出错:', chrome.runtime.lastError);
        showErrorNotification('无法访问存储。请刷新页面后重试。');
        return;
      }
      
      const notes = result.notes || [];
      notes.push(note);
      
      chrome.storage.local.set({ notes: notes }, function() {
        if (chrome.runtime.lastError) {
          console.error('写入存储时出错:', chrome.runtime.lastError);
          showErrorNotification('保存失败。请刷新页面后重试。');
          return;
        }
        
        console.log('笔记直接保存成功');
        tryHighlightText();
        showSavedNotification();
        closeNoteInput();
      });
    });
  } catch (error) {
    console.error('直接保存失败:', error);
    showErrorNotification('保存笔记时发生错误，请刷新页面后重试。');
    // 仍然关闭输入框，避免用户困惑
    closeNoteInput();
  }
}

// 尝试高亮文本的辅助函数
function tryHighlightText() {
  try {
    if (selectedText) {
      highlightSelectedText();
    }
  } catch (e) {
    console.error('高亮文本失败:', e);
  }
}

// 显示保存中的通知
function showSavingNotification() {
  const notification = document.createElement('div');
  notification.id = 'web-notes-saving-notification';
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    zIndex: '2147483647',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    fontFamily: 'Arial, sans-serif'
  });
  notification.textContent = '正在保存笔记...';
  
  document.body.appendChild(notification);
}

// 显示保存成功的通知
function showSavedNotification() {
  // 移除保存中通知
  const savingNotification = document.getElementById('web-notes-saving-notification');
  if (savingNotification) {
    savingNotification.remove();
  }
  
  const notification = document.createElement('div');
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    zIndex: '2147483647',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    fontFamily: 'Arial, sans-serif'
  });
  notification.textContent = '笔记保存成功！';
  
  document.body.appendChild(notification);
  
  // 2秒后自动消失
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// 显示错误通知
function showErrorNotification(message) {
  // 移除保存中通知
  const savingNotification = document.getElementById('web-notes-saving-notification');
  if (savingNotification) {
    savingNotification.remove();
  }
  
  const notification = document.createElement('div');
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#f44336',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    zIndex: '2147483647',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    fontFamily: 'Arial, sans-serif'
  });
  notification.textContent = message || '保存失败，请重试';
  
  document.body.appendChild(notification);
  
  // 3秒后自动消失
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 关闭笔记输入框
function closeNoteInput() {
  if (noteInput) {
    noteInput.remove();
    noteInput = null;
    selectedText = '';
    // 移除点击外部的事件监听
    document.removeEventListener('mousedown', handleClickOutside);
  }
}

// 取消记笔记
function cancelNote() {
  console.log('取消记笔记');
  closeNoteInput();
}

// 高亮选中的文本
function highlightSelectedText() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  try {
    const range = selection.getRangeAt(0);
    
    // 更安全的高亮方法
    try {
      // 尝试简单的包裹方法
      const span = document.createElement('span');
      span.className = 'web-notes-highlight';
      span.style.backgroundColor = '#ffeb3b';
      span.style.cursor = 'pointer';
      span.dataset.timestamp = new Date().toISOString(); // 添加时间戳用于识别
      range.surroundContents(span);
      selection.removeAllRanges(); // 清除选区
    } catch (e) {
      console.log('简单高亮失败，尝试复杂方法:', e);
      
      // 如果简单方法失败（通常是因为选择跨越多个元素），使用复杂方法
      const highlightId = 'highlight-' + Date.now();
      const highlightClass = 'web-notes-highlight';
      
      // 创建临时标记以标识范围起点和终点
      const startMarker = document.createElement('span');
      startMarker.id = 'start-' + highlightId;
      const endMarker = document.createElement('span');
      endMarker.id = 'end-' + highlightId;
      
      // 克隆范围以不影响原始选择
      const tempRange = range.cloneRange();
      
      // 插入标记
      tempRange.collapse(true);
      tempRange.insertNode(startMarker);
      tempRange.setEnd(range.endContainer, range.endOffset);
      tempRange.collapse(false);
      tempRange.insertNode(endMarker);
      
      // 获取包含这两个标记的所有节点
      const walker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null, 
        false
      );
      
      // 寻找开始标记
      let node;
      let startFound = false;
      let endFound = false;
      
      while (node = walker.nextNode()) {
        // 检查节点是否在标记之间
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        
        const nodeBefore = nodeRange.compareBoundaryPoints(Range.START_TO_END, tempRange) <= 0;
        const nodeAfter = nodeRange.compareBoundaryPoints(Range.END_TO_START, tempRange) >= 0;
        
        if (!nodeBefore && !nodeAfter) {
          // 节点在范围内，高亮它
          const span = document.createElement('span');
          span.className = highlightClass;
          span.style.backgroundColor = '#ffeb3b';
          span.style.cursor = 'pointer';
          node.parentNode.insertBefore(span, node);
          span.appendChild(node);
        }
      }
      
      // 移除临时标记
      if (startMarker.parentNode) startMarker.parentNode.removeChild(startMarker);
      if (endMarker.parentNode) endMarker.parentNode.removeChild(endMarker);
    }
  } catch (e) {
    console.error('Error highlighting text:', e);
  }
}

// 点击高亮文本时显示笔记
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('web-notes-highlight')) {
    // 获取该高亮文本内容
    const highlightedText = e.target.textContent;
    
    // 尝试从本地存储获取笔记
    try {
      chrome.storage.local.get(['notes'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('获取笔记数据时出错:', chrome.runtime.lastError);
          alert('无法加载笔记数据，请刷新页面后重试');
          return;
        }
        
        const notes = result.notes || [];
        const note = notes.find(n => n.url === window.location.href && n.highlightedText === highlightedText);
        
        if (note) {
          // 显示笔记内容
          showNotePopup(note, e);
        } else {
          // 尝试通过后台获取
          tryGetNoteFromBackground(highlightedText, e);
        }
      });
    } catch (error) {
      console.error('获取高亮笔记时出错:', error);
      // 尝试通过后台获取
      tryGetNoteFromBackground(highlightedText, e);
    }
  }
});

// 通过后台脚本获取笔记
function tryGetNoteFromBackground(text, event) {
  try {
    chrome.runtime.sendMessage({
      action: 'getNote',
      url: window.location.href,
      text: text
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.error('获取笔记消息发送出错:', chrome.runtime.lastError);
        alert(`未找到相关笔记`);
        return;
      }
      
      if (response && response.note) {
        showNotePopup(response.note, event);
      } else {
        alert(`未找到相关笔记`);
      }
    });
  } catch (error) {
    console.error('通过后台获取笔记失败:', error);
    alert(`未找到相关笔记`);
  }
}

// 显示笔记弹窗
function showNotePopup(note, event) {
  // 先移除已有的弹窗
  const existingPopup = document.querySelector('.web-notes-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // 创建弹窗
  const popup = document.createElement('div');
  popup.className = 'web-notes-popup';
  
  // 设置样式
  Object.assign(popup.style, {
    position: 'absolute',
    left: `${event.pageX}px`,
    top: `${event.pageY + 20}px`,
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: '2147483647',
    maxWidth: '400px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px'
  });
  
  // 创建内容
  let html = '';
  
  // 只显示高亮文本
  if (note.highlightedText) {
    html += `<div style="color: #666; font-style: italic; margin-bottom: 8px; border-left: 3px solid #4CAF50; padding-left: 8px;">"${note.highlightedText}"</div>`;
  }
  
  // 只有当用户笔记内容不为空时才显示
  if (note.note && note.note.trim() !== '') {
    html += `<div style="margin-bottom: 8px;">${note.note}</div>`;
  }
  
  const date = new Date(note.timestamp);
  html += `<div style="font-size: 12px; color: #999;">${date.toLocaleString()}</div>`;
  
  popup.innerHTML = html;
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  Object.assign(closeButton.style, {
    position: 'absolute',
    top: '5px',
    right: '5px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#999'
  });
  closeButton.onclick = () => popup.remove();
  popup.appendChild(closeButton);
  
  // 添加关闭事件
  document.addEventListener('click', function closePopup(e) {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('click', closePopup);
    }
  });
  
  // 添加到页面
  document.body.appendChild(popup);
}

// 处理键盘事件：Esc键关闭输入框
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && noteInput) {
    cancelNote();
  }
}); 