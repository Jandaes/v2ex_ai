// ==UserScript==
// @name         V2EX 文章总结助手
// @name:zh-CN   V2EX 文章总结助手
// @namespace    http://tampermonkey.net/
// @version      2.0
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

(function(){
    'use strict';
    const d=document,ls=localStorage,w=window;
    const $=(s,p=d)=>p.querySelector(s);
    const t={dark:{bg:'#2d2d2d',t:'#e0e0e0',i:'#3d3d3d',b:'#4d4d4d'},light:{bg:'#fff',t:'#333',i:'#f5f5f5',b:'#ddd'}};
    const store={get:k=>JSON.parse(ls.getItem(k)||'{}'),set:(k,v)=>ls.setItem(k,JSON.stringify(v))};
    const defaultPrompt='只精简总结文章内容和评论的核心要点、不需要加入你的任何观点。分别输出文章内容和用户评论';
    
    function modal(){
        const isDark=store.get('theme')==='dark'||w.matchMedia('(prefers-color-scheme:dark)').matches;
        const th=t[isDark?'dark':'light'];
        const m=createElement('div',{
            style:`position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:center;z-index:1000`
        });
        const c=createElement('div',{
            style:`position:relative;background:${th.bg};padding:25px;border-radius:12px;width:450px;max-width:90%;color:${th.t};padding-bottom:20px`
        });

        // 先将 modalContent 添加到 modal
        m.appendChild(c);
        
        c.innerHTML=`
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid ${th.b};padding-bottom:10px">
                <h3 style="margin:0;font-size:18px">V2EX 文章总结助手设置</h3>
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:14px">主题</span>
                    <select id="theme" style="padding:4px 8px">
                        <option value="system">跟随系统</option>
                        <option value="light">浅色</option>
                        <option value="dark">深色</option>
                    </select>
                </div>
            </div>
            <div class="form">
                <div class="group"><label>API URL：</label><input id="url" placeholder="输入API地址"></div>
                <div class="group"><label>API Key：</label><div class="pwd"><input type="password" id="key" placeholder="输入API Key"><span class="eye">🔒</span></div></div>
                <div class="group"><label>模型名称：</label><input id="model" placeholder="输入模型名称"></div>
                <div class="group"><label>系统提示词：</label><textarea id="prompt" placeholder="请输入"></textarea></div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:25px">
                <a href="https://github.com/Jandaes/v2ex_ai" target="_blank" class="github">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                    GitHub
                </a>
                <div style="display:flex;gap:10px">
                    <button id="cancel">取消</button>
                    <button id="save" class="primary">保存</button>
                </div>
            </div>
        `;
        addStyle(c,`
            .form{display:flex;flex-direction:column;gap:15px}
            .group{display:flex;align-items:center}
            .group label{width:85px;text-align:right;margin-right:15px}
            .group input,.group textarea{flex:1;padding:8px 12px;border:1px solid ${th.b};border-radius:6px;background:${th.i};color:${th.t}}
            .group textarea{height:100px;resize:vertical}
            .pwd{position:relative;flex:1;display:flex}
            .eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;user-select:none;opacity:.7}
            button{padding:8px 16px;border:none;border-radius:6px;background:${th.i};color:${th.t};cursor:pointer}
            .primary{background:#0066cc;color:#fff}
            .github{color:${th.t};text-decoration:none;opacity:.8;display:flex;align-items:center;gap:6px;font-size:14px}
        `);
        
        // 先将 modal 添加到 body，这样后续的选择器才能找到元素
        d.body.appendChild(m);
        
        // 加载设置
        const settings=store.get('settings');
        $('#url',c).value=settings.apiUrl||'';
        $('#key',c).value=settings.apiKey||'';
        $('#model',c).value=settings.modelName||'';
        $('#prompt',c).value=settings.prompt||defaultPrompt;
        
        // 绑定事件
        $('.eye',c).onclick=e=>{
            const i=$('#key',c);
            i.type=i.type==='password'?'text':'password';
            e.target.textContent=i.type==='password'?'🔒':'🔓';
        };
        
        $('#save',c).onclick=()=>{
            store.set('settings',{
                apiUrl:$('#url',c).value,
                apiKey:$('#key',c).value,
                modelName:$('#model',c).value,
                prompt:$('#prompt',c).value
            });
            m.remove();
        };
        
        $('#cancel',c).onclick=()=>m.remove();
        m.onclick=e=>{if(e.target===m)m.remove()};
    }

    function summary(){
        const h=$('.header');
        if(!h)return;
        const g=$('.gray',h);
        if(!g||$('.summary-button',g))return;
        
        g.insertAdjacentText('beforeend',' ∙ ');
        const sum=createElement('a',{
            href:'javascript:void(0)',
            className:'tb summary-button',
            innerHTML:'总结 <span style="font-size:14px">✨</span>'
        });
        
        sum.onclick=async()=>{
            // 获取文章内容
            const content = $('.topic_content')?.textContent.trim();
            if(!content) return;
            
            const container = getContainer();
            if(!container) return;
            
            const cont = $('.summary-content',container);
            
            // 如果已经有内容且不是错误消息，直接显示
            if(container.style.display==='none' && 
               cont.innerHTML && 
               !cont.innerHTML.includes('失败')) {
                container.style.display='block';
                return;
            }
            
            // 显示加载状态
            cont.textContent='正在获取评论...';
            container.style.display='block';
            
            // 获取所有评论
            const comments = await getAllComments();            
            // 组合文章内容和评论
            const fullContent = `
文章内容：
${content}

评论内容：
${comments.map(c => c.trim()).join(' ')}`;
            
            // 更新状态
            cont.textContent='正在生成总结...';
            
            // 发送到 LLM
            const sum = await request(fullContent);
            if(sum){
                cont.innerHTML = sum;
            }else{
                cont.textContent='生成总结失败，请检查设置和网络连接';
            }
        };
        
        g.appendChild(sum);
        g.insertAdjacentText('beforeend',' ∙ ');
        
        const set=createElement('a',{
            href:'javascript:void(0)',
            className:'tb settings-button',
            innerHTML:'设置 <span style="font-size:14px">⚙️</span>'
        });
        set.onclick=modal;
        g.appendChild(set);
    }

    async function getAllComments() {
        let allComments = [];
        
        // 获取分页信息
        const pagination = $('.cell.ps_container');
        let pageInfo = {
            currentPage: 1,
            totalPages: 1
        };
        
        if(pagination) {
            const current = pagination.querySelector('div.page_current');
            if(current) {
                pageInfo.currentPage = parseInt(current.textContent);
            }
            
            const pages = [...pagination.querySelectorAll('a.page_normal')];
            if(pages.length > 0) {
                const lastPage = parseInt(pages[pages.length - 1].textContent);
                pageInfo.totalPages = Math.max(lastPage, pageInfo.currentPage);
            }
        }        
        // 获取所有页面的评论
        const topicId = w.location.pathname.match(/\/t\/(\d+)/)?.[1];
        if(topicId) {
            for(let page = 1; page <= pageInfo.totalPages; page++) {
                try {
                    if(page === pageInfo.currentPage) {
                        // 如果是当前页，直接获取DOM中的评论
                        allComments = allComments.concat(getPageComments(d));
                    } else {
                        // 获取其他页面的评论
                        const response = await fetch(`https://www.v2ex.com/t/${topicId}?p=${page}`);
                        const text = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        
                        const pageComments = getPageComments(doc);
                        allComments = allComments.concat(pageComments);
                    }
                    
                    if(page < pageInfo.totalPages) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }                    
                } catch(e) {
                    console.error(`获取第 ${page} 页评论失败:`, e);
                }
            }
        }
        
        return allComments;
    }

    function getPageComments(doc) {
        return [...doc.querySelectorAll('div[id^="r_"].cell')]
            .map(comment => comment.querySelector('.reply_content')?.textContent
                .replace(/\s+/g, ' ')  // 将多个空白字符替换为单个空格
                .trim())
            .filter(Boolean);  // 过滤掉空评论
    }

    function getContainer(){
        const h=$('.header');
        if(!h||$('.summary-container'))return $('.summary-container');
        
        const c=createElement('div',{
            className:'summary-container',
            style:`margin:10px 0;padding:15px;background:var(--box-background-color,#fff);border-radius:6px;font-size:14px;line-height:1.6;display:none;border:1px solid var(--box-border-color,#eee);box-shadow:0 2px 4px rgba(0,0,0,.05)`
        });
        
        const tb=createElement('div',{
            style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--box-border-color,#eee)'
        });
        
        const tl=createElement('div',{style:'display:flex;align-items:center;gap:10px'});
        const title=createElement('div',{innerHTML:'📝 文章总结',style:'font-weight:500'});
        const regen=createElement('a',{
            href:'javascript:void(0)',
            className:'tb',
            innerHTML:'🔄 重新生成',
            style:'font-size:12px'
        });
        
        regen.onclick=async()=>{
            const content=getContent();
            if(!content)return;
            
            const cont=$('.summary-content');
            cont.textContent='正在重新生成总结...';
            
            const sum=await request(content);
            if(sum){
                cont.innerHTML=sum;
            }else{
                cont.textContent='生成总结失败，请检查设置和网络连接';
            }
        };
        
        tl.appendChild(title);
        tl.appendChild(regen);
        
        const close=createElement('span',{
            innerHTML:'✕',
            style:'cursor:pointer;opacity:.6;font-size:16px;padding:4px 8px'
        });
        close.onclick=()=>c.style.display='none';
        
        tb.appendChild(tl);
        tb.appendChild(close);
        c.appendChild(tb);
        
        const cont=createElement('div',{
            className:'summary-content',
            style:'white-space:pre-wrap;word-break:break-word;text-align:left;padding:10px 0;line-height:1.8'
        });
        c.appendChild(cont);
        
        h.parentNode.insertBefore(c,h.nextSibling);
        return c;
    }

    async function request(content, retries = 3, timeout = 10000) {
        const s = store.get('settings');
        if (!s.apiUrl || !s.apiKey || !s.modelName) {
            alert('请先完成设置（API URL、API Key 和模型名称为必填项）');
            return null;
        }

        const fetchWithTimeout = async (url, options, timeout) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return response;
            } catch (e) {
                clearTimeout(timeoutId);
                throw e;
            }
        };

        for (let i = 0; i < retries; i++) {
            try {
                const r = await fetchWithTimeout(s.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${s.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: [
                            {role: "system", content: s.prompt || defaultPrompt},
                            {role: "user", content}
                        ],
                        model: s.modelName,
                        stream: false
                    })
                }, timeout);

                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                const d = await r.json();
                return d.choices?.[0]?.message?.content || '总结生成失败，请检查API返回格式';

            } catch (e) {
                if (i === retries - 1) {
                    // 最后一次重试失败才显示错误
                    alert(`请求失败: ${e.message}`);
                    return null;
                }
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                console.log(`第 ${i + 1} 次重试失败，准备重试...`);
            }
        }
    }

    function createElement(tag,props={}){
        const el=d.createElement(tag);
        Object.assign(el,props);
        return el;
    }

    function addStyle(el,css){
        const s=createElement('style');
        s.textContent=css;
        el.appendChild(s);
    }

    if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',summary);
    else summary();
})(); 
