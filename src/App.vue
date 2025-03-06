<template>
  <div class="chat-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="history-sidebar" :class="{ 'collapsed': !showSidebar }">
      <div class="history-header">
        <button class="new-chat" @click="startNewChat">
          <i class="icon">+</i> 新对话
        </button>
        <button class="toggle-btn" @click="toggleSidebar">
          {{ showSidebar ? '<<' : '>>' }}
        </button>
      </div>
      <div class="history-list">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="history-item"
          :class="{ 'active': currentSessionId === session.sessionId }"
          @click="loadSession(session.sessionId)"
        >
          <span class="history-title">{{ getSessionTitle(session) }}</span>
          <button class="delete-btn" @click.stop="deleteSession(session.sessionId)">×</button>
        </div>
      </div>
    </div>
    <div class="chat-main">
      <button class="expand-btn" @click="toggleSidebar" v-show="!showSidebar">
        >>
      </button>
      <button class="theme-toggle" @click="toggleDarkMode">
        {{ isDarkMode ? '☀️' : '🌙' }}
      </button>
      <div class="messages-container">
        <ChatMessage
          v-for="(msg, index) in messages"
          :key="index"
          :content="msg.content"
          :role="msg.role"
          :isThinking="msg.isThinking"
          :reasoning="msg.reasoning"
        />
      </div>
      <ChatInput @send="sendMessage" :isLoading="isLoading" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ChatMessage from './components/ChatMessage.vue';
import ChatInput from './components/ChatInput.vue';
import { API_CONFIG } from './config';
import { chatDB } from './services/db';
import { v4 as uuidv4 } from 'uuid';

const messages = ref([]);
const isLoading = ref(false);
const sessions = ref([]);
const currentSessionId = ref('');
const showSidebar = ref(true);
const isDarkMode = ref(false);

// 切换暗色模式
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  // 保存到 localStorage
  localStorage.setItem('isDarkMode', isDarkMode.value);
}

// 初始化
onMounted(async () => {
  // 读取保存的暗色模式设置
  const savedDarkMode = localStorage.getItem('isDarkMode');
  if (savedDarkMode !== null) {
    isDarkMode.value = savedDarkMode === 'true';
  }
  
  await loadSessions();
  if (sessions.value.length === 0) {
    startNewChat();
  } else {
    // 加载最近的会话
    loadSession(sessions.value[0].sessionId);
  }
});

// 加载所有会话
async function loadSessions() {
  try {
    sessions.value = await chatDB.getAllSessions();
  } catch (error) {
    console.error('加载会话列表失败:', error);
  }
}

// 加载指定会话
async function loadSession(sessionId) {
  try {
    const sessionMessages = await chatDB.getSessionMessages(sessionId);
    messages.value = sessionMessages;
    currentSessionId.value = sessionId;
  } catch (error) {
    console.error('加载会话消息失败:', error);
  }
}

// 开始新对话
async function startNewChat() {
  currentSessionId.value = uuidv4();
  messages.value = [{
    role: 'assistant',
    content: '你好！我是 DeepSeek，有什么我可以帮你的吗？'
  }];
  
  // 保存欢迎消息
  try {
    await chatDB.saveMessage(currentSessionId.value, messages.value[0]);
    await loadSessions(); // 刷新会话列表
  } catch (error) {
    console.error('保存欢迎消息失败:', error);
  }
}

// 删除会话
async function deleteSession(sessionId) {
  if (!confirm('确定要删除这个会话吗？')) return;
  
  try {
    await chatDB.deleteSession(sessionId);
    await loadSessions();
    
    if (currentSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        loadSession(sessions.value[0].sessionId);
      } else {
        startNewChat();
      }
    }
  } catch (error) {
    console.error('删除会话失败:', error);
  }
}

