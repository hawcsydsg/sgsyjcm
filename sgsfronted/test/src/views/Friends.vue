<template>
  <div class="friends-container">
    <div class="friends-header">
      <h2>好友系统</h2>
    </div>

    <div class="friends-content">
      <!-- 左侧面板 -->
      <div class="friends-sidebar">
        <!-- Tab切换 -->
        <div class="tab-buttons">
          <button
            :class="['tab-btn', { active: activeTab === 'friends' }]"
            @click="activeTab = 'friends'"
          >
            好友列表
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'requests' }]"
            @click="activeTab = 'requests'"
          >
            好友请求
            <span v-if="pendingRequestsCount > 0" class="badge">{{ pendingRequestsCount }}</span>
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'search' }]"
            @click="activeTab = 'search'"
          >
            添加好友
          </button>
        </div>

        <!-- 好友列表 -->
        <div v-if="activeTab === 'friends'" class="friends-list">
          <div class="search-friends">
            <input
              v-model="friendSearchQuery"
              type="text"
              placeholder="搜索好友..."
              class="search-input"
            >
          </div>
          <div class="friends-items">
            <div
              v-for="friend in filteredFriends"
              :key="friend.id"
              class="friend-item"
              @click="selectFriend(friend)"
            >
              <div class="friend-avatar">
                <img :src="friend.friend.avatarUrl" :alt="friend.friend.username" class="avatar-image" />
                <div
                  :class="['online-status', getOnlineStatus(friend.friend.id)]"
                  :title="getOnlineStatusText(friend.friend.id)"
                ></div>
              </div>
              <div class="friend-info">
                <div class="friend-name">{{ friend.friend.username }}</div>
                <div class="friend-level">等级 {{ friend.friend.level }}</div>
              </div>
              <div v-if="getUnreadCount(friend.friend.id) > 0" class="unread-badge">
                {{ getUnreadCount(friend.friend.id) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 好友请求 -->
        <div v-if="activeTab === 'requests'" class="requests-list">
          <div class="requests-items">
            <div
              v-for="request in friendRequests"
              :key="request.id"
              class="request-item"
            >
              <div class="request-avatar">
                <img :src="request.sender.avatarUrl" :alt="request.sender.username" class="avatar-image" />
              </div>
              <div class="request-info">
                <div class="request-name">{{ request.sender.username }}</div>
                <div class="request-message">{{ request.message || '请求加你为好友' }}</div>
              </div>
              <div class="request-actions">
                <button @click="acceptRequest(request.id)" class="accept-btn">同意</button>
                <button @click="rejectRequest(request.id)" class="reject-btn">拒绝</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索用户 -->
        <div v-if="activeTab === 'search'" class="search-panel">
          <div class="search-form">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="输入用户名搜索..."
              class="search-input"
              @keyup.enter="searchUsers"
            >
            <button @click="searchUsers" class="search-btn">搜索</button>
          </div>

          <div class="search-results">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="search-result-item"
            >
              <div class="user-avatar">
                <img :src="user.avatarUrl" :alt="user.username" class="avatar-image" />
              </div>
              <div class="user-info">
                <div class="user-name">{{ user.username }}</div>
                <div class="user-level">等级 {{ user.level }}</div>
              </div>
              <div class="user-actions">
                <button
                  v-if="!isFriend(user.id) && !hasPendingRequest(user.id)"
                  @click="sendFriendRequest(user)"
                  class="add-friend-btn"
                >
                  添加好友
                </button>
                <span v-else-if="isFriend(user.id)" class="already-friend">已是好友</span>
                <span v-else class="pending-request">等待确认</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧聊天区域 -->
      <div v-if="selectedFriend" class="chat-area">
        <div class="chat-header">
          <div class="chat-friend-info">
            <img :src="selectedFriend.friend.avatarUrl" :alt="selectedFriend.friend.username" class="chat-avatar" />
            <div class="chat-friend-details">
              <div class="chat-friend-name">{{ selectedFriend.friend.username }}</div>
              <div class="chat-friend-status">{{ getOnlineStatusText(selectedFriend.friend.id) }}</div>
            </div>
          </div>
          <div class="chat-actions">
            <button @click="showBlacklistOptions = true" class="more-btn">⋯</button>
          </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            :class="['message-item', message.senderId === currentUser.id ? 'own-message' : 'friend-message']"
          >
            <div class="message-avatar">
              <img
                :src="message.senderId === currentUser.id ? currentUser.avatarUrl : selectedFriend.friend.avatarUrl"
                :alt="message.senderId === currentUser.id ? currentUser.username : selectedFriend.friend.username"
                class="avatar-image"
              />
            </div>
            <div class="message-content">
              <div class="message-bubble">
                <div v-if="message.messageType === 'emoji'" class="emoji-content">
                  {{ message.content }}
                </div>
                <div v-else class="text-content">
                  {{ message.content }}
                </div>
              </div>
              <div class="message-time">{{ formatMessageTime(message.createdAt) }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <div class="emoji-panel" v-if="showEmojiPanel">
            <div class="emoji-grid">
              <span
                v-for="emoji in emojiList"
                :key="emoji"
                @click="selectEmoji(emoji)"
                class="emoji-item"
              >
                {{ emoji }}
              </span>
            </div>
          </div>
          <div class="input-row">
            <button @click="showEmojiPanel = !showEmojiPanel" class="emoji-btn">😊</button>
            <input
              v-model="newMessage"
              type="text"
              placeholder="输入消息..."
              class="message-input"
              @keyup.enter="sendMessage"
            >
            <button @click="sendMessage" :disabled="!newMessage.trim()" class="send-btn">发送</button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-chat">
        <div class="empty-icon">💬</div>
        <div class="empty-text">选择一个好友开始聊天</div>
      </div>
    </div>

    <!-- 黑名单选项弹窗 -->
    <div v-if="showBlacklistOptions" class="modal-overlay" @click="showBlacklistOptions = false">
      <div class="modal-content" @click.stop>
        <h3>好友选项</h3>
        <div class="modal-actions">
          <button @click="removeFriend(selectedFriend.friend.id)" class="danger-btn">删除好友</button>
          <button @click="addToBlacklist(selectedFriend.friend.id)" class="warning-btn">加入黑名单</button>
        </div>
        <button @click="showBlacklistOptions = false" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Friends',
  data() {
    return {
      activeTab: 'friends',
      searchQuery: '',
      friendSearchQuery: '',
      searchResults: [],
      friends: [],
      friendRequests: [],
      selectedFriend: null,
      chatMessages: [],
      newMessage: '',
      showEmojiPanel: false,
      showBlacklistOptions: false,
      currentPage: 1,
      emojiList: ['😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😮', '😢', '😭', '😤', '😡', '🥺', '😴', '🤤', '🤗', '🤭', '🤫', '🤥', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '🤗', '🤭', '🤫', '🤥'],
      onlineStatuses: new Map(), // 存储好友在线状态
      unreadMessages: {} // 存储每个好友的未读消息数量
    }
  },
  computed: {
    currentUser() {
      return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    },
    filteredFriends() {
      if (!this.friendSearchQuery.trim()) {
        return this.friends;
      }
      return this.friends.filter(friend =>
        friend.friend.username.toLowerCase().includes(this.friendSearchQuery.toLowerCase())
      );
    },
    pendingRequestsCount() {
      return this.friendRequests.length;
    }
  },
  mounted() {
    this.loadFriends();
    this.loadFriendRequests();
    this.loadUnreadMessages();
    this.connectWebSocket();
  },
  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
  },
  methods: {
    async loadFriends() {
      try {
        const response = await fetch(`/api/friends/list?userId=${this.currentUser.id}`);
        if (response.ok) {
          this.friends = await response.json();
        }
      } catch (error) {
        console.error('加载好友列表失败:', error);
      }
    },

    async loadFriendRequests() {
      try {
        const response = await fetch(`/api/friends/requests?userId=${this.currentUser.id}`);
        if (response.ok) {
          this.friendRequests = await response.json();
        }
      } catch (error) {
        console.error('加载好友请求失败:', error);
      }
    },

    async loadUnreadMessages() {
      try {
        const response = await fetch(`/api/chat/unread?userId=${this.currentUser.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.unreadMessages = result.unreadByFriend;
          }
        }
      } catch (error) {
        console.error('加载未读消息失败:', error);
      }
    },

    async searchUsers() {
      if (!this.searchQuery.trim()) return;

      try {
        const response = await fetch(`/api/friends/search?keyword=${encodeURIComponent(this.searchQuery)}&currentUserId=${this.currentUser.id}`);
        if (response.ok) {
          this.searchResults = await response.json();
        }
      } catch (error) {
        console.error('搜索用户失败:', error);
      }
    },

    async sendFriendRequest(user) {
      try {
        const response = await fetch('/api/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: this.currentUser.id,
            receiverId: user.id,
            message: `你好，我是${this.currentUser.username}，想和你成为好友！`
          })
        });

        const result = await response.json();
        if (result.success) {
          alert('好友请求已发送！');
          // 更新搜索结果状态
          const userIndex = this.searchResults.findIndex(u => u.id === user.id);
          if (userIndex !== -1) {
            this.$set(this.searchResults[userIndex], 'hasPendingRequest', true);
          }
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('发送好友请求失败:', error);
      }
    },

    async acceptRequest(requestId) {
      try {
        const response = await fetch(`/api/friends/requests/${requestId}/accept?userId=${this.currentUser.id}`, {
          method: 'POST'
        });

        const result = await response.json();
        if (result.success) {
          alert('已同意好友请求！');
          this.loadFriendRequests();
          this.loadFriends();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('同意好友请求失败:', error);
      }
    },

    async rejectRequest(requestId) {
      try {
        const response = await fetch(`/api/friends/requests/${requestId}/reject?userId=${this.currentUser.id}`, {
          method: 'POST'
        });

        const result = await response.json();
        if (result.success) {
          alert('已拒绝好友请求！');
          this.loadFriendRequests();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('拒绝好友请求失败:', error);
      }
    },

    async selectFriend(friend) {
      this.selectedFriend = friend;
      // 清空该好友的未读消息计数
      this.$set(this.unreadMessages, friend.friend.id, 0);
      await this.loadChatMessages(friend.friend.id);
      this.markMessagesAsRead(friend.friend.id);
    },

    async loadChatMessages(friendId) {
      try {
        const response = await fetch(`/api/chat/messages/${friendId}?userId=${this.currentUser.id}&page=${this.currentPage}&size=20`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.chatMessages = result.messages.reverse(); // 反转顺序，最新的在底部
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        }
      } catch (error) {
        console.error('加载聊天记录失败:', error);
      }
    },

    async markMessagesAsRead(friendId) {
      try {
        await fetch(`/api/chat/messages/${friendId}/read?userId=${this.currentUser.id}`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('标记消息已读失败:', error);
      }
    },

    async sendMessage() {
      if (!this.newMessage.trim() || !this.selectedFriend) return;

      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: this.currentUser.id,
            receiverId: this.selectedFriend.friend.id,
            content: this.newMessage.trim(),
            messageType: 'text'
          })
        });

        const result = await response.json();
        if (result.success) {
          // 立即将消息添加到聊天列表，提供即时反馈
          const messageData = {
            id: result.messageId || Date.now(),
            senderId: this.currentUser.id,
            receiverId: this.selectedFriend.friend.id,
            content: this.newMessage.trim(),
            messageType: 'text',
            isRead: true,
            createdAt: new Date()
          };
          this.chatMessages.push(messageData);
          this.newMessage = '';

          // 滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom();
          });

          // WebSocket推送仍然会收到消息，但不会重复添加
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('发送消息失败:', error);
      }
    },

    selectEmoji(emoji) {
      this.newMessage += emoji;
      this.showEmojiPanel = false;
    },

    async removeFriend(friendId) {
      if (!confirm('确定要删除这位好友吗？')) return;

      try {
        const response = await fetch(`/api/friends/${friendId}?userId=${this.currentUser.id}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        if (result.success) {
          alert('已删除好友！');
          this.showBlacklistOptions = false;
          this.selectedFriend = null;
          this.loadFriends();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('删除好友失败:', error);
      }
    },

    async addToBlacklist(friendId) {
      if (!confirm('确定要将这位好友加入黑名单吗？')) return;

      try {
        const response = await fetch('/api/friends/blacklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.currentUser.id,
            blockedUserId: friendId
          })
        });

        const result = await response.json();
        if (result.success) {
          alert('已加入黑名单！');
          this.showBlacklistOptions = false;
          this.selectedFriend = null;
          this.loadFriends();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('加入黑名单失败:', error);
      }
    },

    connectWebSocket() {
      const wsUrl = `ws://localhost:8080/ws/battle?userId=${this.currentUser.id}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('好友WebSocket连接成功');
        // 发送用户上线状态
        this.sendWebSocketMessage({
          action: 'user_status',
          userId: this.currentUser.id,
          status: 'online'
        });
      };

      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.websocket.onclose = () => {
        console.log('好友WebSocket连接断开');
      };

      this.websocket.onerror = (error) => {
        console.error('好友WebSocket错误:', error);
      };
    },

    sendWebSocketMessage(message) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(message));
      }
    },

    handleWebSocketMessage(message) {
      switch (message.type) {
        case 'chat_message':
          this.handleChatMessage(message);
          break;
        case 'user_status_update':
          this.handleUserStatusUpdate(message);
          break;
      }
    },

    handleChatMessage(message) {
      // 只处理接收到的消息（不是自己发送的）
      if (message.senderId !== this.currentUser.id) {
        const senderId = message.senderId;

        // 如果当前正在和发送者聊天，直接显示消息
        if (this.selectedFriend && this.selectedFriend.friend.id === senderId) {
          this.chatMessages.push(message);
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        } else {
          // 如果没有在和发送者聊天，增加未读消息计数
          if (!this.unreadMessages[senderId]) {
            this.$set(this.unreadMessages, senderId, 0);
          }
          this.unreadMessages[senderId]++;
        }
      }
    },

    handleUserStatusUpdate(message) {
      // 更新好友在线状态
      this.$set(this.onlineStatuses, message.userId, message.status);
    },

    isFriend(userId) {
      return this.friends.some(friend => friend.friend.id === userId);
    },

    hasPendingRequest(userId) {
      // 检查是否有待处理的请求（这里简化处理，实际应该从后端获取更准确的状态）
      return false;
    },

    getOnlineStatus(userId) {
      return this.onlineStatuses.get(userId) || 'offline';
    },

    getOnlineStatusText(userId) {
      const status = this.getOnlineStatus(userId);
      switch (status) {
        case 'online': return '在线';
        case 'away': return '离开';
        default: return '离线';
      }
    },

    getUnreadCount(friendId) {
      return this.unreadMessages[friendId] || 0;
    },

    formatMessageTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return date.toLocaleDateString();
      }
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
      }
    }
  }
}
</script>

<style scoped>
.friends-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.friends-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.friends-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.friends-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.friends-sidebar {
  width: 350px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.tab-btn {
  flex: 1;
  padding: 15px;
  border: none;
  background: #f8f9fa;
  color: #666;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.tab-btn.active {
  background: white;
  color: #007bff;
  border-bottom: 3px solid #007bff;
}

.tab-btn:hover {
  background: #e9ecef;
}

.badge {
  background: #dc3545;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  margin-left: 5px;
}

.friends-list, .requests-list, .search-panel {
  flex: 1;
  overflow-y: auto;
}

.search-friends, .search-form {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.search-input:focus {
  border-color: #007bff;
}

.search-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.friends-items, .requests-items, .search-results {
  padding: 10px 0;
}

.friend-item, .request-item, .search-result-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.3s;
}

.friend-item:hover, .request-item:hover, .search-result-item:hover {
  background: #f8f9fa;
}

.friend-item.active {
  background: #e3f2fd;
}

.friend-avatar, .request-avatar, .user-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.online-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.online-status.online {
  background: #28a745;
}

.online-status.away {
  background: #ffc107;
}

.online-status.offline {
  background: #6c757d;
}

.friend-info, .request-info, .user-info {
  flex: 1;
}

.friend-name, .request-name, .user-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.friend-level, .user-level {
  font-size: 12px;
  color: #666;
}

.request-message {
  font-size: 12px;
  color: #666;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn, .reject-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.accept-btn {
  background: #28a745;
  color: white;
}

.reject-btn {
  background: #dc3545;
  color: white;
}

.user-actions {
  margin-left: 10px;
}

.add-friend-btn {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.already-friend, .pending-request {
  font-size: 12px;
  color: #666;
}

.unread-badge {
  background: #dc3545;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  margin-left: auto;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
}

.chat-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-friend-info {
  display: flex;
  align-items: center;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.chat-friend-name {
  font-weight: 500;
  color: #333;
}

.chat-friend-status {
  font-size: 12px;
  color: #666;
}

.more-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f8f9fa;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
}

.own-message {
  justify-content: flex-end;
}

.friend-message {
  justify-content: flex-start;
}

.message-avatar {
  margin: 0 10px;
}

.message-content {
  max-width: 60%;
}

.message-bubble {
  padding: 10px 15px;
  border-radius: 18px;
  position: relative;
}

.own-message .message-bubble {
  background: #007bff;
  color: white;
}

.friend-message .message-bubble {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.message-time {
  font-size: 11px;
  color: #666;
  margin-top: 5px;
  text-align: center;
}

.chat-input-area {
  border-top: 1px solid #e0e0e0;
  background: white;
}

.emoji-panel {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}

.emoji-item {
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
  border-radius: 4px;
  transition: background 0.3s;
}

.emoji-item:hover {
  background: #f0f0f0;
}

.input-row {
  display: flex;
  padding: 15px;
  gap: 10px;
  align-items: center;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.message-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.message-input:focus {
  border-color: #007bff;
}

.send-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.3s;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-text {
  font-size: 16px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 300px;
  max-width: 400px;
}

.modal-content h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.danger-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.warning-btn {
  background: #ffc107;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .friends-sidebar {
    width: 100%;
  }

  .chat-area {
    display: none;
  }

  .friends-content {
    flex-direction: column;
  }
}
</style>
