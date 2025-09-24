<template>
  <div class="recharge-container">
    <div class="recharge-header">
      <h2>💎 钻石充值</h2>
      <p class="recharge-desc">1元人民币 = 100钻石，选择合适的充值金额</p>
      <div class="current-balance">
        <span>当前余额: </span>
        <span class="diamond-amount">{{ userCurrency.diamonds }} 💎</span>
      </div>
    </div>

    <div class="recharge-options">
      <div
        v-for="option in rechargeOptions"
        :key="option.id"
        class="recharge-card"
        :class="{ selected: selectedOption === option.id }"
        @click="selectOption(option.id)"
      >
        <div class="card-content">
          <div class="diamond-count">
            <span class="diamond-icon">💎</span>
            <span class="count">{{ option.diamonds }}</span>
          </div>
          <div class="price-info">
            <div class="rmb-price">¥{{ option.price }}</div>
            <div class="bonus" v-if="option.bonus > 0">
              +{{ option.bonus }}赠送
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="value-text">{{ (option.diamonds / option.price).toFixed(0) }}钻石/元</span>
        </div>
      </div>
    </div>

    <div class="recharge-actions">
      <button
        @click="confirmRecharge"
        class="confirm-btn"
        :disabled="!selectedOption"
      >
        {{ selectedOption ? '确认充值 ¥' + getSelectedOption().price : '请选择充值金额' }}
      </button>
      <button @click="goBack" class="back-btn">
        返回商城
      </button>
    </div>

    <!-- 支付弹窗 -->
    <div v-if="showPaymentModal" class="modal-overlay" @click="closePaymentModal">
      <div class="payment-modal" @click.stop>
        <div class="modal-header">
          <h3>微信支付</h3>
          <button @click="closePaymentModal" class="close-btn">×</button>
        </div>

        <div class="payment-content">
          <div class="order-info">
            <div class="order-row">
              <span>充值金额:</span>
              <span>¥{{ currentOrder.price }}</span>
            </div>
            <div class="order-row">
              <span>获得钻石:</span>
              <span>{{ currentOrder.diamonds }} 💎</span>
            </div>
            <div class="order-row" v-if="currentOrder.bonus > 0">
              <span>赠送钻石:</span>
              <span>{{ currentOrder.bonus }} 💎</span>
            </div>
            <div class="order-row total">
              <span>总计钻石:</span>
              <span>{{ currentOrder.diamonds + currentOrder.bonus }} 💎</span>
            </div>
          </div>

          <div class="qr-section">
            <div class="qr-instruction">
              <p>请使用微信扫描下方二维码完成支付</p>
              <p class="warning-text">支付完成后钻石将自动到账</p>
            </div>
            <div class="qr-code">
              <img :src="qrCodeUrl" alt="微信支付二维码" class="qr-image" />
            </div>
          </div>

          <div class="payment-actions">
            <button @click="checkPaymentStatus" class="check-status-btn" :disabled="checkingStatus">
              {{ checkingStatus ? '检查中...' : '我已支付完成' }}
            </button>
            <button @click="closePaymentModal" class="cancel-payment-btn">
              取消支付
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 支付成功提示 -->
    <div v-if="showSuccessModal" class="success-overlay" @click="closeSuccessModal">
      <div class="success-content" @click.stop>
        <div class="success-icon">✅</div>
        <h3>充值成功！</h3>
        <p>恭喜您获得 {{ successDiamonds }} 钻石</p>
        <p>当前钻石余额: {{ userCurrency.diamonds }} 💎</p>
        <button @click="closeSuccessModal" class="success-btn">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Recharge',
  data() {
    return {
      selectedOption: null,
      userCurrency: {
        diamonds: 0
      },
      showPaymentModal: false,
      showSuccessModal: false,
      currentOrder: null,
      successDiamonds: 0,
      checkingStatus: false,
      qrCodeUrl: '/zhifu.png', // 使用项目中的支付二维码图片
      rechargeOptions: [
        { id: 1, diamonds: 600, price: 6, bonus: 0 },
        { id: 2, diamonds: 1200, price: 12, bonus: 60 },
        { id: 3, diamonds: 3000, price: 30, bonus: 300 },
        { id: 4, diamonds: 6800, price: 68, bonus: 680 },
        { id: 5, diamonds: 12800, price: 128, bonus: 1280 },
        { id: 6, diamonds: 32800, price: 328, bonus: 3280 },
        { id: 7, diamonds: 64800, price: 648, bonus: 6480 }
      ]
    }
  },
  computed: {
    currentUser() {
      return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    }
  },
  mounted() {
    this.loadUserCurrency();
  },
  methods: {
    async loadUserCurrency() {
      try {
        const response = await fetch(`/api/shop/currency?userId=${this.currentUser.id}`);
        if (response.ok) {
          this.userCurrency = await response.json();
        }
      } catch (error) {
        console.error('加载用户货币失败:', error);
      }
    },

    selectOption(optionId) {
      this.selectedOption = optionId;
    },

    getSelectedOption() {
      return this.rechargeOptions.find(option => option.id === this.selectedOption);
    },

    async confirmRecharge() {
      if (!this.selectedOption) return;

      const selectedOption = this.getSelectedOption();

      try {
        // 创建充值订单
        const response = await fetch('/api/recharge/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: this.currentUser.id,
            diamonds: selectedOption.diamonds,
            bonus: selectedOption.bonus,
            price: selectedOption.price
          })
        });

        if (response.ok) {
          const order = await response.json();
          this.currentOrder = order;
          this.showPaymentModal = true;
        } else {
          alert('创建订单失败，请重试');
        }
      } catch (error) {
        console.error('创建充值订单失败:', error);
        alert('创建订单失败，请重试');
      }
    },

    async checkPaymentStatus() {
      if (!this.currentOrder) return;

      this.checkingStatus = true;

      try {
        const response = await fetch(`/api/recharge/status/${this.currentOrder.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.paid) {
            // 支付成功
            this.successDiamonds = this.currentOrder.diamonds + this.currentOrder.bonus;
            this.userCurrency.diamonds += this.successDiamonds;
            this.showPaymentModal = false;
            this.showSuccessModal = true;
          } else {
            alert('支付还未完成，请稍后再试');
          }
        }
      } catch (error) {
        console.error('检查支付状态失败:', error);
        alert('检查支付状态失败，请重试');
      } finally {
        this.checkingStatus = false;
      }
    },

    closePaymentModal() {
      this.showPaymentModal = false;
      this.currentOrder = null;
    },

    closeSuccessModal() {
      this.showSuccessModal = false;
      this.successDiamonds = 0;
    },

    goBack() {
      this.$router.push({ name: 'Shop' });
    }
  }
}
</script>

<style scoped>
.recharge-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.recharge-header {
  text-align: center;
  margin-bottom: 40px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.recharge-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
}

.recharge-desc {
  color: #666;
  margin: 0 0 20px 0;
  font-size: 16px;
}

.current-balance {
  font-size: 18px;
  color: #333;
}

.diamond-amount {
  color: #007bff;
  font-weight: bold;
}

.recharge-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.recharge-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.recharge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-color: #007bff;
}

.recharge-card.selected {
  border-color: #007bff;
  background: linear-gradient(135deg, #fff 0%, #e3f2fd 100%);
  box-shadow: 0 0 20px rgba(0, 123, 255, 0.3);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.diamond-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diamond-icon {
  font-size: 32px;
}

.count {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.price-info {
  text-align: right;
}

.rmb-price {
  font-size: 20px;
  font-weight: bold;
  color: #28a745;
}

.bonus {
  font-size: 14px;
  color: #dc3545;
  font-weight: bold;
  margin-top: 4px;
}

.card-footer {
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.value-text {
  color: #666;
  font-size: 12px;
}

.recharge-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.confirm-btn, .back-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
}

.confirm-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.back-btn {
  background: #6c757d;
  color: white;
}

.back-btn:hover {
  background: #545b62;
}

/* 支付弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.payment-modal {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-content {
  padding: 24px;
}

.order-info {
  margin-bottom: 24px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-row.total {
  border-bottom: none;
  font-weight: bold;
  color: #007bff;
  border-top: 2px solid #007bff;
  margin-top: 8px;
  padding-top: 16px;
}

.qr-section {
  text-align: center;
  margin-bottom: 24px;
}

.qr-instruction {
  margin-bottom: 20px;
}

.qr-instruction p {
  margin: 8px 0;
  color: #333;
}

.warning-text {
  color: #dc3545;
  font-weight: bold;
}

.qr-code {
  margin: 20px 0;
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.payment-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.check-status-btn, .cancel-payment-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.check-status-btn {
  background: #007bff;
  color: white;
}

.check-status-btn:hover:not(:disabled) {
  background: #0056b3;
}

.check-status-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-payment-btn {
  background: #6c757d;
  color: white;
}

.cancel-payment-btn:hover {
  background: #545b62;
}

/* 成功弹窗样式 */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.success-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.success-content h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.success-content p {
  margin: 8px 0;
  color: #666;
}

.success-btn {
  margin-top: 24px;
  padding: 12px 32px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.success-btn:hover {
  background: #218838;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .recharge-options {
    grid-template-columns: 1fr;
  }

  .recharge-actions {
    flex-direction: column;
  }

  .card-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .price-info {
    text-align: center;
  }

  .payment-modal {
    margin: 20px;
    width: calc(100% - 40px);
  }

  .qr-image {
    width: 150px;
    height: 150px;
  }
}
</style>

