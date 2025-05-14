document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const editor = document.getElementById('editor');
  const preview = document.getElementById('preview');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const themeToggle = document.getElementById('themeToggle');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const helpBtn = document.getElementById('helpBtn');
  const helpDialog = document.getElementById('helpDialog');
  const closeDialogBtns = document.querySelectorAll('.close-dialog, .close-dialog-btn');
  const wordCount = document.querySelector('.word-count');
  const syncScrollBtn = document.getElementById('syncScroll');
  const previewToggleBtn = document.getElementById('previewToggle');
  const toolbarBtns = document.querySelectorAll('.toolbar-btn');
  const main = document.querySelector('main');
  
  // 同步滚动状态
  let syncScrollEnabled = true;
  
  // 配置marked选项，使用highlight.js进行代码高亮
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,         // 转换回车为<br>
    gfm: true,            // 支持GitHub风格的Markdown
    headerIds: true,      // 为标题添加id
    mangle: false,        // 不转义HTML
    silent: true,         // 忽略错误
    xhtml: false          // 不使用自闭合标签
  });

  // 初始化主题
  initTheme();

  // 初始化编辑器内容
  const savedContent = localStorage.getItem('markdownContent');
  if (savedContent) {
    editor.value = savedContent;
    renderMarkdown();
    updateWordCount();
    
    // 添加加载动画
    preview.classList.add('fade-in');
    setTimeout(() => {
      preview.classList.remove('fade-in');
    }, 500);
  } else {
    // 如果没有保存的内容，则显示空白预览提示
    preview.innerHTML = '<div class="empty-preview">预览区域</div>';
    updateWordCount();
  }

  // 处理输入事件，实时渲染Markdown
  let debounceTimer;
  editor.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderMarkdown();
      saveToLocalStorage();
      updateWordCount();
    }, 300); // 300ms的防抖，优化性能
  });

  // 添加编辑器的Tab键处理
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      
      // 在光标位置插入两个空格
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      
      // 将光标移动到插入内容之后
      editor.selectionStart = editor.selectionEnd = start + 2;
      
      // 触发input事件以更新预览
      editor.dispatchEvent(new Event('input'));
    }
  });

  // 复制按钮功能
  copyBtn.addEventListener('click', () => {
    if (editor.value) {
      navigator.clipboard.writeText(editor.value)
        .then(() => {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '已复制';
          copyBtn.classList.add('success-action');
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('success-action');
          }, 1500);
        })
        .catch(err => {
          console.error('复制失败:', err);
        });
    }
  });

  // 清除按钮功能和动画
  clearBtn.addEventListener('click', () => {
    if (editor.value && confirm('确定要清除所有内容吗？')) {
      // 添加淡出动画
      preview.classList.add('fade-out');
      
      setTimeout(() => {
        editor.value = '';
        renderMarkdown();
        saveToLocalStorage();
        updateWordCount();
        
        // 重置动画
        preview.classList.remove('fade-out');
        preview.classList.add('fade-in');
        
        setTimeout(() => {
          preview.classList.remove('fade-in');
        }, 500);
      }, 300);
    }
  });
  
  // 主题切换功能
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 更新主题图标
    const themeIcon = themeToggle.querySelector('.material-icons');
    themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
  });
  
  // 全屏模式功能
  fullscreenBtn.addEventListener('click', () => {
    document.body.classList.toggle('fullscreen-mode');
    const fullscreenIcon = fullscreenBtn.querySelector('.material-icons');
    
    if (document.body.classList.contains('fullscreen-mode')) {
      fullscreenIcon.textContent = 'fullscreen_exit';
    } else {
      fullscreenIcon.textContent = 'fullscreen';
    }
  });
  
  // 帮助对话框功能
  helpBtn.addEventListener('click', () => {
    helpDialog.classList.add('open');
  });
  
  // 关闭对话框
  closeDialogBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      helpDialog.classList.remove('open');
    });
  });
  
  // 点击对话框外部关闭
  helpDialog.addEventListener('click', (e) => {
    if (e.target === helpDialog) {
      helpDialog.classList.remove('open');
    }
  });
  
  // 同步滚动切换
  syncScrollBtn.addEventListener('click', () => {
    syncScrollEnabled = !syncScrollEnabled;
    syncScrollBtn.classList.toggle('active', syncScrollEnabled);
  });
  
  // 预览模式切换
  previewToggleBtn.addEventListener('click', () => {
    main.classList.toggle('preview-mode');
    const viewIcon = previewToggleBtn.querySelector('.material-icons');
    
    if (main.classList.contains('preview-mode')) {
      viewIcon.textContent = 'visibility_off';
    } else {
      viewIcon.textContent = 'visibility';
    }
  });
  
  // 工具栏按钮处理
  toolbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      insertMarkdown(action);
    });
  });

  // 编辑器和预览区域的同步滚动
  editor.addEventListener('scroll', () => {
    if (!syncScrollEnabled) return;
    
    const editorScrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    const previewScrollTop = editorScrollRatio * (preview.scrollHeight - preview.clientHeight);
    
    // 防止触发预览区域的滚动事件
    preview.removeEventListener('scroll', handlePreviewScroll);
    preview.scrollTop = previewScrollTop;
    setTimeout(() => {
      preview.addEventListener('scroll', handlePreviewScroll);
    }, 50);
  });
  
  function handlePreviewScroll() {
    if (!syncScrollEnabled) return;
    
    const previewScrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const editorScrollTop = previewScrollRatio * (editor.scrollHeight - editor.clientHeight);
    
    // 防止触发编辑器的滚动事件
    editor.removeEventListener('scroll', handleEditorScroll);
    editor.scrollTop = editorScrollTop;
    setTimeout(() => {
      editor.addEventListener('scroll', handleEditorScroll);
    }, 50);
  }
  
  preview.addEventListener('scroll', handlePreviewScroll);

  // 渲染Markdown内容
  function renderMarkdown() {
    if (editor.value) {
      preview.innerHTML = marked.parse(editor.value);
      
      // 自动为表格添加响应式包装器
      const tables = preview.querySelectorAll('table');
      tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'table-wrapper';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });
      
      // 为图片添加点击放大功能
      const images = preview.querySelectorAll('img');
      images.forEach(img => {
        img.addEventListener('click', () => {
          img.classList.toggle('img-enlarged');
          if (img.classList.contains('img-enlarged')) {
            document.body.style.overflow = 'hidden';
            
            // 点击图片外部区域关闭放大状态
            document.addEventListener('click', function closeImg(e) {
              if (e.target !== img && img.classList.contains('img-enlarged')) {
                img.classList.remove('img-enlarged');
                document.body.style.overflow = '';
                document.removeEventListener('click', closeImg);
              }
            });
          } else {
            document.body.style.overflow = '';
          }
        });
      });
      
    } else {
      preview.innerHTML = '<div class="empty-preview">预览区域</div>';
    }
  }

  // 保存到本地存储
  function saveToLocalStorage() {
    localStorage.setItem('markdownContent', editor.value);
  }

  // 更新字数统计
  function updateWordCount() {
    const text = editor.value;
    let count = 0;
    
    if (text) {
      // 简单的中英文混合字数统计
      const englishWords = text.match(/[a-zA-Z]+/g) || [];
      const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
      count = englishWords.length + chineseChars.length;
    }
    
    wordCount.textContent = `${count} 字`;
  }
  
  // 初始化主题设置
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      const themeIcon = themeToggle.querySelector('.material-icons');
      themeIcon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }
  
  // 插入Markdown语法
  function insertMarkdown(type) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    let insertion = '';
    let cursorOffset = 0;
    
    switch (type) {
      case 'heading':
        insertion = `## ${selectedText || '标题'}`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'bold':
        insertion = `**${selectedText || '粗体文本'}**`;
        cursorOffset = selectedText ? 0 : -2;
        break;
      case 'italic':
        insertion = `*${selectedText || '斜体文本'}*`;
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'quote':
        insertion = `> ${selectedText || '引用文本'}`;
        cursorOffset = selectedText ? 0 : -4;
        break;
      case 'code':
        insertion = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText || '代码块'}\n\`\`\``
          : `\`${selectedText || '行内代码'}\``;
        cursorOffset = selectedText ? 0 : (selectedText.includes('\n') ? -4 : -1);
        break;
      case 'link':
        insertion = `[${selectedText || '链接文本'}](https://)`;
        cursorOffset = -1;
        break;
      case 'image':
        insertion = `![${selectedText || '图片描述'}](https://)`;
        cursorOffset = -1;
        break;
      case 'list-ul':
        insertion = selectedText 
          ? selectedText.split('\n').map(line => `- ${line}`).join('\n')
          : `- 列表项\n- 列表项\n- 列表项`;
        cursorOffset = selectedText ? 0 : -18;
        break;
      case 'list-ol':
        if (selectedText) {
          const lines = selectedText.split('\n');
          insertion = lines.map((line, i) => `${i+1}. ${line}`).join('\n');
        } else {
          insertion = `1. 列表项\n2. 列表项\n3. 列表项`;
          cursorOffset = -18;
        }
        break;
    }
    
    // 插入内容
    editor.value = editor.value.substring(0, start) + insertion + editor.value.substring(end);
    
    // 设置光标位置
    editor.selectionStart = editor.selectionEnd = start + insertion.length + cursorOffset;
    
    // 聚焦编辑器并触发更新
    editor.focus();
    editor.dispatchEvent(new Event('input'));
  }

  // 自动调整高度
  function adjustHeight() {
    const container = document.querySelector('.container');
    const main = document.querySelector('main');
    const headerHeight = document.querySelector('header').offsetHeight;
    const footerHeight = document.querySelector('footer').offsetHeight;
    const windowHeight = window.innerHeight;
    
    const mainHeight = windowHeight - headerHeight - footerHeight - 40; // 40px for padding
    if (mainHeight > 300) { // 设置最小高度
      main.style.minHeight = `${mainHeight}px`;
    }
  }

  // 调整高度并在窗口大小改变时重新调整
  adjustHeight();
  window.addEventListener('resize', adjustHeight);
}); 