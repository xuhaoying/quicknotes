// 存储当前选中的文本
let selectedText = '';
let noteInput = null;

// 监听 mouseup 事件
document.addEventListener('mouseup', handleMouseUp);

// 初始化扩展功能
function initializeExtension() {
  console.log('WebNotes extension initialized');
}

// 处理鼠标释放事件
function handleMouseUp(e) {
  // 检查是否点击了输入框内部
  if (noteInput && noteInput.contains(e.target)) {
    return;
  }
  
  // 使用 requestAnimationFrame 优化性能
  requestAnimationFrame(() => {
    const selection = window.getSelection();
    selectedText = selection.toString().trim();
    
    // 只在有足够长的选中文本时创建输入框
    if (selectedText && selectedText.length > 3) {
      // 移除现有的笔记输入框
      if (noteInput) {
        noteInput.remove();
      }
      
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // 确保笔记框在可见区域内
        const x = Math.max(5, rect.right + window.scrollX);
        const y = Math.max(5, rect.bottom + window.scrollY + 5);
        
        createNoteInput(x, y);
      } catch (e) {
        // 使用鼠标位置作为备选
        createNoteInput(e.pageX, e.pageY);
      }
    }
  });
}

// 创建笔记输入框
function createNoteInput(x, y) {
  // 创建主容器
  noteInput = document.createElement('div');
  noteInput.className = 'note-input';
  noteInput.style.position = 'absolute';
  noteInput.style.left = `${x}px`;
  noteInput.style.top = `${y}px`;
  noteInput.style.zIndex = '2147483647';
  
  // 创建文本区域
  const textarea = document.createElement('textarea');
  textarea.className = 'note-textarea';
  textarea.placeholder = chrome.i18n.getMessage('addNotePlaceholder');
  
  // 添加键盘事件监听
  textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  });
  
  // 将选中的文字自动填入笔记框
  if (selectedText) {
    textarea.value = `"${selectedText}"\n\n`;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }, 0);
  }
  
  // 创建按钮容器
  const btnGroup = document.createElement('div');
  btnGroup.className = 'note-buttons';
  
  // 保存按钮
  const saveButton = document.createElement('button');
  saveButton.className = 'note-button save-button';
  saveButton.textContent = chrome.i18n.getMessage('saveNote');
  saveButton.onclick = saveNote;
  
  // 取消按钮
  const cancelButton = document.createElement('button');
  cancelButton.className = 'note-button cancel-button';
  cancelButton.textContent = chrome.i18n.getMessage('cancel');
  cancelButton.onclick = cancelNote;
  
  // 组装DOM
  btnGroup.appendChild(saveButton);
  btnGroup.appendChild(cancelButton);
  noteInput.appendChild(textarea);
  noteInput.appendChild(btnGroup);
  
  // 添加到页面
  document.body.appendChild(noteInput);
  textarea.focus();
  
  // 点击外部关闭
  document.addEventListener('mousedown', handleClickOutside);
}

// 处理点击外部
function handleClickOutside(e) {
  if (noteInput && !noteInput.contains(e.target)) {
    cancelNote();
  }
}

// 保存笔记
function saveNote() {
  if (!noteInput) return;
  
  const textarea = noteInput.querySelector('textarea');
  if (!textarea) return;
  
  let rawText = textarea.value.trim();
  
  // 如果文本区域为空且没有选中文本，则不保存
  if (!rawText && !selectedText) {
    closeNoteInput();
    return;
  }
  
  // 移除引用文本部分
  if (selectedText && rawText.startsWith(`"${selectedText}"`)) {
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
    note: rawText,
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString()
  };
  
  // 直接保存到本地存储
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    notes.push(note);
    
    chrome.storage.local.set({ notes: notes }, function() {
      if (chrome.runtime.lastError) {
        showErrorNotification(chrome.i18n.getMessage('saveFailed'));
        return;
      }
      
      showSavedNotification();
      closeNoteInput();
    });
  });
}

// 显示保存成功的通知
function showSavedNotification() {
  const notification = document.createElement('div');
  notification.className = 'note-notification saved';
  notification.textContent = chrome.i18n.getMessage('saved');
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// 显示错误通知
function showErrorNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'note-notification error';
  notification.textContent = message || chrome.i18n.getMessage('saveFailed');
  
  document.body.appendChild(notification);
  
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
    document.removeEventListener('mousedown', handleClickOutside);
  }
}

// 取消记笔记
function cancelNote() {
  closeNoteInput();
}

// 初始化
initializeExtension(); 