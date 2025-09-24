<template>
  <div class="sgs-layout">
    <!-- 侧边栏 -->
    <div class="sgs-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h2 v-if="!sidebarCollapsed">一将成名</h2>
        <div class="toggle-btn" :class="{ collapsed: sidebarCollapsed }" @click="toggleSidebar">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div class="sidebar-menu">
        <div
            class="menu-item"
            :class="{ active: $route.name === 'Home' }"
            @click="navigateTo('Home')"
        >
          <i class="menu-icon">🏠</i>
          <span v-if="!sidebarCollapsed">首页</span>
        </div>

        <div
            class="menu-item"
            :class="{ active: $route.name === 'Generals' }"
            @click="navigateTo('Generals')"
        >
          <i class="menu-icon">⚔️</i>
          <span v-if="!sidebarCollapsed">武将列表</span>
        </div>

        <div
            class="menu-item"
            :class="{ active: $route.name === 'Players' }"
            @click="navigateTo('Players')"
        >
          <i class="menu-icon">👤</i>
          <span v-if="!sidebarCollapsed">玩家列表</span>
        </div>

        <div
            class="menu-item"
            :class="{ active: $route.name === 'GameCards' }"
            @click="navigateTo('GameCards')"
        >
          <i class="menu-icon">🃏</i>
          <span v-if="!sidebarCollapsed">游戏卡牌</span>
        </div>

        <div
            class="menu-item"
            :class="{ active: $route.name === 'BattleRooms' }"
            @click="navigateTo('BattleRooms')"
        >
          <i class="menu-icon">⚔️</i>
          <span v-if="!sidebarCollapsed">对战大厅</span>
        </div>

        <div
            class="menu-item"
            :class="{ active: $route.name === 'Friends' }"
            @click="navigateTo('Friends')"
        >
          <i class="menu-icon">🤝</i>
          <span v-if="!sidebarCollapsed">好友</span>
        </div>

        <div
            class="menu-item"
            :class="{ active: $route.name === 'Shop' }"
            @click="navigateTo('Shop')"
        >
          <i class="menu-icon">🛍️</i>
          <span v-if="!sidebarCollapsed">商城</span>
        </div>

        <div
            class="menu-item"
            @click="openAIAssistant"
        >
          <i class="menu-icon">🤖</i>
          <span v-if="!sidebarCollapsed">AI助手</span>
        </div>
      </div>
      
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <p>© 2025 三国杀</p>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="sgs-main" :class="{ collapsed: sidebarCollapsed }">
      <div class="sgs-header">
        <div class="header-content">
          <h1>三国杀一将成名</h1>
          <div class="user-info">
            <span class="welcome-text">欢迎，{{ currentUser.username }}!</span>
            <button @click="logout" class="logout-btn">退出登录</button>
          </div>
        </div>
      </div>

      <div class="sgs-content">
        <router-view></router-view>
      </div>
    </div>

    <!-- AI助手弹窗 -->
    <AIAssistant
      v-if="showAIAssistant"
      @close="closeAIAssistant"
    />
  </div>
</template>

<script>
import AIAssistant from '@/components/AIAssistant.vue'

export default {
  name: 'Index',
  components: {
    AIAssistant
  },
  data() {
    return {
      sidebarCollapsed: false,
      currentUser: { username: '管理员' },
      showAIAssistant: false
    }
  },
  mounted() {
    // 获取当前登录用户信息
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    navigateTo(routeName) {
      // 避免重复导航到同一页面
      if (this.$route.name !== routeName) {
        this.$router.push({ name: routeName }).catch(err => {
          // 忽略重复导航错误
          if (err.name !== 'NavigationDuplicated') {
            console.error('路由跳转错误:', err);
          }
        });
      }
    },
    logout() {
      // 清除登录状态
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('currentUser');
      // 跳转到登录页
      this.$router.push('/');
    },
    openAIAssistant() {
      this.showAIAssistant = true;
    },
    closeAIAssistant() {
      this.showAIAssistant = false;
    }
  }
}
</script>

<style scoped>
.sgs-layout {
  display: flex;
  height: 100vh;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.sgs-sidebar {
  width: 200px;
  background: linear-gradient(180deg, #8b4513 0%, #d2691e 100%);
  color: #f5deb3;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sgs-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(245, 222, 179, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
}

.toggle-btn {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(245, 222, 179, 0.2);
}

.toggle-btn.collapsed {
  margin: 0 auto;
  padding: 12px 8px;
}

.toggle-btn span {
  width: 20px;
  height: 2px;
  background: #f5deb3;
  margin: 2px 0;
  transition: 0.4s;
}

.toggle-btn.collapsed span {
  width: 16px;
}

.sidebar-menu {
  flex: 1;
  padding: 20px 0;
}

.menu-item {
  padding: 15px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(245, 222, 179, 0.2);
}

.menu-item.active {
  background: rgba(245, 222, 179, 0.3);
  border-left: 4px solid #f5deb3;
}

.menu-icon {
  width: 20px;
  height: 20px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-footer {
  padding: 20px;
  text-align: center;
  font-size: 12px;
  border-top: 1px solid rgba(245, 222, 179, 0.3);
}

.sgs-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.sgs-header {
  background: #8b4513;
  color: #f5deb3;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.welcome-text {
  font-size: 16px;
}

.logout-btn {
  padding: 8px 15px;
  background: rgba(245, 222, 179, 0.2);
  color: #f5deb3;
  border: 1px solid #f5deb3;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(245, 222, 179, 0.3);
}

.sgs-content {
  flex: 1;
  background: #f8f9fc;
  padding: 20px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sgs-sidebar {
    position: fixed;
    z-index: 1000;
    height: 100%;
  }
  
  .sgs-sidebar.collapsed {
    transform: translateX(-100%);
  }
}
</style>