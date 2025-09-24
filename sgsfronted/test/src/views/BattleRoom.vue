<template>
  <div class="battle-room-container">
    <div class="room-header">
      <div class="room-info">
        <h1>{{ room.roomName }}</h1>
        <div class="room-meta">
          <span class="game-mode" :class="room.gameMode">{{ getGameModeText(room.gameMode) }}</span>
          <span class="status" :class="room.status">{{ getStatusText(room.status) }}</span>
        </div>
      </div>
      <div class="room-actions">
        <button v-if="isHost && canStartGame" class="start-game-btn" @click="startGame">开始游戏</button>
        <button class="leave-room-btn" @click="leaveRoom">离开房间</button>
      </div>
    </div>

    <!-- 玩家列表 -->
    <div class="players-section">
      <h2>房间玩家</h2>
      <div class="players-grid">
        <div
          v-for="player in players"
          :key="player.id"
          class="player-card"
          :class="{ 'current-user': isCurrentUser(player.userId) }"
        >
          <div class="player-avatar">
            <div class="avatar-placeholder" v-if="!player.user.avatarUrl">
              {{ player.user.username.charAt(0) }}
            </div>
            <img v-else :src="player.user.avatarUrl" :alt="player.user.username" class="avatar-image" />
          </div>

          <div class="player-info">
            <h3>{{ player.user.username }}</h3>
            <div class="player-status">
              <span class="position">位置 {{ player.playerPosition }}</span>
              <span class="ready-status" :class="{ ready: player.isReady }">
                {{ player.isReady ? '已准备' : '未准备' }}
              </span>
            </div>
          </div>

          <div class="player-hero" v-if="player.selectedHero">
            <div class="hero-avatar">
              <img
                :src="getHeroImage(player.selectedHero.imageUrl)"
                :alt="player.selectedHero.name"
                class="hero-image"
                @error="handleImageError"
              />
            </div>
            <div class="hero-info">
              <h4>{{ player.selectedHero.name }}</h4>
            </div>
          </div>

          <div class="player-actions" v-if="isCurrentUser(player.userId)">
            <button
              v-if="!player.isReady"
              class="select-hero-btn"
              @click="showHeroSelection"
            >
              选择英雄
            </button>
            <button
              class="toggle-ready-btn"
              :class="{ ready: player.isReady }"
              @click="toggleReady"
            >
              {{ player.isReady ? '取消准备' : '准备' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 英雄选择模态框 -->
    <div v-if="showHeroModal" class="modal">
      <div class="modal-content large-modal">
        <span class="close" @click="closeHeroModal">&times;</span>
        <h2>选择英雄</h2>

        <div class="heroes-grid">
          <div
            v-for="hero in heroes"
            :key="hero.id"
            class="hero-card"
            :class="{ selected: selectedHeroId === hero.id }"
            @click="selectHero(hero)"
          >
            <div class="hero-avatar">
              <div class="avatar-placeholder" v-if="(!hero.imageUrl || hero.imageUrl.trim() === '')">
                {{ hero.name.charAt(0) }}
              </div>
              <img
                v-else
                :src="getHeroImage(hero.imageUrl)"
                :alt="hero.name"
                class="hero-image"
                @error="handleImageError"
              />
            </div>
            <div class="hero-info">
              <h3>{{ hero.name }}</h3>
              <p class="hero-description">{{ hero.description }}</p>
              <div class="hero-stats">
                <div class="stat">
                  <span class="label">武力:</span>
                  <span class="value">{{ hero.combatPower }}</span>
                </div>
                <div class="stat">
                  <span class="label">谋略:</span>
                  <span class="value">{{ hero.strategyPower }}</span>
                </div>
                <div class="stat">
                  <span class="label">防御:</span>
                  <span class="value">{{ hero.defensePower }}</span>
                </div>
                <div class="stat">
                  <span class="label">速度:</span>
                  <span class="value">{{ hero.speed }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="confirm-btn" :disabled="!selectedHeroId" @click="confirmHeroSelection">
            确认选择
          </button>
          <button class="cancel-btn" @click="closeHeroModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BattleRoom',
  data() {
    return {
      roomId: this.$route.params.roomId,
      room: {},
      players: [],
      heroes: [],
      showHeroModal: false,
      selectedHeroId: null,
      websocket: null
    }
  },
  computed: {
    currentUser() {
      return JSON.parse(sessionStorage.getItem('currentUser'));
    },
    isHost() {
      return this.room.hostUserId === this.currentUser?.id;
    },
    canStartGame() {
      return this.players.length >= 2 && this.players.every(player => player.isReady && player.selectedHero);
    }
  },
  async created() {
    await this.fetchRoomData();
    await this.fetchHeroes();
    this.connectWebSocket();
  },
  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
  },
  methods: {
    async fetchRoomData() {
      try {
        // 获取房间信息
        const roomResponse = await fetch(`/api/game-rooms/${this.roomId}`);
        if (roomResponse.ok) {
          this.room = await roomResponse.json();
        }

        // 获取房间玩家
        const playersResponse = await fetch(`/api/game-rooms/${this.roomId}/players`);
        if (playersResponse.ok) {
          this.players = await playersResponse.json();
        }
      } catch (error) {
        console.error('获取房间数据失败:', error);
      }
    },

    async fetchHeroes() {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;
        const response = await fetch(`/api/heroes/list${userId ? `?userId=${userId}` : ''}`);
        if (response.ok) {
          const allHeroes = await response.json();
          // 只显示已拥有的英雄
          this.heroes = allHeroes.filter(hero => hero.owned);
        }
      } catch (error) {
        console.error('获取英雄列表失败:', error);
      }
    },

    connectWebSocket() {
      const wsUrl = `ws://localhost:8080/ws/battle`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        // 加入房间
        this.sendWebSocketMessage({
          action: 'join_room',
          roomId: parseInt(this.roomId),
          userId: this.currentUser.id
        });
      };

      this.websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    },

    sendWebSocketMessage(message) {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(message));
      }
    },

    handleWebSocketMessage(message) {
      switch (message.type) {
        case 'player_joined':
          this.fetchRoomData(); // 重新获取房间数据
          break;
        case 'player_left':
          this.fetchRoomData();
          break;
        case 'hero_selected':
          this.fetchRoomData();
          break;
        case 'ready_status_changed':
          this.fetchRoomData();
          break;
        case 'game_started':
          // 跳转到对战场景
          this.$router.push(`/index/battle/${this.roomId}`);
          break;
        case 'error':
          alert(message.message);
          break;
      }
    },

    showHeroSelection() {
      this.showHeroModal = true;
      this.selectedHeroId = null;
    },

    closeHeroModal() {
      this.showHeroModal = false;
      this.selectedHeroId = null;
    },

    selectHero(hero) {
      this.selectedHeroId = hero.id;
    },

    async confirmHeroSelection() {
      if (!this.selectedHeroId) return;

      // 发送英雄选择消息到WebSocket
      this.sendWebSocketMessage({
        action: 'select_hero',
        roomId: parseInt(this.roomId),
        userId: this.currentUser.id,
        heroId: this.selectedHeroId
      });

      this.closeHeroModal();
    },

    toggleReady() {
      this.sendWebSocketMessage({
        action: 'toggle_ready',
        roomId: parseInt(this.roomId),
        userId: this.currentUser.id
      });
    },

    startGame() {
      if (!this.canStartGame) return;

      this.sendWebSocketMessage({
        action: 'start_game',
        roomId: parseInt(this.roomId),
        userId: this.currentUser.id
      });
    },

    async leaveRoom() {
      if (confirm('确定要离开房间吗？')) {
        this.sendWebSocketMessage({
          action: 'leave_room',
          roomId: parseInt(this.roomId),
          userId: this.currentUser.id
        });

        this.$router.push('/index/battle-rooms');
      }
    },

    isCurrentUser(userId) {
      return this.currentUser?.id === userId;
    },

    getHeroImage(imageUrl) {
      if (!imageUrl || imageUrl.trim() === '') {
        return null;
      }
      // 简单的图片路径处理
      if (imageUrl.startsWith('@/assets/heroes/')) {
        return imageUrl.replace('@/assets/heroes/', '/src/assets/heroes/');
      }
      return imageUrl;
    },

    handleImageError(event) {
      event.target.style.display = 'none';
      const placeholder = event.target.parentElement.querySelector('.avatar-placeholder');
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    },

    getGameModeText(mode) {
      const modeMap = {
        'classic': '经典模式',
        'ranked': '排位模式',
        'casual': '休闲模式'
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
.battle-room-container {
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.room-info h1 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 28px;
  font-weight: bold;
}

.room-meta {
  display: flex;
  gap: 15px;
}

.game-mode, .status {
  padding: 6px 15px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
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

.status.waiting {
  background: linear-gradient(45deg, #f39c12, #d35400);
}

.status.in_progress {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
}

.room-actions {
  display: flex;
  gap: 15px;
}

.start-game-btn, .leave-room-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.start-game-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.start-game-btn:hover {
  background: linear-gradient(45deg, #229954, #27ae60);
  transform: translateY(-2px);
}

.leave-room-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.leave-room-btn:hover {
  background: linear-gradient(45deg, #c0392b, #a93226);
  transform: translateY(-2px);
}

.players-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.players-section h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 24px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.player-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);
  border-radius: 15px;
  padding: 20px;
  border: 2px solid #e1e8ed;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
}

.player-card.current-user {
  border-color: #3498db;
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.3);
}

.player-avatar {
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3498db, #2980b9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.avatar-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.player-info {
  flex: 1;
}

.player-info h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 18px;
}

.player-status {
  display: flex;
  gap: 10px;
  align-items: center;
}

.position {
  background: #ecf0f1;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #7f8c8d;
}

.ready-status {
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.ready-status.ready {
  background: #27ae60;
  color: white;
}

.ready-status:not(.ready) {
  background: #e74c3c;
  color: white;
}

.player-hero {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8f9fc;
  padding: 10px;
  border-radius: 10px;
}

.hero-avatar {
  flex-shrink: 0;
}

.hero-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.hero-info h4 {
  margin: 0;
  font-size: 14px;
  color: #2c3e50;
}

.player-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-hero-btn, .toggle-ready-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.select-hero-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.select-hero-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.toggle-ready-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.toggle-ready-btn.ready {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
}

.toggle-ready-btn:hover {
  transform: translateY(-2px);
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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.large-modal {
  max-width: 1200px;
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

.heroes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
  max-height: 500px;
  overflow-y: auto;
}

.hero-card {
  background: #f8f9fc;
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.hero-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.hero-card.selected {
  border-color: #3498db;
  background: linear-gradient(135deg, #fff 0%, #e3f2fd 100%);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.3);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat .label {
  color: #7f8c8d;
}

.stat .value {
  color: #2c3e50;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
}

.confirm-btn, .cancel-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.confirm-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.confirm-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
  box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
}

.cancel-btn:hover {
  background: linear-gradient(45deg, #7f8c8d, #6c7a7c);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .room-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .room-actions {
    width: 100%;
    justify-content: space-between;
  }

  .players-grid {
    grid-template-columns: 1fr;
  }

  .player-card {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .heroes-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .confirm-btn, .cancel-btn {
    width: 100%;
  }
}
</style>
