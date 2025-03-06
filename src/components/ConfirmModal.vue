<template>
  <Transition name="modal">
    <div v-if="modelValue" class="modal-overlay" @click="$emit('update:modelValue', false)">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ title }}</h3>
        </div>
        <div class="modal-body">
          {{ message }}
        </div>
        <div class="modal-footer">
          <button class="btn btn-cancel" @click="$emit('update:modelValue', false)">取消</button>
          <button class="btn btn-confirm" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '确认'
  },
  message: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const confirm = () => {
  emit('update:modelValue', false);
  emit('confirm');
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--chat-background);
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #565869;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2em;
  color: var(--text-color);
}

.modal-body {
  padding: 20px;
  color: var(--text-color);
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #565869;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #565869;
  background-color: transparent;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #40414f;
}

.btn-confirm {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-confirm:hover {
  opacity: 0.9;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  animation: modal-in 0.3s ease-out;
}

.modal-leave-active .modal-content {
  animation: modal-in 0.3s ease-out reverse;
}

@keyframes modal-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style> 