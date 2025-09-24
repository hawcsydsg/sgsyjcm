<template>
  <div class="dashboard">
    <div class="stats-container">
      <div class="stat-card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon" :style="{ backgroundColor: stat.color }">
          <van-icon :name="stat.icon" />
        </div>
        <div class="stat-info">
          <h3>{{ stat.value }}</h3>
          <p>{{ stat.title }}</p>
        </div>
      </div>
    </div>

    <div class="content-sections">
      <div class="section">
        <h2>📊 数据概览</h2>
        <div class="chart-container">
          <div class="chart-placeholder">
            <p>玩家活跃度趋势图</p>
            <div class="chart-grid">
              <div class="chart-bar" v-for="(value, index) in chartData" :key="index" 
                   :style="{ height: value.height }">
                <span class="bar-value">{{ value.value }}</span>
              </div>
            </div>
            <div class="chart-labels">
              <span v-for="(label, index) in chartLabels" :key="index">{{ label }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🔥 热门武将</h2>
        <div class="popular-generals">
          <div class="general-card" v-for="general in popularGenerals" :key="general.id">
            <div class="general-avatar">
              <span v-if="!general.avatar">{{ general.name.substring(0, 1) }}</span>
              <img v-else :src="general.avatar" :alt="general.name">
            </div>
            <div class="general-info">
              <h4>{{ general.name }}</h4>
              <p class="general-faction" :class="general.faction">{{ general.faction }}</p>
              <div class="general-stats">
                <span class="stat">使用率: {{ general.usageRate }}%</span>
                <span class="stat">胜率: {{ general.winRate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-sections">
      <div class="section">
        <h2>📢 最新动态</h2>
        <div class="news-list">
          <div class="news-item" v-for="news in newsList" :key="news.id">
            <div class="news-date">{{ news.date }}</div>
            <div class="news-content">
              <h4>{{ news.title }}</h4>
              <p>{{ news.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>⚡ 快捷操作</h2>
        <div class="quick-actions">
          <div class="action-card" v-for="action in actions" :key="action.title" @click="handleAction(action)">
            <van-icon :name="action.icon" />
            <span>{{ action.title }}</span>
          </div>
        </div>
        
        <div class="section recommended-section">
          <h2>🎯 推荐内容</h2>
          <div class="recommended-content">
            <div class="recommend-item" v-for="item in recommendedItems" :key="item.id" @click="viewRecommendation(item)">
              <div class="recommend-icon">{{ item.icon }}</div>
              <div class="recommend-info">
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Icon } from 'vant';

export default {
  name: 'Home',
  components: {
    'van-icon': Icon,
  },
  data() {
    return {
      stats: [
        { title: '武将数量', value: '186', icon: 'user-o', color: '#8b4513' },
        { title: '游戏副本', value: '24', icon: 'orders-o', color: '#d2691e' },
        { title: '玩家统计', value: '12,345', icon: 'bar-chart-o', color: '#cd853f' },
        { title: '待挑战', value: '8', icon: 'clock-o', color: '#f4a460' }
      ],
      chartData: [
        { height: '60%', value: 120 },
        { height: '80%', value: 160 },
        { height: '40%', value: 80 },
        { height: '70%', value: 140 },
        { height: '90%', value: 180 },
        { height: '75%', value: 150 },
        { height: '65%', value: 130 }
      ],
      chartLabels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      popularGenerals: [
        { id: 1, name: '诸葛亮', faction: '蜀', usageRate: 35.2, winRate: 58.7, avatar: '' },
        { id: 2, name: '曹操', faction: '魏', usageRate: 32.8, winRate: 55.3, avatar: '' },
        { id: 3, name: '周瑜', faction: '吴', usageRate: 28.5, winRate: 52.1, avatar: '' },
        { id: 4, name: '吕布', faction: '群', usageRate: 26.1, winRate: 49.8, avatar: '' }
      ],
      newsList: [
        { id: 1, date: '2025-09-15', title: '新武将上线', content: '全新武将"神·诸葛亮"即将上线，敬请期待！' },
        { id: 2, date: '2025-09-12', title: '赛季更新', content: '新赛季"群雄逐鹿"即将开启，丰厚奖励等你来拿。' },
        { id: 3, date: '2025-09-10', title: '活动预告', content: '中秋节活动即将开启，限时皮肤免费领取。' },
        { id: 4, date: '2025-09-05', title: '平衡性调整', content: '部分武将技能进行调整，详情请查看公告。' }
      ],
      actions: [
        { title: '武将管理', icon: 'user-circle-o', action: 'user' },
        { title: '玩家管理', icon: 'friends-o', action: 'order' },
        { title: '战绩查询', icon: 'records', action: 'stats' },
        { title: '系统设置', icon: 'setting-o', action: 'settings' }
      ],
      recommendedItems: [
        { id: 1, title: '武将搭配推荐', description: '本周热门阵容解析', icon: '⚔️' },
        { id: 2, title: '新手进阶指南', description: '从入门到精通的技巧', icon: '📖' },
        { id: 3, title: '限时活动', description: '参与活动赢取稀有奖励', icon: '🎁' }
      ]
    }
  },
  methods: {
    handleAction(action) {
      switch(action.action) {
        case 'user':
          this.$router.push('/index/generals');
          break;
        case 'order':
          this.$router.push('/index/players');
          break;
        case 'stats':
          alert('战绩查询功能即将上线');
          break;
        case 'settings':
          alert('系统设置功能即将上线');
          break;
        default:
          alert(`您点击了: ${action.title}`);
      }
    },
    viewRecommendation(item) {
      alert(`查看推荐内容: ${item.title}`);
    }
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  display: flex;
  align-items: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #8b4513;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(139, 69, 19, 0.2);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  color: white;
  font-size: 24px;
}

.stat-icon::before {
  content: "";
  display: block;
  width: 30px;
  height: 30px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E");
}

.stat-info h3 {
  margin: 0 0 5px 0;
  font-size: 24px;
  color: #333;
}

.stat-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.content-sections {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.section {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  border: 1px solid #8b4513;
}

.section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  border-bottom: 2px solid #8b4513;
  padding-bottom: 10px;
}

/* 图表样式 */
.chart-container {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  width: 100%;
  text-align: center;
}

.chart-placeholder p {
  margin-bottom: 20px;
  font-weight: bold;
  color: #8b4513;
}

.chart-grid {
  display: flex;
  align-items: end;
  justify-content: space-around;
  height: 180px;
  padding: 0 20px;
  border-bottom: 1px solid #ddd;
  border-left: 1px solid #ddd;
}

.chart-bar {
  width: 40px;
  background: linear-gradient(to top, #8b4513, #d2691e);
  border-radius: 4px 4px 0 0;
  position: relative;
  margin: 0 5px;
}

.bar-value {
  position: absolute;
  top: -25px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
}

.chart-labels {
  display: flex;
  justify-content: space-around;
  padding: 10px 20px 0;
}

.chart-labels span {
  font-size: 12px;
  color: #666;
}

/* 热门武将样式 */
.popular-generals {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.general-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fc;
  transition: background 0.3s ease;
  border: 1px solid #e3e6f0;
}

.general-card:hover {
  background: #f5deb3;
  cursor: pointer;
}

.general-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #8b4513;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 15px;
  overflow: hidden;
}

.general-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.general-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.general-faction {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  margin-bottom: 8px;
}

.general-faction.蜀 {
  background: #ff6b6b;
}

.general-faction.魏 {
  background: #4d96ff;
}

.general-faction.吴 {
  background: #6bcb77;
}

.general-faction.群 {
  background: #ff9f1c;
}

.general-stats {
  display: flex;
  gap: 10px;
}

.stat {
  font-size: 12px;
  color: #666;
}

/* 新闻列表样式 */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.news-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fc;
  transition: background 0.3s ease;
  border: 1px solid #e3e6f0;
}

.news-item:hover {
  background: #f5deb3;
}

.news-date {
  background: #8b4513;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  align-self: flex-start;
  white-space: nowrap;
}

.news-content h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.news-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* 快捷操作样式 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.action-card {
  background: #f8f9fc;
  border-radius: 8px;
  padding: 20px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e3e6f0;
}

.action-card:hover {
  background: #8b4513;
  color: #f5deb3;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(139, 69, 19, 0.3);
}

.action-card i {
  font-size: 24px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-card i::before {
  content: "";
  display: block;
  width: 24px;
  height: 24px;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E") no-repeat center;
}

/* 推荐内容样式 */
.recommended-section {
  margin-top: 30px;
}

.recommended-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.recommend-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fc;
  transition: all 0.3s ease;
  border: 1px solid #e3e6f0;
  cursor: pointer;
}

.recommend-item:hover {
  background: #f5deb3;
  transform: translateX(5px);
}

.recommend-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #8b4513;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  margin-right: 15px;
}

.recommend-info h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.recommend-info p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-sections {
    grid-template-columns: 1fr;
  }

  .stats-container {
    grid-template-columns: 1fr 1fr;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-grid {
    padding: 0 10px;
  }
  
  .chart-bar {
    width: 25px;
    margin: 0 2px;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .news-item {
    flex-direction: column;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .chart-labels span {
    font-size: 10px;
  }
}
</style>