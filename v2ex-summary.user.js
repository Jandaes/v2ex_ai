// ==UserScript==
// @name         V2EX 文章总结助手
// @name:zh-CN   V2EX 文章总结助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  为 V2EX 帖子生成总结
// @description:zh-CN  为 V2EX 帖子生成总结
// @author       Jandaes
// @homepage     https://greasyfork.org/zh-CN/scripts/521732-v2ex-%E6%96%87%E7%AB%A0%E6%80%BB%E7%BB%93%E5%8A%A9%E6%89%8B
// @supportURL   https://github.com/Jandaes/v2ex_ai
// @match        https://www.v2ex.com/*
// @icon         https://www.v2ex.com/favicon.ico
// @grant        none
// @license      MIT
// @copyright    2024, Jandaes (https://github.com/Jandaes)
// ==/UserScript==

(function() {
    'use strict';

    // 在脚本开头添加 marked 库
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(markedScript);

    function createSettingsModal() {
        // 从localStorage获取用户的主题偏好，如果没有则使用系统设置
        const savedTheme = localStorage.getItem('v2exSummaryTheme');
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDarkMode = savedTheme ? savedTheme === 'dark' : systemDarkMode;

        // 定义深色/浅色主题的颜色
        const getThemeColors = (dark) => ({
            background: dark ? '#2d2d2d' : 'white',
            text: dark ? '#e0e0e0' : '#333',
            inputBg: dark ? '#3d3d3d' : '#f5f5f5',
            inputBorder: dark ? '#4d4d4d' : '#ddd',
            buttonBg: dark ? '#4d4d4d' : '#e2e2e2',
            buttonHoverBg: dark ? '#5d5d5d' : '#d2d2d2',
            modalOverlay: 'rgba(0, 0, 0, 0.6)'
        });

        let theme = getThemeColors(isDarkMode);

        // 创建模态框容器
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${theme.modalOverlay};
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(3px);
        `;

        // 创建模态框内容
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            background: ${theme.background};
            padding: 25px;
            border-radius: 12px;
            width: 450px;
            max-width: 90%;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            color: ${theme.text};
            padding-bottom: 20px;
        `;

        // 创建标题和主题切换
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid ${theme.inputBorder};
        `;

        const title = document.createElement('h3');
        title.textContent = 'V2EX 文章总结助手设置';
        title.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 500;
        `;

        const themeToggle = document.createElement('div');
        themeToggle.style.cssText = `display: flex; align-items: center; gap: 8px;`;
        themeToggle.innerHTML = `
            <span style="font-size: 14px;">主题</span>
            <select id="themeSelect" class="setting-input" style="width: auto; padding: 4px 8px;">
                <option value="system" ${!savedTheme ? 'selected' : ''}>跟随系统</option>
                <option value="light" ${savedTheme === 'light' ? 'selected' : ''}>浅色</option>
                <option value="dark" ${savedTheme === 'dark' ? 'selected' : ''}>深色</option>
            </select>
        `;

        titleContainer.appendChild(title);
        titleContainer.appendChild(themeToggle);
        modalContent.appendChild(titleContainer);

        // 创建表单
        const form = document.createElement('form');
        form.innerHTML = `
            <style>
                .setting-group {
                    margin-bottom: 20px;
                    width: 90%;
                    margin-left: auto;
                    margin-right: auto;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .setting-label {
                    width: 85px;
                    text-align: right;
                    flex-shrink: 0;
                    font-weight: 500;
                }
                .setting-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid ${theme.inputBorder};
                    border-radius: 6px;
                    background: ${theme.inputBg};
                    color: ${theme.text};
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                .setting-input:focus {
                    outline: none;
                    border-color: #0066cc;
                    box-shadow: 0 0 0 2px rgba(0,102,204,0.2);
                }
                .password-container {
                    position: relative;
                    flex: 1;
                    display: flex;
                }
                .password-container .setting-input {
                    width: 100%;
                }
                .password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    cursor: pointer;
                    user-select: none;
                    color: ${theme.text};
                    opacity: 0.7;
                    font-size: 14px;
                }
                .password-toggle:hover {
                    opacity: 1;
                }
                .button-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 25px;
                    padding: 0 5%;
                }
                .button-group {
                    display: flex;
                    gap: 10px;
                }
                .github-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: ${theme.text};
                    text-decoration: none;
                    opacity: 0.8;
                    transition: opacity 0.2s ease;
                    font-size: 14px;
                }
                .github-icon {
                    width: 16px;
                    height: 16px;
                }
                .modal-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    background: ${theme.buttonBg};
                    color: ${theme.text};
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                .modal-button:hover {
                    background: ${theme.buttonHoverBg};
                }
                .modal-button.primary {
                    background: #0066cc;
                    color: white;
                }
                .modal-button.primary:hover {
                    background: #0052a3;
                }
            </style>
            <div class="setting-group">
                <label class="setting-label">API URL：</label>
                <input type="text" id="apiUrl" class="setting-input" placeholder="请输入 API 地址">
            </div>
            <div class="setting-group">
                <label class="setting-label">API Key：</label>
                <div class="password-container">
                    <input type="password" id="apiKey" class="setting-input" placeholder="请输入 API Key">
                    <span class="password-toggle" id="togglePassword">🔒</span>
                </div>
            </div>
            <div class="setting-group">
                <label class="setting-label">模型名称：</label>
                <input type="text" id="modelName" class="setting-input" placeholder="请输入模型名称">
            </div>
            <div class="setting-group">
                <label class="setting-label">系统提示词：</label>
                <textarea id="prompt" class="setting-input" style="height: 100px; resize: vertical;" 
                    placeholder="请输入"></textarea>
            </div>
            <div class="button-container">
                <a href="https://github.com/Jandaes/v2ex_ai" target="_blank" class="github-link">
                    <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    GitHub
                </a>
                <div class="button-group">
                    <button type="button" id="cancelBtn" class="modal-button">取消</button>
                    <button type="button" id="saveBtn" class="modal-button primary">保存</button>
                </div>
            </div>
        `;

        modalContent.appendChild(form);

        // 添加这一行，将 modalContent 添加到 modal 中
        modal.appendChild(modalContent);

        // 主题切换功能
        const updateTheme = (newTheme) => {
            theme = getThemeColors(newTheme === 'dark');
            // 更新所有相关样式...
            modalContent.style.background = theme.background;
            modalContent.style.color = theme.text;
            // 更新其他元素样式...
        };

        const themeSelect = modal.querySelector('#themeSelect');
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            if (selectedTheme === 'system') {
                localStorage.removeItem('v2exSummaryTheme');
                updateTheme(systemDarkMode ? 'dark' : 'light');
            } else {
                localStorage.setItem('v2exSummaryTheme', selectedTheme);
                updateTheme(selectedTheme);
            }
        });

        // API Key 显示切换功能
        const togglePassword = modal.querySelector('#togglePassword');
        const apiKeyInput = modal.querySelector('#apiKey');
        togglePassword.addEventListener('click', () => {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
            togglePassword.textContent = type === 'password' ? '🔒' : '🔓';
        });

        // 修改默认提示词，确保每行都左对齐
        const defaultPrompt = `只精简总结以下内容的核心要点、不需要加入你的任何观点`;

        // 加载已保存的设置
        const loadSettings = () => {
            const settings = JSON.parse(localStorage.getItem('v2exSummarySettings') || '{}');
            document.getElementById('apiUrl').value = settings.apiUrl || '';
            document.getElementById('apiKey').value = settings.apiKey || '';
            document.getElementById('modelName').value = settings.modelName || '';
            document.getElementById('prompt').value = settings.prompt || defaultPrompt;  // 使用默认提示词
        };

        // 保存设置
        const saveSettings = () => {
            const settings = {
                apiUrl: document.getElementById('apiUrl').value,
                apiKey: document.getElementById('apiKey').value,
                modelName: document.getElementById('modelName').value,
                prompt: document.getElementById('prompt').value
            };
            localStorage.setItem('v2exSummarySettings', JSON.stringify(settings));
            modal.remove();
        };

        // 添加事件监听
        modal.querySelector('#saveBtn').addEventListener('click', saveSettings);
        modal.querySelector('#cancelBtn').addEventListener('click', () => modal.remove());

        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 显示模态框并加载设置
        document.body.appendChild(modal);
        loadSettings();
    }

    function addSummaryButton() {
        const header = document.querySelector('.header');
        if (header) {
            const grayDiv = header.querySelector('.gray');
            if (grayDiv && !grayDiv.querySelector('.summary-button')) {
                // 添加总结按钮
                grayDiv.insertAdjacentText('beforeend', ' ∙ ');
                
                // 创建总结按钮
                const summaryButton = document.createElement('a');
                summaryButton.href = 'javascript:void(0);';
                summaryButton.className = 'tb summary-button';
                summaryButton.innerHTML = '总结 <span style="font-size: 14px;">✨</span>';
                
                // 添加点击事件
                summaryButton.addEventListener('click', async () => {
                    const content = getTopicContent();
                    if (content) {
                        const summaryContainer = addSummaryContainer();
                        if (summaryContainer) {
                            const summaryContent = summaryContainer.querySelector('.summary-content');
                            const topicId = getTopicId();
                            
                            // 检查是否有保存的总结
                            const savedSummary = getSavedSummary(topicId);
                            if (savedSummary) {
                                // 如果有保存的总结，直接显示
                                summaryContent.innerHTML = savedSummary;
                                summaryContainer.style.display = 'block';
                            } else {
                                // 如果没有保存的总结，发起新请求
                                summaryContent.textContent = '正在生成总结...';
                                summaryContainer.style.display = 'block';

                                const summary = await sendSummaryRequest(content);
                                if (summary) {
                                    // 保存并显示新的总结
                                    saveSummary(topicId, summary);
                                    summaryContent.innerHTML = summary;
                                } else {
                                    summaryContent.textContent = '生成总结失败，请检查设置和网络连接';
                                }
                            }
                        }
                    }
                });

                grayDiv.appendChild(summaryButton);

                // 添加隔符和设置按钮
                grayDiv.insertAdjacentText('beforeend', ' ∙ ');
                
                // 创建设置按钮
                const settingsButton = document.createElement('a');
                settingsButton.href = 'javascript:void(0);';
                settingsButton.className = 'tb settings-button';
                settingsButton.innerHTML = '设置 <span style="font-size: 14px;">⚙️</span>';
                
                // 添加设置按钮的点击事件
                settingsButton.addEventListener('click', () => {
                    createSettingsModal();
                });

                grayDiv.appendChild(settingsButton);
            }
        }
    }

    function getTopicId() {
        const match = window.location.pathname.match(/\/t\/(\d+)/);
        return match ? match[1] : null;
    }

    function convertToMarkdown(element) {
        // 建深度克隆以避免修改原始DOM
        const clone = element.cloneNode(true);
        
        // 处理标题
        clone.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(header => {
            const level = header.tagName.charAt(1);
            const text = header.textContent.trim();
            header.outerHTML = `\n${'#'.repeat(level)} ${text}\n\n`;
        });

        // 处理图片
        clone.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || '';
            img.outerHTML = `\n![${alt}](${src})\n\n`;
        });

        // 处理视频
        clone.querySelectorAll('video').forEach(video => {
            const src = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src');
            if (src) {
                video.outerHTML = `\n[视频链接](${src})\n\n`;
            }
        });

        // 处理链接
        clone.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            const text = link.textContent.trim();
            if (href && text) {
                link.outerHTML = `[${text}](${href})`;
            }
        });

        // 处理代码块
        clone.querySelectorAll('pre').forEach(pre => {
            const code = pre.textContent.trim();
            pre.outerHTML = `\n\`\`\`\n${code}\n\`\`\`\n\n`;
        });

        // 处理行内代码
        clone.querySelectorAll('code:not(pre code)').forEach(code => {
            const text = code.textContent.trim();
            code.outerHTML = `\`${text}\``;
        });

        // 处理粗体
        clone.querySelectorAll('strong,b').forEach(bold => {
            const text = bold.textContent.trim();
            bold.outerHTML = `**${text}**`;
        });

        // 处理斜体
        clone.querySelectorAll('em,i').forEach(italic => {
            const text = italic.textContent.trim();
            italic.outerHTML = `*${text}*`;
        });

        // 处理列表
        clone.querySelectorAll('ul,ol').forEach(list => {
            const items = Array.from(list.querySelectorAll('li')).map(li => {
                const text = li.textContent.trim();
                return list.tagName.toLowerCase() === 'ul' ? 
                    `- ${text}` : 
                    `1. ${text}`;
            });
            list.outerHTML = `\n${items.join('\n')}\n\n`;
        });

        // 处理段落
        clone.querySelectorAll('p').forEach(p => {
            const text = p.innerHTML.trim();
            p.outerHTML = `\n${text}\n\n`;
        });

        // 获取处理后的内容
        let content = clone.innerHTML
            // 处理换行
            .replace(/<br\s*\/?>/gi, '\n')
            // 移除剩余的HTML标签
            .replace(/<[^>]+>/g, '')
            // 处理HTML实体
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            // 清理多余空行和空格
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .replace(/[ \t]+\n/g, '\n')
            .trim();

        // 确保段落之间有空行
        content = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('\n\n');

        return content;
    }

    function getTopicContent() {
        const contentDiv = document.querySelector('.topic_content');
        if (contentDiv) {
            return convertToMarkdown(contentDiv);
        }
        return null;
    }

    function init() {
        const topicId = getTopicId();
        if (topicId) {
            addSummaryButton();
        }
    }

    // 等待页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 添加取和保存总结的函数
    function getSavedSummary(topicId) {
        const summaries = JSON.parse(localStorage.getItem('v2exArticleSummaries') || '{}');
        return summaries[topicId];
    }

    function saveSummary(topicId, summary) {
        const summaries = JSON.parse(localStorage.getItem('v2exArticleSummaries') || '{}');
        summaries[topicId] = summary;
        localStorage.setItem('v2exArticleSummaries', JSON.stringify(summaries));
    }

    // 修改总结容器，添加重新生成按钮
    function addSummaryContainer() {
        const header = document.querySelector('.header');
        if (header && !document.querySelector('.summary-container')) {
            // 创建总结内容容器
            const summaryContainer = document.createElement('div');
            summaryContainer.className = 'summary-container';
            summaryContainer.style.cssText = `
                margin: 10px 0;
                padding: 15px;
                background: var(--box-background-color, #fff);
                border-radius: 6px;
                font-size: 14px;
                line-height: 1.6;
                display: none;
                border: 1px solid var(--box-border-color, #eee);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            `;

            // 添加标题栏
            const titleBar = document.createElement('div');
            titleBar.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--box-border-color, #eee);
            `;
            
            const titleLeft = document.createElement('div');
            titleLeft.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const title = document.createElement('div');
            title.innerHTML = '📝 文章总结';
            title.style.fontWeight = '500';
            
            const regenerateButton = document.createElement('a');
            regenerateButton.innerHTML = '🔄 重新生成';
            regenerateButton.href = 'javascript:void(0);';
            regenerateButton.className = 'tb';
            regenerateButton.style.fontSize = '12px';
            regenerateButton.addEventListener('click', async () => {
                const content = getTopicContent();
                if (content) {
                    const summaryContent = document.querySelector('.summary-content');
                    summaryContent.textContent = '正在重新生成总结...';
                    
                    const summary = await sendSummaryRequest(content);
                    if (summary) {
                        const topicId = getTopicId();
                        saveSummary(topicId, summary);
                        summaryContent.innerHTML = summary;
                    } else {
                        summaryContent.textContent = '生成总结失败，请检查设置和网络连接';
                    }
                }
            });

            titleLeft.appendChild(title);
            titleLeft.appendChild(regenerateButton);
            
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '✕';
            closeButton.style.cssText = `
                cursor: pointer;
                opacity: 0.6;
                font-size: 16px;
                padding: 4px 8px;
            `;
            closeButton.addEventListener('click', () => {
                summaryContainer.style.display = 'none';
            });

            titleBar.appendChild(titleLeft);
            titleBar.appendChild(closeButton);
            summaryContainer.appendChild(titleBar);

            // 添加内容区
            const content = document.createElement('div');
            content.className = 'summary-content';
            content.style.cssText = `
                white-space: pre-wrap;
                word-break: break-word;
                text-align: left;
                padding: 10px 0;
                line-height: 1.8;
            `;
            summaryContainer.appendChild(content);

            // 修改插入位置：在 header 后面插入
            header.parentNode.insertBefore(summaryContainer, header.nextSibling);

            return summaryContainer;
        }
        return document.querySelector('.summary-container');
    }

    // 添加发送请求的函数
    async function sendSummaryRequest(content) {
        // 获取设置
        const settings = JSON.parse(localStorage.getItem('v2exSummarySettings') || '{}');
        
        // 检查必要的设置是否存在
        if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
            alert('请先完成设置（API URL、API Key 和模型名称为必填项）');
            return null;
        }

        try {
            const response = await fetch(settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'Connection': 'keep-alive'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: settings.prompt || defaultPrompt
                        },
                        {
                            role: "user",
                            content: content
                        }
                    ],
                    model: settings.modelName,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '总结生成失败，请检查API返回格式';

        } catch (error) {
            alert(`请求失败: ${error.message}`);
            return null;
        }
    }
})(); 