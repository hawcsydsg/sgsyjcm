<template>
  <div class="ai-assistant-overlay" @click="close">
    <div class="ai-assistant-modal" @click.stop>
      <!-- 头部 -->
      <div class="ai-header">
        <div class="ai-title">
          <span class="ai-icon">🤖</span>
          <span>AI智能助手</span>
        </div>
        <button @click="close" class="close-btn">×</button>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-container" ref="chatContainer">
        <div class="welcome-message">
          <div class="message-avatar ai-avatar">🤖</div>
          <div class="message-content">
            <div class="message-text">
              你好！我是你的AI助手，很高兴为你服务！<br>
              我可以帮你解答游戏相关的问题，比如：
            </div>
            <div class="suggestions">
              <div class="suggestion-item" @click="sendSuggestion('游戏规则')">游戏规则</div>
              <div class="suggestion-item" @click="sendSuggestion('武将介绍')">武将介绍</div>
              <div class="suggestion-item" @click="sendSuggestion('战斗技巧')">战斗技巧</div>
              <div class="suggestion-item" @click="sendSuggestion('商城说明')">商城说明</div>
            </div>
          </div>
        </div>

        <div v-for="(message, index) in messages" :key="index" class="message-wrapper">
          <!-- 用户消息 -->
          <div v-if="message.type === 'user'" class="message user-message">
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
            </div>
            <div class="message-avatar user-avatar">👤</div>
          </div>

          <!-- AI消息 -->
          <div v-else class="message ai-message">
            <div class="message-avatar ai-avatar">🤖</div>
            <div class="message-content">
              <div class="message-text" v-if="!message.loading">{{ message.content }}</div>
              <div class="typing-indicator" v-else>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <input
            v-model="inputMessage"
            @keyup.enter="sendMessage"
            placeholder="输入你想问的问题..."
            class="message-input"
            :disabled="isLoading"
          />
          <button
            @click="sendMessage"
            :disabled="!inputMessage.trim() || isLoading"
            class="send-btn"
          >
            <span v-if="isLoading">发送中...</span>
            <span v-else>发送</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIAssistant',
  data() {
    return {
      messages: [],
      inputMessage: '',
      isLoading: false
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.scrollToBottom()
    })
  },
  methods: {
    close() {
      this.$emit('close')
    },
    sendSuggestion(suggestion) {
      this.inputMessage = suggestion
      this.sendMessage()
    },
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading) return

      const userMessage = this.inputMessage.trim()
      this.inputMessage = ''

      // 添加用户消息
      this.messages.push({
        type: 'user',
        content: userMessage
      })

      // 添加AI消息（加载状态）
      this.messages.push({
        type: 'ai',
        content: '',
        loading: true
      })

      this.isLoading = true
      this.scrollToBottom()

      try {
        const response = await fetch('/api/customerService/message2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: 'chat_' + Date.now(),
            message: userMessage
          })
        })

        const result = await response.json()

        // 更新AI消息
        const lastMessage = this.messages[this.messages.length - 1]
        lastMessage.loading = false
        lastMessage.content = result.data || result || '抱歉，我暂时无法回答这个问题。'

      } catch (error) {
        console.error('发送消息失败:', error)
        const lastMessage = this.messages[this.messages.length - 1]
        lastMessage.loading = false
        lastMessage.content = '网络错误，请稍后重试。'
      } finally {
        this.isLoading = false
        this.scrollToBottom()
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.$refs.chatContainer) {
          this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
        }
      })
    }
  }
}
</script>

<style scoped>
.ai-assistant-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.ai-assistant-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  height: 80%;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.ai-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.ai-icon {
  margin-right: 8px;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.welcome-message {
  display: flex;
  margin-bottom: 20px;
}

.message-wrapper {
  margin-bottom: 16px;
}

.message {
  display: flex;
  margin-bottom: 12px;
}

.user-message {
  justify-content: flex-end;
}

.ai-message {
  justify-content: flex-start;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin: 0 12px;
  flex-shrink: 0;
}

.user-avatar {
  background: #007bff;
  color: white;
  order: 2;
}

.ai-avatar {
  background: #28a745;
  color: white;
}

.message-content {
  max-width: 70%;
  background: white;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-message .message-content {
  background: #007bff;
  color: white;
}

.message-text {
  line-height: 1.4;
  word-wrap: break-word;
}

.suggestions {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-item {
  background: #e9ecef;
  color: #495057;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  background: #dee2e6;
  transform: translateY(-1px);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #6c757d;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.input-container {
  border-top: 1px solid #e0e0e0;
  padding: 16px 20px;
  background: white;
}

.input-wrapper {
  display: flex;
  gap: 12px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.message-input:focus {
  border-color: #007bff;
}

.message-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.send-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.send-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-assistant-modal {
    width: 95%;
    height: 90%;
  }

  .message-content {
    max-width: 80%;
  }

  .suggestions {
    flex-direction: column;
  }

  .suggestion-item {
    text-align: center;
  }
}
</style>
