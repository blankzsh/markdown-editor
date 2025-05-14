# Markdown在线编辑器

一个简洁、现代的Markdown在线编辑器，支持实时预览和响应式设计。

## 功能特点

- 简洁现代的UI设计
- 实时Markdown预览
- 代码语法高亮
- 响应式设计，支持手机和桌面设备
- 本地存储，自动保存编辑内容
- 支持复制和清除功能

## 技术栈

- 前端：HTML5, SCSS, JavaScript
- 后端：Node.js, Express
- 工具：marked.js (Markdown解析), highlight.js (代码高亮)

## 安装和使用

1. 克隆仓库：
```
git clone https://github.com/blankzsh/markdown-editor.git
cd markdown-editor
```

2. 安装依赖：
```
pnpm install
```

3. 启动开发服务器：
```
pnpm run dev:all
```

4. 访问 `http://localhost:3000` 开始使用编辑器

## 生产环境部署

1. 编译Sass文件：
```
pnpm run sass
```

2. 启动服务器：
```
pnpm start
```

## 许可证

ISC 