<template>
  <div class="battle-scene-container">
    <!-- 英雄选择界面 -->
    <div v-if="isSinglePlayerTest && showHeroSelection" class="hero-selection-modal">
      <div class="hero-selection-content">
        <h2>选择你的英雄</h2>
        <p>在单人测试模式中，请选择一位英雄开始战斗：</p>

        <div class="heroes-grid">
          <div
            v-for="hero in availableHeroes"
            :key="hero.id"
            class="hero-card selectable"
            :class="{ selected: selectedHeroId === hero.id }"
            @click="selectHero(hero.id)"
          >
            <div class="hero-avatar">
              <img
                :src="getHeroImage(hero.imageUrl)"
                :alt="hero.name"
                class="hero-image"
                @error="handleImageError"
              />
            </div>
            <div class="hero-info">
              <h4>{{ hero.name }}</h4>
              <div class="hero-stats">
                <div class="stat">武力: {{ hero.combatPower }}</div>
                <div class="stat">谋略: {{ hero.strategyPower }}</div>
                <div class="stat">防御: {{ hero.defensePower }}</div>
                <div class="stat">速度: {{ hero.speed }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="selection-actions">
          <button
            class="confirm-btn"
            :disabled="!selectedHeroId"
            @click="confirmHeroSelection"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>

    <!-- 顶部信息栏 -->
    <div class="battle-header">
      <div class="turn-info">
        <span class="turn-label">当前回合:</span>
        <span class="turn-number">{{ currentTurn }}</span>
      </div>
      <div class="battle-status">
        <span class="status-text" :class="battleStatus">
          {{ getBattleStatusText(battleStatus) }}
        </span>
      </div>
      <div class="battle-actions">
        <button v-if="canEndTurn" class="end-turn-btn" @click="endTurn">结束回合</button>
        <button class="surrender-btn" @click="surrender">投降</button>
      </div>
    </div>

    <!-- 战场区域 -->
    <div v-if="!showHeroSelection" class="battlefield">
      <!-- 玩家1区域 -->
      <div class="player-area player1" :class="{ active: isCurrentPlayer(player1.userId) }">
        <div class="player-info">
          <div class="player-avatar">
            <img :src="player1.user.avatarUrl" :alt="player1.user.username" class="avatar-image" />
          </div>
          <div class="player-details">
            <h3>{{ player1.user.username }}</h3>
            <div class="player-stats">
              <span class="stat">等级: {{ player1.user.level }}</span>
            </div>
          </div>
        </div>

        <div class="hero-section" v-if="player1.selectedHero">
          <div class="hero-card">
            <div class="hero-avatar">
              <img
                :src="getHeroImage(player1.selectedHero.imageUrl)"
                :alt="player1.selectedHero.name"
                class="hero-image"
                @error="handleImageError"
              />
            </div>
            <div class="hero-info">
              <h4>{{ player1.selectedHero.name }}</h4>

              <!-- HP条 -->
              <div class="hp-bar-container">
                <div class="hp-label">
                  <span>HP</span>
                  <span class="hp-value">{{ player1.heroStats.hp || 0 }}/{{ player1.heroStats.maxHp || 100 }}</span>
                </div>
                <div class="hp-bar">
                  <div
                    class="hp-fill"
                    :style="{ width: ((player1.heroStats.hp || 0) / (player1.heroStats.maxHp || 100)) * 100 + '%' }"
                    :class="{ 'low-hp': (player1.heroStats.hp || 0) < 30 }"
                  ></div>
                </div>
              </div>

              <div class="hero-stats">
                <div class="stat-bar">
                  <span class="label">武力</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player1.heroStats && player1.heroStats.combatPower || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player1.heroStats && player1.heroStats.combatPower || 0 }}</span>
                </div>
                <div class="stat-bar">
                  <span class="label">谋略</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player1.heroStats && player1.heroStats.strategyPower || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player1.heroStats && player1.heroStats.strategyPower || 0 }}</span>
                </div>
                <div class="stat-bar">
                  <span class="label">防御</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player1.heroStats && player1.heroStats.defensePower || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player1.heroStats && player1.heroStats.defensePower || 0 }}</span>
                </div>
                <div class="stat-bar">
                  <span class="label">速度</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player1.heroStats && player1.heroStats.speed || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player1.heroStats && player1.heroStats.speed || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-actions" v-if="isCurrentPlayer(player1.userId) && canTakeAction">
            <button class="action-btn attack" @click="performAttack">攻击</button>
            <button class="action-btn defend" @click="performDefend">防御</button>
            <button class="action-btn skill" @click="useSkill" :disabled="!hasSkillAvailable">技能</button>
          </div>
        </div>
      </div>

      <!-- VS图标 -->
      <div class="vs-section">
        <div class="vs-icon">⚔️</div>
        <div class="battle-info">
          <div class="damage-info">
            <span>造成的伤害: {{ totalDamageDealt }}</span>
          </div>
          <div class="damage-info">
            <span>受到的伤害: {{ totalDamageTaken }}</span>
          </div>
        </div>
      </div>

      <!-- 玩家2区域 -->
      <div class="player-area player2" :class="{ active: isCurrentPlayer(player2.userId) }">
        <div class="player-info">
          <div class="player-avatar">
            <img :src="player2.user.avatarUrl" :alt="player2.user.username" class="avatar-image" />
          </div>
          <div class="player-details">
            <h3>{{ player2.user.username }}</h3>
            <div class="player-stats">
              <span class="stat">等级: {{ player2.user.level }}</span>
            </div>
          </div>
        </div>

        <div class="hero-section" v-if="player2.selectedHero">
          <div class="hero-card">
            <div class="hero-avatar">
              <img
                :src="getHeroImage(player2.selectedHero.imageUrl)"
                :alt="player2.selectedHero.name"
                class="hero-image"
                @error="handleImageError"
              />
            </div>
            <div class="hero-info">
              <h4>{{ player2.selectedHero.name }}</h4>

              <!-- HP条 -->
              <div class="hp-bar-container">
                <div class="hp-label">
                  <span>HP</span>
                  <span class="hp-value">{{ player2.heroStats.hp || 0 }}/{{ player2.heroStats.maxHp || 100 }}</span>
                </div>
                <div class="hp-bar">
                  <div
                    class="hp-fill"
                    :style="{ width: ((player2.heroStats.hp || 0) / (player2.heroStats.maxHp || 100)) * 100 + '%' }"
                    :class="{ 'low-hp': (player2.heroStats.hp || 0) < 30 }"
                  ></div>
                </div>
              </div>

              <div class="hero-stats">
                <div class="stat-bar">
                  <span class="label">武力</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player2.heroStats && player2.heroStats.combatPower || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player2.heroStats && player2.heroStats.combatPower || 0 }}</span>
                </div>
                <div class="stat-bar">
                  <span class="label">谋略</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player2.heroStats && player2.heroStats.strategyPower || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player2.heroStats && player2.heroStats.strategyPower || 0 }}</span>
                </div>
                <div class="stat-bar">
                  <span class="label">防御</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player2.heroStats && player2.heroStats.defensePower || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player2.heroStats && player2.heroStats.defensePower || 0 }}</span>
                </div>
                <div class="stat-bar">
                  <span class="label">速度</span>
                  <div class="bar">
                    <div class="fill" :style="{ width: ((player2.heroStats && player2.heroStats.speed || 0) / 100) * 100 + '%' }"></div>
                  </div>
                  <span class="value">{{ player2.heroStats && player2.heroStats.speed || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-actions" v-if="isCurrentPlayer(player2.userId) && canTakeAction">
            <button class="action-btn attack" @click="performAttack">攻击</button>
            <button class="action-btn defend" @click="performDefend">防御</button>
            <button class="action-btn skill" @click="useSkill" :disabled="!hasSkillAvailable">技能</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 战斗日志 -->
    <div v-if="!showHeroSelection" class="battle-log">
      <h3>战斗日志</h3>
      <div class="log-content">
        <div
          v-for="log in battleLogs"
          :key="log.id"
          class="log-entry"
          :class="{
            'current-user': log.actorUserId && log.actorUserId === currentUser.id,
            'system': log.type === 'system',
            'player-action': log.type === 'player-action',
            'ai-action': log.type === 'ai-action'
          }"
        >
          <span class="timestamp">{{ log.timestamp || (log.createdAt ? formatTime(log.createdAt) : '') }}</span>
          <span class="actor">{{ log.actorName || (log.actorUserId ? getPlayerName(log.actorUserId) : '系统') }}</span>
          <span class="action">{{ log.message || getActionText(log.actionType) }}</span>
          <span v-if="log.targetUserId" class="target">{{ getPlayerName(log.targetUserId) }}</span>
          <span v-if="log.damageDealt > 0" class="damage">造成 {{ log.damageDealt }} 点伤害</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BattleScene',
  data() {
    return {
      roomId: this.$route.params.roomId,
      currentTurn: 1,
      battleStatus: 'in_progress',
      currentPlayerId: null,
      player1: { user: {}, selectedHero: null, heroStats: {} },
      player2: { user: {}, selectedHero: null, heroStats: {} },
      battleLogs: [],
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      websocket: null,
      canTakeAction: true,
      hasSkillAvailable: true,
      isSinglePlayerTest: false,
      showHeroSelection: false,
      availableHeroes: [],
      selectedHeroId: null
    }
  },
  computed: {
    currentUser() {
      return JSON.parse(sessionStorage.getItem('currentUser'));
    },
    canEndTurn() {
      return this.isCurrentPlayer(this.currentUser.id) && this.canTakeAction;
    }
  },
  async created() {
    await this.initializeBattle();
    this.connectWebSocket();
  },
  beforeDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
  },
  methods: {
    async loadHeroesForSelection() {
      try {
        const response = await fetch('/api/heroes/list');
        if (response.ok) {
          this.availableHeroes = await response.json();
          this.showHeroSelection = true;
        } else {
          console.error('获取英雄列表失败');
          alert('获取英雄列表失败，请重试');
        }
      } catch (error) {
        console.error('获取英雄列表时发生错误:', error);
        alert('获取英雄列表时发生错误');
      }
    },

    selectHero(heroId) {
      this.selectedHeroId = heroId;
    },

    confirmHeroSelection() {
      if (!this.selectedHeroId) return;

      const selectedHero = this.availableHeroes.find(h => h.id === this.selectedHeroId);
      if (!selectedHero) return;

      // 设置玩家英雄
      this.player1.selectedHero = selectedHero;
      this.player1.heroStats = {
        ...selectedHero,
        hp: selectedHero.hp || 100, // 从数据库获取HP值
        maxHp: selectedHero.hp || 100
      };

      // 创建AI对手
      this.player2 = {
        userId: 999, // AI玩家ID
        user: {
          id: 999,
          username: 'AI对手',
          avatarUrl: null
        },
        selectedHero: {
          id: 2, // 默认选择关羽作为AI英雄
          name: '武关羽',
          combatPower: 95,
          strategyPower: 75,
          defensePower: 85,
          speed: 80
        },
        heroStats: {
          combatPower: 95,
          strategyPower: 75,
          defensePower: 85,
          speed: 80,
          hp: 100, // 初始化HP为100
          maxHp: 100
        }
      };

      // 隐藏英雄选择界面，开始战斗
      this.showHeroSelection = false;
      this.currentPlayerId = this.currentUser.id;
      this.battleStatus = 'in_progress';
      this.addBattleLog('单人测试模式开始！您可以独自体验完整的对战系统。', 'system');
      this.addBattleLog('您的回合，请选择行动！', 'system');
    },

    async initializeBattle() {
      try {
        // 获取房间玩家信息
        const playersResponse = await fetch(`/api/game-rooms/${this.roomId}/players`);
        if (playersResponse.ok) {
          const players = await playersResponse.json();
          this.player1 = players[0] || {};

          // 检查是否为单人测试模式
          if (players.length === 1) {
            this.isSinglePlayerTest = true;
            // 单人测试模式：获取英雄列表并显示选择界面
            await this.loadHeroesForSelection();
          } else {
            this.player2 = players[1] || {};
            // 初始化英雄属性
            if (this.player1.selectedHero) {
              this.player1.heroStats = {
                ...this.player1.selectedHero,
                hp: this.player1.hp || 100, // 当前HP从room_players表获取
                maxHp: this.player1.selectedHero.hp || 100 // 最大HP从heroes表获取
              };
            }
            if (this.player2.selectedHero) {
              this.player2.heroStats = {
                ...this.player2.selectedHero,
                hp: this.player2.hp || 100, // 当前HP从room_players表获取
                maxHp: this.player2.selectedHero.hp || 100 // 最大HP从heroes表获取
              };
            }

            // 设置初始回合
            this.currentPlayerId = this.player1.userId; // 第一个玩家先手
            this.battleStatus = 'in_progress';
            this.addBattleLog('对战开始！', 'system');
            this.addBattleLog('轮到您行动了，请选择行动！', 'system');
          }
        }
      } catch (error) {
        console.error('初始化战斗失败:', error);
      }
    },

    connectWebSocket() {
      // 单人测试模式不需要WebSocket连接
      if (this.isSinglePlayerTest) {
        console.log('单人测试模式，跳过WebSocket连接');
        return;
      }

      const wsUrl = `ws://localhost:8080/ws/battle`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected to battle');
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
        console.log('WebSocket disconnected from battle');
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // 单人测试模式下WebSocket连接失败是正常的，不影响游戏进行
        if (this.isSinglePlayerTest) {
          console.log('单人测试模式下WebSocket连接失败是正常的');
        }
      };
    },

    sendWebSocketMessage(message) {
      // 单人测试模式不需要发送WebSocket消息
      if (this.isSinglePlayerTest) {
        console.log('单人测试模式，跳过WebSocket消息发送:', message);
        return;
      }

      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify(message));
      }
    },

    handleWebSocketMessage(message) {
      switch (message.type) {
        case 'game_started':
          this.currentTurn = message.currentTurn || 1;
          this.currentPlayerId = message.currentPlayerId;
          this.battleStatus = 'in_progress';
          break;

        case 'battle_action':
          this.handleBattleAction(message);
          break;

        case 'turn_ended':
          this.currentPlayerId = message.nextPlayerId;
          this.currentTurn++;
          // 只有当轮到当前用户时，才允许行动
          this.canTakeAction = this.isCurrentPlayer(this.currentUser.id);
          break;

        case 'game_ended':
          this.battleStatus = 'finished';
          this.showGameResult(message.winnerId, message.reason);
          break;

        case 'error':
          alert(message.message);
          break;
      }
    },

    async handleBattleAction(message) {
      // 添加到战斗日志
      const logEntry = {
        id: Date.now(),
        actorUserId: message.actorUserId,
        targetUserId: message.targetUserId,
        actionType: message.actionType,
        damageDealt: message.damage,
        message: message.message,
        createdAt: new Date()
      };
      this.battleLogs.unshift(logEntry);

      // 限制日志数量
      if (this.battleLogs.length > 50) {
        this.battleLogs = this.battleLogs.slice(0, 50);
      }

      // 更新伤害统计
      if (message.damage > 0) {
        if (message.actorUserId === this.currentUser.id) {
          this.totalDamageDealt += message.damage;
        } else {
          this.totalDamageTaken += message.damage;
        }
      }

      // 在多人模式下，重新获取玩家数据以更新HP显示
      if (!this.isSinglePlayerTest) {
        await this.refreshPlayerData();

        // 如果这是其他玩家的行动，检查当前是否轮到自己行动
        this.canTakeAction = this.isCurrentPlayer(this.currentUser.id);
      }
    },

    async refreshPlayerData() {
      try {
        const playersResponse = await fetch(`/api/game-rooms/${this.roomId}/players`);
        if (playersResponse.ok) {
          const players = await playersResponse.json();
          this.player1 = players[0] || {};
          this.player2 = players[1] || {};

          // 重新初始化英雄属性
          if (this.player1.selectedHero) {
            this.player1.heroStats = {
              ...this.player1.selectedHero,
              hp: this.player1.hp || 100, // 当前HP从room_players表获取
              maxHp: this.player1.selectedHero.hp || 100 // 最大HP从heroes表获取
            };
          }
          if (this.player2.selectedHero) {
            this.player2.heroStats = {
              ...this.player2.selectedHero,
              hp: this.player2.hp || 100, // 当前HP从room_players表获取
              maxHp: this.player2.selectedHero.hp || 100 // 最大HP从heroes表获取
            };
          }
        }
      } catch (error) {
        console.error('刷新玩家数据失败:', error);
      }
    },

    performAttack() {
      if (this.isSinglePlayerTest) {
        // 单人测试模式：直接处理攻击逻辑
        const damage = Math.max(1, this.player1.heroStats.combatPower || 10);
        this.player2.heroStats.hp = Math.max(0, this.player2.heroStats.hp - damage);
        this.addBattleLog(`您使用了攻击，造成 ${damage} 点伤害！`, 'player-action');
        this.totalDamageDealt += damage;
        this.showDamageEffect('player2', damage);
        this.canTakeAction = false;

        // 检查胜利条件
        if (this.checkVictory()) {
          return;
        }

        // 攻击后自动结束回合，进入AI回合
        setTimeout(() => {
          this.endTurn();
        }, 1000);
      } else {
        // 正常模式：发送WebSocket消息
        const targetUserId = this.getOpponentId();
        this.sendWebSocketMessage({
          action: 'battle_action',
          roomId: parseInt(this.roomId),
          userId: this.currentUser.id,
          actionType: 'attack',
          targetUserId: targetUserId,
          damage: this.getCurrentPlayerHero().combatPower || 10
        });
        this.canTakeAction = false;
      }
    },

    performDefend() {
      if (this.isSinglePlayerTest) {
        // 单人测试模式：直接处理防御逻辑
        // 防御可以抵消随机伤害（0-50%的伤害）
        const randomDamage = Math.floor(Math.random() * 15) + 1; // 1-15随机伤害
        const defensePower = this.player1.heroStats.defensePower || 10;
        const actualDamage = Math.max(0, randomDamage - Math.floor(defensePower / 2));

        if (actualDamage > 0) {
          this.player1.heroStats.hp = Math.max(0, this.player1.heroStats.hp - actualDamage);
          this.addBattleLog(`您进行了防御，抵消了 ${randomDamage - actualDamage} 点伤害，受到 ${actualDamage} 点伤害！`, 'player-action');
          this.showDamageEffect('player1', actualDamage);
        } else {
          this.addBattleLog(`您进行了完美防御，完全抵消了 ${randomDamage} 点伤害！`, 'player-action');
        }

        this.canTakeAction = false;

        // 检查胜利条件
        if (this.checkVictory()) {
          return;
        }

        // 防御后自动结束回合，进入AI回合
        setTimeout(() => {
          this.endTurn();
        }, 1000);
      } else {
        // 正常模式：发送WebSocket消息
        this.sendWebSocketMessage({
          action: 'battle_action',
          roomId: parseInt(this.roomId),
          userId: this.currentUser.id,
          actionType: 'defend'
        });
        this.canTakeAction = false;
      }
    },

    useSkill() {
      if (this.isSinglePlayerTest) {
        // 单人测试模式：直接处理技能使用逻辑
        const damage = Math.max(1, this.player1.heroStats.strategyPower || 15);
        this.player2.heroStats.hp = Math.max(0, this.player2.heroStats.hp - damage);
        this.addBattleLog(`您使用了技能，造成 ${damage} 点伤害！`, 'player-action');
        this.totalDamageDealt += damage;
        this.showDamageEffect('player2', damage);
        this.canTakeAction = false;
        this.hasSkillAvailable = false;

        // 检查胜利条件
        if (this.checkVictory()) {
          return;
        }

        // 技能使用后自动结束回合，进入AI回合
        setTimeout(() => {
          this.endTurn();
        }, 1000);
      } else {
        // 正常模式：发送WebSocket消息
        const targetUserId = this.getOpponentId();
        this.sendWebSocketMessage({
          action: 'battle_action',
          roomId: parseInt(this.roomId),
          userId: this.currentUser.id,
          actionType: 'use_skill',
          targetUserId: targetUserId,
          damage: this.getCurrentPlayerHero().strategyPower || 15
        });
        this.canTakeAction = false;
        this.hasSkillAvailable = false;
      }
    },

    endTurn() {
      if (this.isSinglePlayerTest) {
        // 单人测试模式：玩家结束回合后，AI自动执行
        this.handleAITurn();
      } else {
        // 正常模式：发送WebSocket消息
        this.sendWebSocketMessage({
          action: 'end_turn',
          roomId: parseInt(this.roomId),
          userId: this.currentUser.id
        });
      }
    },

    handleAITurn() {
      // AI回合逻辑
      setTimeout(() => {
        // AI随机选择行动
        const actions = ['attack', 'defend'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        if (randomAction === 'attack') {
          this.performAIAttack();
        } else {
          this.performAIDefend();
        }

        // 检查AI行动后的胜利条件
        setTimeout(() => {
          if (this.checkVictory()) {
            return;
          }

          // AI回合结束后，切换回玩家回合
          this.currentPlayerId = this.currentUser.id;
          this.canTakeAction = true;
          this.currentTurn++;
        }, 1500);
      }, 1000);
    },

    performAIAttack() {
      const damage = Math.max(1, this.player2.heroStats.combatPower || 10);
      this.player1.heroStats.hp = Math.max(0, this.player1.heroStats.hp - damage);
      this.addBattleLog(`AI对手使用了攻击，造成 ${damage} 点伤害！`, 'ai-action');
      this.totalDamageTaken += damage;

      // 简单的伤害动画效果
      this.showDamageEffect('player1', damage);
    },

    performAIDefend() {
      // AI防御逻辑：抵消随机伤害
      const randomDamage = Math.floor(Math.random() * 15) + 1; // 1-15随机伤害
      const defensePower = this.player2.heroStats.defensePower || 10;
      const actualDamage = Math.max(0, randomDamage - Math.floor(defensePower / 2));

      if (actualDamage > 0) {
        this.player2.heroStats.hp = Math.max(0, this.player2.heroStats.hp - actualDamage);
        this.addBattleLog(`AI对手进行了防御，抵消了 ${randomDamage - actualDamage} 点伤害，受到 ${actualDamage} 点伤害！`, 'ai-action');
        this.showDamageEffect('player2', actualDamage);
      } else {
        this.addBattleLog(`AI对手进行了完美防御，完全抵消了 ${randomDamage} 点伤害！`, 'ai-action');
      }
    },

    addBattleLog(message, type = 'normal') {
      const logEntry = {
        id: Date.now() + Math.random(), // 确保ID唯一
        message: message,
        type: type,
        timestamp: new Date().toLocaleTimeString()
      };
      this.battleLogs.unshift(logEntry);

      // 限制日志数量
      if (this.battleLogs.length > 20) {
        this.battleLogs = this.battleLogs.slice(0, 20);
      }
    },

    showDamageEffect(target, damage) {
      // 简单的伤害效果显示
      const targetElement = document.querySelector(`.${target === 'player1' ? 'player-area.player1' : 'player-area.player2'}`);
      if (targetElement) {
        targetElement.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          targetElement.style.animation = '';
        }, 500);
      }
    },

    checkVictory() {
      // 检查玩家是否获胜（AI HP为0）
      if (this.player2.heroStats.hp <= 0) {
        this.showGameResult(this.currentUser.id, '对方HP耗尽');
        return true;
      }

      // 检查AI是否获胜（玩家HP为0）
      if (this.player1.heroStats.hp <= 0) {
        this.showGameResult(999, 'HP耗尽');
        return true;
      }

      return false;
    },

    surrender() {
      if (confirm('确定要投降吗？')) {
        if (this.isSinglePlayerTest) {
          // 单人测试模式：直接处理投降逻辑
          this.addBattleLog('您选择了投降，游戏结束！', 'system');
          setTimeout(() => {
            alert('您投降了！游戏结束。');
            this.$router.push('/index/battle-rooms');
          }, 1000);
        } else {
          // 正常模式：发送WebSocket消息
          this.sendWebSocketMessage({
            action: 'surrender',
            roomId: parseInt(this.roomId),
            userId: this.currentUser.id
          });
        }
      }
    },

    showGameResult(winnerId, reason) {
      const winnerName = this.getPlayerName(winnerId);
      const isWinner = winnerId === this.currentUser.id;
      const message = `游戏结束！${isWinner ? '恭喜你获胜' : winnerName + '获胜'}。原因：${reason}`;

      setTimeout(() => {
        alert(message);
        this.$router.push('/index/battle-rooms');
      }, 1000);
    },

    isCurrentPlayer(userId) {
      return this.currentPlayerId === userId;
    },

    getCurrentPlayerHero() {
      if (this.isCurrentPlayer(this.player1.userId)) {
        return this.player1.selectedHero || {};
      } else if (this.isCurrentPlayer(this.player2.userId)) {
        return this.player2.selectedHero || {};
      }
      return {};
    },

    getOpponentId() {
      if (this.isCurrentPlayer(this.player1.userId)) {
        return this.player2.userId;
      } else {
        return this.player1.userId;
      }
    },

    getPlayerName(userId) {
      if (this.player1.userId === userId) {
        return this.player1.user.username;
      } else if (this.player2.userId === userId) {
        return this.player2.user.username;
      }
      return '未知玩家';
    },

    getHeroImage(imageUrl) {
      if (!imageUrl || imageUrl.trim() === '') {
        return null;
      }
      if (imageUrl.startsWith('@/assets/heroes/')) {
        return imageUrl.replace('@/assets/heroes/', '/src/assets/heroes/');
      }
      return imageUrl;
    },

    handleImageError(event) {
      event.target.style.display = 'none';
    },

    getBattleStatusText(status) {
      const statusMap = {
        'preparing': '准备中',
        'in_progress': '进行中',
        'finished': '已结束',
        'paused': '暂停'
      };
      return statusMap[status] || status;
    },

    getActionText(actionType) {
      const actionMap = {
        'attack': '攻击了',
        'defend': '进行了防御',
        'use_skill': '使用了技能',
        'end_turn': '结束了回合',
        'surrender': '投降了'
      };
      return actionMap[actionType] || actionType;
    },

    formatTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleTimeString();
    }
  }
}
</script>

