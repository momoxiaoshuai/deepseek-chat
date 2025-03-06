<template>
  <div class="input-container">
    <div class="input-wrapper">
      <textarea
        class="chat-input"
        v-model="message"
        @keydown.enter.prevent="sendMessage"
        placeholder="输入消息，按回车发送..."
        rows="1"
        ref="textarea"
        :disabled="isLoading"
      ></textarea>
      <button 
        class="send-btn" 
        @click="sendMessage"
        :disabled="isLoading || !message.trim()"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
});

const message = ref('');
const textarea = ref(null);

const emit = defineEmits(['send']);

const sendMessage = () => {
  if (message.value.trim()) {
    emit('send', message.value);
    message.value = '';
  }
};
</script>

<style scoped>
.input-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px 40px;
  background: linear-gradient(to bottom, transparent, var(--bg-color) 20%);
}

:global(.dark-mode) .input-container {
  --bg-color: #1a1b1e;
}

.input-wrapper {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  padding: 12px;
  border: 1px solid #eee;
  transition: all 0.3s ease;
}

:global(.dark-mode) .input-wrapper {
  background: #2d3748;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
}

.chat-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background-color: transparent;
  color: #333;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s ease;
  height: 24px;
  min-height: 24px;
  outline: none;
}

:global(.dark-mode) .chat-input {
  color: #e2e8f0;
}

:global(.dark-mode) .chat-input::placeholder {
  color: #a0aec0;
}

.chat-input:focus {
  border-color: #e6e6e6;
}

:global(.dark-mode) .chat-input:focus {
  border-color: rgba(255, 255, 255, 0.2);
}

.send-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background-color: #4a5568;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  height: 36px;
}

.send-btn:hover {
  background-color: #2d3748;
}

:global(.dark-mode) .send-btn {
  background-color: #63b3ed;
}

:global(.dark-mode) .send-btn:hover {
  background-color: #4299e1;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

:global(.dark-mode) .send-btn:disabled {
  background-color: #718096;
}

.chat-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

:global(.dark-mode) .chat-input:disabled {
  background-color: rgba(45, 55, 72, 0.5);
}
</style> 