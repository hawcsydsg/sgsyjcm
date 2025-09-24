<template>
  <div class="shop-container">
    <div class="shop-header">
      <h2>英雄商城</h2>
      <div class="header-actions">
        <div class="currency-display">
          <div class="currency-item">
            <span class="coin-icon">💰</span>
            <span class="amount">{{ userCurrency.gameCoins }}</span>
          </div>
          <div class="currency-item">
            <span class="diamond-icon">💎</span>
            <span class="amount">{{ userCurrency.diamonds }}</span>
          </div>
        </div>
        <button @click="openExchangeModal" class="exchange-btn">
          💎 ⇄ 💰 兑换
        </button>
        <button @click="goToRecharge" class="recharge-btn">
          💎 充值
        </button>
      </div>
    </div>

    <div class="shop-content">
      <!-- 武将列表 -->
      <div class="shop-items">
        <div
          v-for="hero in unownedHeroes"
          :key="hero.id"
          class="shop-item-card"
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
            <h3 class="hero-name">{{ hero.name }}</h3>
            <p class="hero-description">{{ hero.description }}</p>

            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-label">武力:</span>
                <span class="stat-value">{{ hero.combatPower }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">谋略:</span>
                <span class="stat-value">{{ hero.strategyPower }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">防御:</span>
                <span class="stat-value">{{ hero.defensePower }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">速度:</span>
                <span class="stat-value">{{ hero.speed }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">HP:</span>
                <span class="stat-value">{{ hero.hp }}</span>
              </div>
            </div>
          </div>

          <div class="purchase-section">
            <div class="price-display">
              <div v-if="getHeroPrice(hero).coins > 0" class="price-item">
                <span class="coin-icon">💰</span>
                <span class="price">{{ getHeroPrice(hero).coins }}</span>
              </div>
              <div v-if="getHeroPrice(hero).diamonds > 0" class="price-item">
                <span class="diamond-icon">💎</span>
                <span class="price">{{ getHeroPrice(hero).diamonds }}</span>
              </div>
            </div>

            <button
              @click="showPurchaseConfirm(hero)"
              class="purchase-btn"
            >
              购买
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 购买确认弹窗 -->
    <div v-if="showConfirmDialog" class="modal-overlay" @click="closeConfirmDialog">
      <div class="modal-content" @click.stop>
        <h3>确认购买</h3>

        <div class="purchase-details">
          <div class="hero-preview">
            <div class="avatar-placeholder" v-if="(!selectedHero.imageUrl || selectedHero.imageUrl.trim() === '')">
              {{ selectedHero.name.charAt(0) }}
            </div>
            <img
              v-else
              :src="getHeroImage(selectedHero.imageUrl)"
              :alt="selectedHero.name"
              class="preview-image"
              @error="handleImageError"
            />
            <h4>{{ selectedHero.name }}</h4>
          </div>

          <div class="price-breakdown">
            <div class="price-row">
              <span>武将名称:</span>
              <span>{{ selectedHero.name }}</span>
            </div>
            <div v-if="getHeroPrice(selectedHero).coins > 0" class="price-row">
              <span>金币价格:</span>
              <span>{{ getHeroPrice(selectedHero).coins }} 💰</span>
            </div>
            <div v-if="getHeroPrice(selectedHero).diamonds > 0" class="price-row">
              <span>钻石价格:</span>
              <span>{{ getHeroPrice(selectedHero).diamonds }} 💎</span>
            </div>
            <div class="price-row total">
              <span>账户余额:</span>
              <span>{{ userCurrency.gameCoins }} 💰, {{ userCurrency.diamonds }} 💎</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="confirmPurchase" class="confirm-btn" :disabled="!canAfford">
            {{ canAfford ? '确认购买' : '余额不足' }}
          </button>
          <button @click="closeConfirmDialog" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 钻石兑换弹窗 -->
    <div v-if="showExchangeModal" class="modal-overlay" @click="closeExchangeDialog">
      <div class="modal-content exchange-modal" @click.stop>
        <h3>💎 钻石兑换金币</h3>
        <p class="exchange-desc">1钻石 = 100金币</p>

        <div class="exchange-form">
          <div class="input-group">
            <label>兑换钻石数量:</label>
            <input
              type="number"
              v-model.number="exchangeDiamonds"
              min="1"
              :max="userCurrency.diamonds"
              placeholder="输入钻石数量"
            />
          </div>

          <div class="exchange-preview">
            <div class="preview-row">
              <span>兑换钻石:</span>
              <span>{{ exchangeDiamonds }} 💎</span>
            </div>
            <div class="preview-row">
              <span>获得金币:</span>
              <span>{{ exchangeDiamonds * 100 }} 💰</span>
            </div>
            <div class="preview-row remaining">
              <span>兑换后余额:</span>
              <span>{{ userCurrency.diamonds - exchangeDiamonds }} 💎</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="confirmExchange" class="confirm-btn" :disabled="!canExchange">
            确认兑换
          </button>
          <button @click="closeExchangeDialog" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 购买成功提示 -->
    <div v-if="showSuccessDialog" class="success-overlay" @click="closeSuccessDialog">
      <div class="success-content" @click.stop>
        <div class="success-icon">✅</div>
        <h3>购买成功！</h3>
        <p>您已成功购买 {{ successHero.name }}</p>
        <p>剩余金币: {{ updatedCurrency.gameCoins }} 💰</p>
        <p>剩余钻石: {{ updatedCurrency.diamonds }} 💎</p>
        <button @click="closeSuccessDialog" class="success-btn">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Shop',
  data() {
    return {
      allHeroes: [],
      shopItems: [], // 商城上架的商品信息
      userCurrency: {
        gameCoins: 0,
        diamonds: 0
      },
      ownedHeroes: [],
      showConfirmDialog: false,
      showSuccessDialog: false,
      showExchangeModal: false,
      selectedHero: null, // 改为selectedHero，因为现在直接用hero对象
      successHero: null,
      exchangeDiamonds: 0,
      updatedCurrency: {
        gameCoins: 0,
        diamonds: 0
      }
    }
  },
  computed: {
    currentUser() {
      return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    },
    canAfford() {
      if (!this.selectedHero) return false;
      const price = this.getHeroPrice(this.selectedHero);
      return this.userCurrency.gameCoins >= price.coins &&
             this.userCurrency.diamonds >= price.diamonds;
    },
    canExchange() {
      return this.exchangeDiamonds > 0 &&
             this.exchangeDiamonds <= this.userCurrency.diamonds;
    },
    // 获取未拥有的武将列表
    unownedHeroes() {
      return this.allHeroes.filter(hero => !this.isOwned(hero.id));
    }
  },
  mounted() {
    this.loadAllHeroes();
    this.loadShopItems();
    this.loadUserCurrency();
    this.loadOwnedHeroes();
  },
  methods: {
    async loadAllHeroes() {
      try {
        const response = await fetch(`/api/heroes/list?userId=${this.currentUser.id}`);
        if (response.ok) {
          this.allHeroes = await response.json();
        }
      } catch (error) {
        console.error('加载所有武将失败:', error);
      }
    },

    async loadShopItems() {
      try {
        const response = await fetch('/api/shop/items');
        if (response.ok) {
          this.shopItems = await response.json();
        }
      } catch (error) {
        console.error('加载商城商品失败:', error);
      }
    },

    // 根据武将ID获取商城商品信息
    getShopItemForHero(heroId) {
      return this.shopItems.find(item => item.heroId === heroId) || {
        priceCoins: 1000, // 默认价格
        priceDiamonds: 0
      };
    },

    // 获取武将价格（直接使用shop_items表中的价格）
    getHeroPrice(hero) {
      const shopItem = this.getShopItemForHero(hero.id);
      return {
        coins: shopItem.priceCoins || 0,
        diamonds: shopItem.priceDiamonds || 0
      };
    },

    async loadUserCurrency() {
      try {
        const response = await fetch(`/api/shop/currency?userId=${this.currentUser.id}`);
        if (response.ok) {
          const result = await response.json();
          this.userCurrency = result;
        }
      } catch (error) {
        console.error('加载用户货币失败:', error);
      }
    },

    async loadOwnedHeroes() {
      try {
        const response = await fetch(`/api/shop/my-heroes?userId=${this.currentUser.id}`);
        if (response.ok) {
          const ownedHeroes = await response.json();
          this.ownedHeroes = ownedHeroes.map(ph => ph.heroId);
        }
      } catch (error) {
        console.error('加载拥有英雄失败:', error);
      }
    },

    isOwned(heroId) {
      return this.ownedHeroes.includes(heroId);
    },

    showPurchaseConfirm(hero) {
      this.selectedHero = hero;
      this.showConfirmDialog = true;
    },

    closeConfirmDialog() {
      this.showConfirmDialog = false;
      this.selectedHero = null;
    },

    async confirmPurchase() {
      if (!this.canAfford || !this.selectedHero) return;

      try {
        const response = await fetch(`/api/shop/purchase/${this.selectedHero.id}?userId=${this.currentUser.id}`, {
          method: 'POST'
        });

        const result = await response.json();
        if (result.success) {
          // 更新货币和拥有英雄列表
          this.userCurrency.gameCoins = result.remainingCoins;
          this.userCurrency.diamonds = result.remainingDiamonds;
          this.ownedHeroes.push(this.selectedHero.id);

          // 显示成功对话框
          this.successHero = this.selectedHero;
          this.updatedCurrency = {
            gameCoins: result.remainingCoins,
            diamonds: result.remainingDiamonds
          };
          this.showConfirmDialog = false;
          this.showSuccessDialog = true;

          // 刷新所有英雄数据以更新拥有状态
          await this.loadAllHeroes();
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('购买失败:', error);
        alert('购买失败，请重试');
      }
    },

    closeSuccessDialog() {
      this.showSuccessDialog = false;
      this.successHero = null;
    },

    getHeroImage(imageUrl) {
      if (imageUrl.startsWith('@/assets/heroes/')) {
        return imageUrl.replace('@/assets/heroes/', '/src/assets/heroes/');
      }
      return imageUrl;
    },

    handleImageError(event) {
      // 图片加载失败时显示占位符
      const img = event.target;
      const container = img.parentElement;
      if (container) {
        const placeholder = container.querySelector('.avatar-placeholder');
        if (placeholder) {
          placeholder.style.display = 'flex';
        }
        img.style.display = 'none';
      }
    },

    goToRecharge() {
      this.$router.push({ name: 'Recharge' });
    },

    openExchangeModal() {
      this.exchangeDiamonds = 0;
      this.showExchangeModal = true;
    },

    closeExchangeDialog() {
      this.showExchangeModal = false;
      this.exchangeDiamonds = 0;
    },

    async confirmExchange() {
      if (!this.canExchange) return;

      try {
        const response = await fetch('/api/recharge/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: this.currentUser.id,
            diamonds: this.exchangeDiamonds
          })
        });

        const result = await response.json();
        if (result.success) {
          // 更新货币
          this.userCurrency.diamonds -= this.exchangeDiamonds;
          this.userCurrency.gameCoins += result.coinsAdded;

          alert(`兑换成功！获得 ${result.coinsAdded} 金币`);
          this.closeExchangeDialog();
        } else {
          alert(result.message || '兑换失败');
        }
      } catch (error) {
        console.error('兑换失败:', error);
        alert('兑换失败，请重试');
      }
    },
  }
}
</script>

<style scoped>
.shop-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.shop-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.currency-display {
  display: flex;
  gap: 16px;
}

.exchange-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
  margin-right: 10px;
}

