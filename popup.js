// 当弹出窗口打开时加载笔记
document.addEventListener('DOMContentLoaded', function() {
  loadNotes();
});

// 加载所有笔记
function loadNotes() {
  chrome.storage.local.get(['notes'], function(result) {
    const notes = result.notes || [];
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
      notesList.innerHTML = '<p>暂无笔记</p>';
      return;
    }
    
    // 按时间倒序排列笔记
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    notes.forEach(note => {
      const noteElement = createNoteElement(note);
      notesList.appendChild(noteElement);
    });
  });
}

// 创建笔记元素
function createNoteElement(note) {
  const div = document.createElement('div');
  div.className = 'note-item';
  
  const date = new Date(note.timestamp);
  const formattedDate = date.toLocaleString();
  
  let html = '';
  if (note.highlightedText) {
    html += `<div class="note-text"><strong>高亮文本：</strong>${note.highlightedText}</div>`;
  }
  if (note.note) {
    html += `<div class="note-text"><strong>笔记：</strong>${note.note}</div>`;
  }
  html += `
    <div class="note-meta">
      <a href="${note.url}" class="note-url" target="_blank">${note.title}</a>
      <span> - ${formattedDate}</span>
    </div>
  `;
  
  div.innerHTML = html;
  return div;
} 