<template>
  <div class="battle-rooms-container">
    <div class="battle-rooms-header">
      <h1>对战大厅</h1>
      <div class="header-actions">
        <button class="create-room-btn" @click="showCreateModal">创建房间</button>
        <button class="refresh-btn" @click="fetchRooms">刷新</button>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="confirm-modal">
      <div class="confirm-content">
        <h3>确认删除房间</h3>
        <p>确定要删除房间 "{{ roomToDelete?.roomName }}" 吗？</p>
        <p class="warning">此操作不可撤销！</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="cancelDelete">取消</button>
          <button class="delete-confirm-btn" @click="deleteRoom">确认删除</button>
        </div>
      </div>
    </div>

    <!-- 创建房间模态框 -->
    <div v-if="showCreateRoomModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeCreateModal">&times;</span>
        <h2>创建游戏房间</h2>
        <form @submit.prevent="createRoom">
          <div class="form-group">
            <label>房间名称:</label>
            <input type="text" v-model="newRoom.roomName" required placeholder="请输入房间名称" />
          </div>
          <div class="form-group">
            <label>房间密码 (可选):</label>
            <input type="password" v-model="newRoom.roomPassword" placeholder="留空为公开房间" />
          </div>
          <div class="form-group">
            <label>游戏模式:</label>
            <select v-model="newRoom.gameMode">
              <option value="classic">经典模式</option>
              <option value="ranked">排位模式</option>
              <option value="casual">休闲模式</option>
            </select>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="newRoom.isSinglePlayerTest" />
              单人测试模式（可独自体验对战系统）
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" class="create-btn">创建房间</button>
            <button type="button" class="cancel-btn" @click="closeCreateModal">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 房间列表 -->
    <div class="rooms-section">
      <div class="rooms-grid">
        <div
          v-for="room in rooms"
          :key="room.id"
          class="room-card"
          @click="joinRoom(room)"
        >
          <div class="room-header">
            <h3>{{ room.roomName }}</h3>
            <span class="game-mode" :class="room.gameMode">{{ getGameModeText(room.gameMode) }}</span>
          </div>

          <div class="room-info">
            <div class="info-item">
              <span class="label">房主:</span>
              <span class="value">{{ room.hostUser ? room.hostUser.username : '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">玩家:</span>
              <span class="value">{{ room.currentPlayers }}/{{ room.maxPlayers }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态:</span>
              <span class="value status" :class="room.status">{{ getStatusText(room.status) }}</span>
            </div>
          </div>

          <div class="room-actions">
            <button
              v-if="isRoomHost(room)"
              class="delete-btn"
              @click.stop="confirmDeleteRoom(room)"
            >
              删除房间
            </button>
            <button
              class="join-btn"
              :disabled="room.currentPlayers >= room.maxPlayers"
              @click.stop="joinRoom(room)"
            >
              {{ room.currentPlayers >= room.maxPlayers ? '房间已满' : '加入房间' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="rooms.length === 0" class="no-rooms">
        <p>暂无可用房间，创建一个吧！</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BattleRooms',
  data() {
    return {
      rooms: [],
      showCreateRoomModal: false,
      newRoom: {
        roomName: '',
        roomPassword: '',
        gameMode: 'classic',
        isSinglePlayerTest: false
      },
      showDeleteConfirm: false,
      roomToDelete: null
    }
  },
  created() {
    this.fetchRooms();
  },
  methods: {
    async fetchRooms() {
      try {
        const response = await fetch('/api/game-rooms/list');
        if (response.ok) {
          this.rooms = await response.json();
        } else {
          console.error('获取房间列表失败');
        }
      } catch (error) {
        console.error('获取房间列表时发生错误:', error);
      }
    },

    showCreateModal() {
      this.showCreateRoomModal = true;
      this.newRoom = {
        roomName: '',
        roomPassword: '',
        gameMode: 'classic',
        isSinglePlayerTest: false
      };
    },

    closeCreateModal() {
      this.showCreateRoomModal = false;
    },

    async createRoom() {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('请先登录');
        return;
      }

      try {
        const response = await fetch('/api/game-rooms/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...this.newRoom,
            hostUserId: currentUser.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            this.closeCreateModal();
            // 检查是否为单人测试模式
            if (result.isSinglePlayerTest) {
              // 单人测试模式：直接跳转到对战场景
              alert('单人测试模式已启动！您将独自体验完整的对战系统。');
              this.$router.push(`/index/battle/${result.roomId}`);
            } else {
              // 正常模式：跳转到房间详情页
              this.$router.push(`/index/battle-room/${result.roomId}`);
            }
          } else {
            alert(result.message);
          }
        } else {
          alert('创建房间失败');
        }
      } catch (error) {
        console.error('创建房间时发生错误:', error);
        alert('创建房间时发生错误');
      }
    },

    async joinRoom(room) {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('请先登录');
        return;
      }

      if (room.currentPlayers >= room.maxPlayers) {
        alert('房间已满员');
        return;
      }

      // 如果房间有密码，提示输入密码
      let roomPassword = '';
      if (room.roomPassword) {
        roomPassword = prompt('请输入房间密码:');
        if (roomPassword === null) return; // 用户取消
      }

      try {
        const response = await fetch('/api/game-rooms/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId: room.id,
            userId: currentUser.id,
            roomPassword: roomPassword
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 跳转到房间详情页
            this.$router.push(`/index/battle-room/${room.id}`);
          } else {
            alert(result.message);
          }
        } else {
          const errorData = await response.json();
          alert(errorData.message || '加入房间失败');
        }
      } catch (error) {
        console.error('加入房间时发生错误:', error);
        alert('加入房间时发生错误');
      }
    },

    isRoomHost(room) {
      const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
      return currentUser && room.hostUserId === currentUser.id;
    },

    confirmDeleteRoom(room) {
      this.roomToDelete = room;
      this.showDeleteConfirm = true;
    },

    cancelDelete() {
      this.showDeleteConfirm = false;
      this.roomToDelete = null;
    },

    async deleteRoom() {
      if (!this.roomToDelete) return;

      const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
      if (!currentUser) {
        alert('请先登录');
        return;
      }

      try {
        const response = await fetch(`/api/game-rooms/${this.roomToDelete.id}/delete?userId=${currentUser.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('房间删除成功');
            this.fetchRooms(); // 重新获取房间列表
          } else {
            alert(result.message || '删除房间失败');
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: '删除房间失败' }));
          alert(errorData.message || '删除房间失败');
        }
      } catch (error) {
        console.error('删除房间时发生错误:', error);
        alert('删除房间时发生错误');
      } finally {
        this.showDeleteConfirm = false;
        this.roomToDelete = null;
      }
    },

    getGameModeText(mode) {
      const modeMap = {
        'classic': '经典',
        'ranked': '排位',
        'casual': '休闲'
      };
      return modeMap[mode] || mode;
    },

    getStatusText(status) {
      const statusMap = {
        'waiting': '等待中',
        'in_progress': '进行中',
        'finished': '已结束',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    }
  }
}
</script>

<style scoped>
.battle-rooms-container {
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
}

.battle-rooms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.battle-rooms-header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.create-room-btn, .refresh-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.create-room-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.create-room-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.refresh-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
}

.refresh-btn:hover {
  background: linear-gradient(45deg, #7f8c8d, #6c7a7c);
  transform: translateY(-2px);
}

.rooms-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.room-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);
  border-radius: 15px;
  padding: 20px;
  border: 2px solid #e1e8ed;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.room-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #3498db;
}

.room-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #2980b9);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.room-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: bold;
}

.game-mode {
  padding: 4px 12px;
  border-radius: 15px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.game-mode.classic {
  background: linear-gradient(45deg, #3498db, #2980b9);
}

.game-mode.ranked {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
}

.game-mode.casual {
  background: linear-gradient(45deg, #2ecc71, #27ae60);
}

.room-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #7f8c8d;
  font-weight: bold;
}

.info-item .value {
  color: #2c3e50;
}

.status.waiting {
  color: #f39c12;
}

.status.in_progress {
  color: #e74c3c;
}

.status.finished {
  color: #27ae60;
}

.room-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.delete-btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: linear-gradient(45deg, #c0392b, #a93226);
  transform: translateY(-2px);
}

.join-btn {
  padding: 10px 20px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.join-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.join-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.no-rooms {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.no-rooms p {
  font-size: 16px;
  margin: 0;
}

/* Modal styles */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.close {
  position: absolute;
  right: 20px;
  top: 20px;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.3s ease;
}

.close:hover {
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #3498db;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2980b9;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.5);
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.create-btn, .cancel-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.create-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.create-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.cancel-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
  box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
}

.cancel-btn:hover {
  background: linear-gradient(45deg, #7f8c8c, #6c7a7c);
  transform: translateY(-2px);
}

/* 确认删除对话框样式 */
.confirm-modal {
  position: fixed;
  z-index: 2000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}

.confirm-content {
  background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 2px solid #e74c3c;
}

.confirm-content h3 {
  margin: 0 0 15px 0;
  color: #e74c3c;
  font-size: 24px;
  font-weight: bold;
}

.confirm-content p {
  margin: 10px 0;
  color: #2c3e50;
  font-size: 16px;
  line-height: 1.5;
}

.confirm-content .warning {
  color: #e74c3c;
  font-weight: bold;
  background: rgba(231, 76, 60, 0.1);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.confirm-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.confirm-actions button {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
}

.cancel-btn:hover {
  background: linear-gradient(45deg, #7f8c8d, #6c7a7c);
  transform: translateY(-2px);
}

.delete-confirm-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.delete-confirm-btn:hover {
  background: linear-gradient(45deg, #c0392b, #a93226);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .battle-rooms-header {
    flex-direction: column;
    gap: 20px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .create-btn, .cancel-btn {
    width: 100%;
  }

  .confirm-actions {
    flex-direction: column;
  }

  .confirm-actions button {
    width: 100%;
  }
}
</style>