.exchange-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
}

.recharge-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.recharge-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.currency-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
}

.coin-icon, .diamond-icon {
  font-size: 18px;
}

.amount {
  font-weight: bold;
  color: #333;
}

.shop-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.shop-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.shop-item-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.shop-item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.hero-avatar {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
}

.hero-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #007bff;
}

.owned-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #28a745;
  color: white;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: bold;
}

.hero-info {
  margin-bottom: 16px;
}

.hero-name {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
  text-align: center;
}

.hero-description {
  color: #666;
  font-size: 14px;
  margin: 0 0 16px 0;
  text-align: center;
  line-height: 1.4;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #007bff;
}

.purchase-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
  text-align: center;
}

.price-display {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.price-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
}

.price {
  font-weight: bold;
  color: #333;
}

.purchase-btn, .owned-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.purchase-btn {
  background: #007bff;
  color: white;
}

.purchase-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.owned-btn {
  background: #28a745;
  color: white;
  cursor: default;
}

/* 弹窗样式 */
.modal-overlay, .success-overlay {
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

.modal-content, .success-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.modal-content h3, .success-content h3 {
  margin: 0 0 20px 0;
  color: #333;
  text-align: center;
}

.purchase-details {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.hero-preview {
  flex: 1;
  text-align: center;
}

.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #007bff;
  margin-bottom: 12px;
}

.hero-preview h4 {
  margin: 0;
  color: #333;
}

.price-breakdown {
  flex: 1;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.price-row.total {
  border-bottom: none;
  font-weight: bold;
  color: #007bff;
  border-top: 2px solid #007bff;
  margin-top: 8px;
  padding-top: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn, .cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-btn {
  background: #007bff;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #0056b3;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #545b62;
}

.success-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.success-content p {
  text-align: center;
  margin: 8px 0;
  color: #666;
}

.success-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
}

.success-btn:hover {
  background: #218838;
}

/* 兑换弹窗样式 */
.exchange-modal {
  max-width: 400px;
}

.exchange-desc {
  color: #666;
  text-align: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.exchange-form {
  margin-bottom: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.input-group input:focus {
  outline: none;
  border-color: #007bff;
}

.exchange-preview {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.preview-row.remaining {
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: bold;
  color: #007bff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .shop-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .currency-display {
    order: -1;
  }

  .exchange-btn, .recharge-btn {
    width: 100%;
    margin: 5px 0;
  }

  .shop-items {
    grid-template-columns: 1fr;
  }

  .purchase-details {
    flex-direction: column;
    text-align: center;
  }

  .modal-content, .success-content {
    min-width: 300px;
    margin: 20px;
  }
}
</style>