// 发送消息
async function sendMessage(content) {
  if (isLoading.value) return;
  isLoading.value = true;

  // 保存用户消息
  const userMessage = {
    role: 'user',
    content: content
  };
  
  messages.value.push(userMessage);
  await chatDB.saveMessage(currentSessionId.value, userMessage);

  // 添加思考状态的消息
  const assistantMessage = {
    role: 'assistant',
    content: '',
    isThinking: true,
    reasoning: ''
  };
  messages.value.push(assistantMessage);

  try {
    // 调用 API
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: API_CONFIG.modelName,
        messages: messages.value
          .filter(msg => !msg.isThinking) // 过滤掉思考中的消息
          .filter(msg => !(msg.role === 'assistant' && msg.content.includes('DeepSeek') && msg.content.includes('你好'))) // 过滤掉初始化欢迎消息
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })),
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0].delta;

            // 处理推理内容
            if (delta.reasoning_content) {
              assistantMessage.reasoning = (assistantMessage.reasoning || '') + delta.reasoning_content;
              // 强制更新视图
              messages.value = [...messages.value];
              continue;
            }

            // 处理回答内容
            if (delta.content) {
              if (assistantMessage.isThinking) {
                assistantMessage.isThinking = false;
                assistantMessage.content = '';
              }
              assistantMessage.content += delta.content;
              // 强制更新视图
              messages.value = [...messages.value];
            }
          } catch (e) {
            console.error('解析响应数据时出错:', e);
          }
        }
      }
    }

    // 保存完整的助手消息
    await chatDB.saveMessage(currentSessionId.value, {
      role: 'assistant',
      content: assistantMessage.content,
      reasoning: assistantMessage.reasoning
    });
    await loadSessions(); // 刷新会话列表

  } catch (error) {
    console.error('发送消息失败:', error);
    messages.value.pop(); // 移除思考中的消息
    messages.value.push({
      role: 'assistant',
      content: '抱歉，发生了错误，请稍后重试。'
    });
  } finally {
    isLoading.value = false;
  }
}

// 获取会话标题
function getSessionTitle(session) {
  // 如果是系统欢迎消息，则显示"新对话"
  if (session.role === 'assistant' && session.content.includes('DeepSeek')) {
    return '新对话';
  }
  
  // 使用用户的消息作为标题
  const title = session.content;
  return title.slice(0, 20) + (title.length > 20 ? '...' : '');
}

// 切换侧边栏
function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: #f8f9fa;
  position: relative;
  transition: all 0.3s ease;
}

.chat-container.dark-mode {
  background: #1a1b1e;
  color: #e2e8f0;
}

.theme-toggle {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dark-mode .theme-toggle {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.dark-mode .history-sidebar {
  background: #2d3748;
  border-right-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .history-header {
  background: rgba(0, 0, 0, 0.2);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .new-chat {
  background: #4a5568;
}

.dark-mode .new-chat:hover {
  background: #2d3748;
}

.dark-mode .toggle-btn {
  background: rgba(45, 55, 72, 0.9);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.dark-mode .toggle-btn:hover {
  background: rgba(45, 55, 72, 1);
  transform: scale(1.05);
}

.dark-mode .history-item {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.dark-mode .history-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dark-mode .history-item.active {
  background: rgba(66, 153, 225, 0.15);
  border-color: rgba(66, 153, 225, 0.3);
}

.dark-mode .history-title {
  color: #e2e8f0;
}

.dark-mode .delete-btn {
  color: #718096;
}

.dark-mode .delete-btn:hover {
  color: #fc8181;
}

.dark-mode .chat-main {
  background: #1a1b1e;
}

.dark-mode .expand-btn {
  background: rgba(45, 55, 72, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.2);
}

.dark-mode .expand-btn:hover {
  background: rgb(45, 55, 72);
  width: 36px;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.3);
}

.expand-btn {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 12px;
  width: 32px;
  height: 40px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-left: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  color: #4a5568;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.05);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.expand-btn:hover {
  background: #fff;
  color: #2d3748;
  width: 36px;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.08);
}

.history-sidebar.collapsed + .chat-main .expand-btn {
  opacity: 1;
}

.history-sidebar {
  width: 260px;
  height: 100%;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  background: #f1f3f5;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.history-sidebar.collapsed {
  width: 0;
  overflow: hidden;
}

.history-header {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.7);
}

.new-chat {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #4a5568;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.new-chat:hover {
  background: #2d3748;
}

.toggle-btn {
  padding: 8px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  color: #4a5568;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 1);
  color: #2d3748;
  transform: scale(1.05);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.history-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.9);
}

.history-item.active {
  background: #e3f2fd;
  border-color: #bbdefb;
}

.history-title {
  flex: 1;
  font-size: 14px;
  color: #2d3748;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  opacity: 0;
  transition: all 0.2s;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ff4d4f;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  position: relative;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-bottom: 100px; /* 为输入框留出空间 */
  scroll-behavior: smooth;
  margin-bottom: 20px;
}

.icon {
  font-style: normal;
  font-weight: bold;
}

/* 自定义滚动条样式 */
.history-list::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}
</style> 