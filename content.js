// 存储当前选中的文本
let selectedText = '';
let noteInput = null;

// 监听文本选择事件
document.addEventListener('mouseup', function(e) {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  if (selectedText) {
    // 移除现有的笔记输入框
    if (noteInput) {
      document.body.removeChild(noteInput);
    }
    
    // 创建笔记输入框
    createNoteInput(e.pageX, e.pageY);
  }
});

// 创建笔记输入框
function createNoteInput(x, y) {
  noteInput = document.createElement('div');
  noteInput.className = 'note-input';
  noteInput.style.left = `${x}px`;
  noteInput.style.top = `${y}px`;
  
  const textarea = document.createElement('textarea');
  textarea.placeholder = '添加笔记...';
  
  const saveButton = document.createElement('button');
  saveButton.textContent = '保存笔记';
  saveButton.onclick = saveNote;
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  cancelButton.className = 'cancel-btn';
  cancelButton.onclick = cancelNote;
  cancelButton.style.marginLeft = '8px';

  // 按钮容器
  const btnGroup = document.createElement('div');
  btnGroup.style.textAlign = 'right';
  btnGroup.appendChild(saveButton);
  btnGroup.appendChild(cancelButton);

  noteInput.appendChild(textarea);
  noteInput.appendChild(btnGroup);
  document.body.appendChild(noteInput);
}

// 保存笔记
function saveNote() {
  const textarea = noteInput.querySelector('textarea');
  const noteText = textarea.value.trim();
  
  if (selectedText || noteText) {
    const note = {
      highlightedText: selectedText,
      note: noteText,
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    // 发送消息给后台脚本保存笔记
    chrome.runtime.sendMessage({
      action: 'saveNote',
      note: note
    });
    
    // 高亮选中的文本
    highlightSelectedText();
    
    // 移除笔记输入框
    document.body.removeChild(noteInput);
    noteInput = null;
    selectedText = '';
  }
}

// 高亮选中的文本
function highlightSelectedText() {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.className = 'web-notes-highlight';
  range.surroundContents(span);
}

// 点击高亮文本时显示笔记
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('web-notes-highlight')) {
    // 获取该高亮文本对应的笔记
    chrome.runtime.sendMessage({
      action: 'getNote',
      url: window.location.href,
      text: e.target.textContent
    }, function(response) {
      if (response && response.note) {
        // 显示笔记内容
        alert(`笔记内容：${response.note.note || '无'}`);
      }
    });
  }
});

// 取消记笔记
function cancelNote() {
  if (noteInput) {
    document.body.removeChild(noteInput);
    noteInput = null;
    selectedText = '';
  }
} 