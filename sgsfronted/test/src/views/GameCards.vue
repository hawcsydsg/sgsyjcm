<template>
  <div class="game-cards-container">
    <div class="game-cards-header">
      <h1>游戏卡牌</h1>
      <div class="header-actions">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="搜索卡牌..." 
          class="search-input"
        />
      </div>
    </div>

    <div class="game-cards-content">
      <div class="filters">
        <div class="filter-group">
          <label>类型:</label>
          <select v-model="selectedType">
            <option value="">全部</option>
            <option value="基本牌">基本牌</option>
            <option value="锦囊牌">锦囊牌</option>
            <option value="装备牌">装备牌</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>花色:</label>
          <select v-model="selectedSuit">
            <option value="">全部</option>
            <option value="黑桃">黑桃</option>
            <option value="红心">红心</option>
            <option value="梅花">梅花</option>
            <option value="方片">方片</option>
          </select>
        </div>
      </div>

      <div class="cards-grid">
        <div 
          v-for="card in filteredCards" 
          :key="card.id" 
          class="card-item"
          @click="viewCardDetails(card)"
        >
          <div class="card-image">
            <img 
              :src="getCardImage(card)" 
              :alt="card.name"
              @error="handleImageError(card.id)"
            />
          </div>
          <div class="card-info">
            <h3>{{ card.name }}</h3>
            <div class="card-meta">
              <span class="type" :class="card.type">{{ card.type }}</span>
              <span class="suit" :class="card.suit">{{ card.suit }}</span>
            </div>
            <div class="card-description">
              {{ card.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameCards',
  data() {
    return {
      cards: [
        // 基本牌
        { id: 1, name: '杀', type: '基本牌', suit: '黑桃', point: 'A', description: '出牌阶段，对攻击范围内的一名其他角色使用，对其造成1点伤害。' },
        { id: 2, name: '闪', type: '基本牌', suit: '红心', point: 'A', description: '当需要抵消【杀】的效果时使用。' },
        { id: 4, name: '桃', type: '基本牌', suit: '红心', point: '3', description: '出牌阶段对自己使用，回复1点体力。' },
        { id: 5, name: '酒', type: '基本牌', suit: '方片', point: 'A', description: '出牌阶段对自己使用，本回合使用的下一张【杀】伤害+1。' },
        
        // 锦囊牌
        { id: 6, name: '无懈可击', type: '锦囊牌', suit: '黑桃', point: 'A', description: '当任意锦囊牌对一名角色生效时，对此锦囊牌使用，抵消其效果。' },
        { id: 7, name: '无中生有', type: '锦囊牌', suit: '红心', point: 'A', description: '出牌阶段对自己使用，摸两张牌。' },
        { id: 8, name: '顺手牵羊', type: '锦囊牌', suit: '黑桃', point: 'A', description: '出牌阶段对距离为1的一名其他角色使用，获得其区域内的一张牌。' },
        { id: 9, name: '借刀杀人', type: '锦囊牌', suit: '梅花', point: 'A', description: '出牌阶段对装备区里有武器牌的一名其他角色A使用，令其对另一名角色B使用【杀】。' },
        
        // 装备牌
        { id: 10, name: '诸葛连弩', type: '装备牌', suit: '梅花', point: 'A', description: '武器牌，攻击范围：1，你使用的【杀】无次数限制。' },
        { id: 11, name: '贯石斧', type: '装备牌', suit: '黑桃', point: 'A', description: '武器牌，攻击范围：3，你使用的【杀】被闪避后，可以弃两张牌强制造成伤害。' },
        { id: 12, name: '八卦阵', type: '装备牌', suit: '黑桃', point: 'A', description: '防具牌，当你需要使用或打出一张【闪】时，可以进行一次判定。' },
        { id: 13, name: '赤兔', type: '装备牌', suit: '红心', point: 'A', description: '坐骑牌（+1马），你的攻击范围+1。' },
        { id: 14, name: '大宛', type: '装备牌', suit: '黑桃', point: 'A', description: '坐骑牌（+1马），你的攻击范围+1。' },
        {id: 15, name: '白银狮子', type: '装备牌', suit: '梅花', point: 'A', description: '受到的伤害始终唯一，被弃置时可恢复一点体力'}
      ],
      searchTerm: '',
      selectedType: '',
      selectedSuit: '',
      imageLoadErrors: new Set(),
      // 创建本地图片映射
      cardImageMap: {
        '杀': require('@/assets/cards/杀.png'),
        '闪': require('@/assets/cards/闪.png'),
        '桃': require('@/assets/cards/桃.png'),
        '酒': require('@/assets/cards/酒.png'),
        '无懈可击': require('@/assets/cards/无懈可击.png'),
        '无中生有': require('@/assets/cards/无中生有.png'),
        '顺手牵羊': require('@/assets/cards/顺手牵羊.png'),
        '借刀杀人': require('@/assets/cards/借刀杀人.png'),
        '诸葛连弩': require('@/assets/cards/诸葛连弩.png'),
        '贯石斧': require('@/assets/cards/贯石斧.png'),
        '八卦阵': require('@/assets/cards/八卦阵.png'),
        '赤兔': require('@/assets/cards/赤兔.png'),
        '大宛': require('@/assets/cards/大宛.png'),
        '白银狮子': require('@/assets/cards/白银狮子.png')
      }
    }
  },
  computed: {
    filteredCards() {
      return this.cards.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesType = this.selectedType ? card.type === this.selectedType : true;
        const matchesSuit = this.selectedSuit ? card.suit === this.selectedSuit : true;
        
        return matchesSearch && matchesType && matchesSuit;
      });
    }
  },
  methods: {
    getCardImage(card) {
      // 如果图片加载失败，显示默认图片
      if (this.imageLoadErrors.has(card.id)) {
        return this.getDefaultImage(card);
      }
      
      // 尝试获取本地图片
      if (this.cardImageMap[card.name]) {
        return this.cardImageMap[card.name];
      }
      
      // 返回默认图片占位符
      return this.getDefaultImage(card);
    },
    getDefaultImage(card) {
      // 返回默认图片占位符
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+JiN4ZTEzMDs8L3RleHQ+PC9zdmc+';
    },
    handleImageError(cardId) {
      // 标记图片加载失败，避免重复尝试加载
      this.imageLoadErrors.add(cardId);
    },
    viewCardDetails(card) {
      // 可以在这里添加查看卡牌详情的逻辑
      console.log('查看卡牌详情:', card);
    }
  }
}
</script>

<style scoped>
.game-cards-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100%;
}

.game-cards-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.game-cards-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: bold;
  color: #555;
}

.filter-group select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.card-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  min-height: 350px; /* 增加最小高度以确保内容完整显示 */
}

.card-image {
  overflow: hidden;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1; /* 根据实际图片比例调整 */
  padding: 10px; /* 添加一些内边距以避免图片紧贴边缘 */
}

.card-image img {
  width: 70%; /* 图片宽度占满容器 */
  height: auto; /* 自动调整高度以适应宽度 */
  object-fit: cover; /* 使用cover代替contain以填充整个容器 */
  max-width: 100%; /* 确保图片最大宽度不超过容器 */
  max-height: 100%; /* 确保图片最大高度不超过容器 */
}

.card-info {
  padding: 15px;
}

.card-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.card-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.type.基本牌 {
  background-color: #1E90FF;
}

.type.锦囊牌 {
  background-color: #FF6347;
}

.type.装备牌 {
  background-color: #32CD32;
}

.suit {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.suit.黑桃 {
  background-color: #000000;
}

.suit.红心 {
  background-color: #FF0000;
}

.suit.梅花 {
  background-color: #008000;
}

.suit.方片 {
  background-color: #FF0000;
}

.card-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}
</style>