<template>
  <div :class="['message', `${role}-message`]">
    <div class="message-content">
      <template v-if="role === 'assistant'">
        <div v-if="reasoning" class="thinking-section">
          <div class="thinking-header" @click="toggleThinking">
            <span class="toggle-icon">{{ isThinkingExpanded ? '▼' : '▶' }}</span>
            思考过程
          </div>
          <div class="thinking-content" v-show="isThinkingExpanded" v-html="formattedReasoning"></div>
        </div>
        <div v-if="content && !isThinking" class="answer-content" v-html="formattedContent"></div>
        <div v-if="isThinking" class="thinking-indicator" v-html="formattedContent"></div>
      </template>
      <div v-else v-html="formattedContent"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  isThinking: {
    type: Boolean,
    default: false
  },
  reasoning: {
    type: String,
    default: ''
  }
});

// 默认关闭，只有在生成新内容时才打开
const isThinkingExpanded = ref(false);

// 用于跟踪是否是新生成的消息
const isNewMessage = ref(false);

// 监听 reasoning 的变化
watch(() => props.reasoning, (newVal, oldVal) => {
  // 如果是从空变为有内容，说明是新生成的思考过程，则展开
  if (!oldVal && newVal) {
    isThinkingExpanded.value = true;
    isNewMessage.value = true;
  }
  // 如果直接设置了完整内容（加载历史消息时），则保持折叠
});

// 监听 isThinking 的变化
watch(() => props.isThinking, (newVal) => {
  // 当开始思考时展开
  if (newVal) {
    isThinkingExpanded.value = true;
    isNewMessage.value = true;
  }
  // 当思考完成时，如果是新消息则保持展开
  else if (isNewMessage.value) {
    isThinkingExpanded.value = true;
  }
});

const formattedContent = computed(() => {
  return marked(props.content);
});

const formattedReasoning = computed(() => {
  return marked(props.reasoning);
});

const toggleThinking = () => {
  isThinkingExpanded.value = !isThinkingExpanded.value;
};
</script>

<style scoped>
.message {
  display: flex;
  padding: 16px 20px;
  position: relative;
}

:global(.dark-mode) .user-message {
  background-color: rgba(45, 55, 72, 0.3);
}

:global(.dark-mode) .user-message .message-content {
  color: #e2e8f0;
}

:global(.dark-mode) .assistant-message {
  background-color: rgba(45, 55, 72, 0.2);
}

:global(.dark-mode) .assistant-message .message-content {
  color: #e2e8f0;
}

:global(.dark-mode) .thinking-section {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(45, 55, 72, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

:global(.dark-mode) .thinking-header {
  background-color: rgba(45, 55, 72, 0.4);
  color: #e2e8f0;
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:global(.dark-mode) .thinking-header:hover {
  background-color: rgba(45, 55, 72, 0.5);
}

:global(.dark-mode) .toggle-icon {
  color: #a0aec0;
}

:global(.dark-mode) .thinking-content {
  background-color: rgba(45, 55, 72, 0.2);
  color: #e2e8f0;
}

:global(.dark-mode) .message-content :deep(pre) {
  background-color: rgba(26, 32, 44, 0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:global(.dark-mode) .message-content :deep(code) {
  background-color: rgba(45, 55, 72, 0.3);
  color: #e2e8f0;
}

:global(.dark-mode) .thinking-indicator {
  color: #a0aec0;
}

.user-message {
  background-color: rgba(241, 243, 245, 0.7);
}

.user-message .message-content {
  color: #2d3748;
  font-weight: 500;
}

.assistant-message {
  background-color: rgba(255, 255, 255, 0.7);
}

.assistant-message .message-content {
  color: #2d3748;
}

.message-content {
  flex: 1;
  max-width: 100%;
  margin: 0 auto;
  line-height: 1.6;
}

.message + .message {
  border-top: 1px solid rgba(0, 0, 0, 0.03);
}

.thinking-section {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin: 8px 0;
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.thinking-header {
  padding: 10px 16px;
  background-color: rgba(241, 243, 245, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  user-select: none;
  transition: all 0.2s ease;
  color: #4a5568;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.thinking-header:hover {
  background-color: rgba(237, 239, 241, 0.9);
  color: #2d3748;
}

.toggle-icon {
  margin-right: 8px;
  font-size: 12px;
  transition: transform 0.3s ease;
  color: #718096;
}

.thinking-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  background-color: rgba(255, 255, 255, 0.7);
  color: #4a5568;
}

.message-content :deep(pre) {
  background-color: rgba(45, 55, 72, 0.97);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
  font-family: 'Fira Code', monospace;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.message-content :deep(code) {
  background-color: rgba(45, 55, 72, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
  color: #2d3748;
}

.message-content :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
}

.message-content :deep(ul), .message-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.message-content :deep(li) {
  margin: 4px 0;
}

.answer-content {
  margin-top: 8px;
  color: inherit;
}

.thinking-indicator {
  color: #718096;
  font-style: italic;
  animation: thinking 1.5s infinite;
  padding: 8px 0;
}

@keyframes thinking {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style> 