<style scoped>
.battle-scene-container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

/* 英雄选择界面样式 */
.hero-selection-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.hero-selection-content {
  background: linear-gradient(135deg, #fff 0%, #f8f9fc 100%);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid #3498db;
}

.hero-selection-content h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 10px;
  font-size: 28px;
  font-weight: bold;
}

.hero-selection-content p {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 16px;
}

.heroes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.hero-card.selectable {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.hero-card.selectable:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.hero-card.selectable.selected {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.1);
  transform: scale(1.05);
}

.hero-card .hero-stats .stat {
  font-size: 12px;
  color: #2c3e50;
  margin: 2px 0;
}

.selection-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.confirm-btn {
  padding: 15px 30px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.confirm-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-selection-content {
    padding: 20px;
    margin: 20px;
  }

  .hero-selection-content h2 {
    font-size: 24px;
  }

  .heroes-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }

  .confirm-btn {
    padding: 12px 25px;
    font-size: 14px;
  }
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.turn-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.turn-label {
  font-size: 16px;
  color: #a8dadc;
}

.turn-number {
  font-size: 24px;
  font-weight: bold;
  color: #f5f7fa;
}

.battle-status .status-text {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
}

.status-text.in_progress {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.status-text.finished {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.battle-actions {
  display: flex;
  gap: 15px;
}

.end-turn-btn, .surrender-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.end-turn-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.end-turn-btn:hover {
  background: linear-gradient(45deg, #2980b9, #2573a7);
  transform: translateY(-2px);
}

.surrender-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.surrender-btn:hover {
  background: linear-gradient(45deg, #c0392b, #a93226);
  transform: translateY(-2px);
}

.battlefield {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.player-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.player-area.active {
  border-color: #3498db;
  box-shadow: 0 0 30px rgba(52, 152, 219, 0.3);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.avatar-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f5f7fa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.player-details h3 {
  margin: 0 0 5px 0;
  color: #f5f7fa;
  font-size: 20px;
}

.player-stats .stat {
  color: #a8dadc;
  font-size: 14px;
}

.hero-section {
  text-align: center;
}

.hero-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
}

.hero-avatar {
  margin-bottom: 10px;
}

.hero-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f5f7fa;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.hero-info h4 {
  margin: 0 0 10px 0;
  color: #f5f7fa;
  font-size: 18px;
}

/* HP条样式 */
.hp-bar-container {
  margin-bottom: 15px;
}

.hp-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: bold;
  color: #f5f7fa;
}

.hp-value {
  color: #4fc3f7;
}

.hp-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #27ae60, #2ecc71);
  border-radius: 4px;
  transition: width 0.5s ease, background-color 0.3s ease;
  position: relative;
}

.hp-fill.low-hp {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
  animation: hp-warning 1.5s infinite;
}

@keyframes hp-warning {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.hero-stats {
  display: grid;
  gap: 8px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-bar .label {
  width: 40px;
  color: #a8dadc;
  font-size: 12px;
}

.stat-bar .bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-bar .value {
  width: 30px;
  text-align: right;
  color: #f5f7fa;
  font-size: 12px;
  font-weight: bold;
}

.hero-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: all 0.3s ease;
}

.action-btn.attack {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.action-btn.defend {
  background: linear-gradient(45deg, #f39c12, #d35400);
  color: white;
}

.action-btn.skill {
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.vs-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.vs-icon {
  font-size: 48px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.battle-info {
  text-align: center;
}

.damage-info {
  color: #a8dadc;
  font-size: 14px;
  margin: 5px 0;
}

.battle-log {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.battle-log h3 {
  margin: 0 0 15px 0;
  color: #f5f7fa;
  font-size: 20px;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
}

.log-entry.system {
  color: #a8dadc;
  font-weight: bold;
}

.log-entry.player-action {
  color: #4fc3f7;
}

.log-entry.ai-action {
  color: #ff8a65;
}

.log-entry.current-user {
  background: rgba(52, 152, 219, 0.1);
  border-radius: 5px;
  padding: 8px 10px;
  margin: 2px 0;
}

.log-entry .timestamp {
  color: #a8dadc;
  font-size: 12px;
}

.log-entry .actor {
  color: #f5f7fa;
  font-weight: bold;
}

.log-entry .action {
  color: #bdc3c7;
}

.log-entry .target {
  color: #f5f7fa;
}

.log-entry .damage {
  color: #e74c3c;
  font-weight: bold;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
}

@media (max-width: 768px) {
  .battle-header {
    flex-direction: column;
    gap: 20px;
  }

  .battlefield {
    flex-direction: column;
    gap: 30px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
