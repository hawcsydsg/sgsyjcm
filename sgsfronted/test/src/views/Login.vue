<template>
  <div class="sgs-login-container" :style="{ backgroundImage: 'url(' + backgroundImg + ')' }">
    <!-- 三国杀登录框 -->
    <div class="sgs-login-box">
      <!-- 装饰性边框图案 -->
      <div class="sgs-border-decoration top"></div>
      <div class="sgs-border-decoration right"></div>
      <div class="sgs-border-decoration bottom"></div>
      <div class="sgs-border-decoration left"></div>
      
      <!-- Logo区域 -->
      <div class="sgs-logo">
        <div class="sgs-logo-frame">
          <h1 class="sgs-title">一将成名</h1>
          <p class="sgs-subtitle">三国杀</p>
        </div>
      </div>
      
      <!-- 登录表单 -->
      <form @submit.prevent="handleLogin" class="sgs-login-form">
        <div class="form-group">
          <div class="sgs-input-wrapper">
            <input 
              type="text" 
              id="username" 
              v-model="loginForm.username" 
              required 
              placeholder="请输入账号"
              autocomplete="off"
            />
            <div class="input-border"></div>
          </div>
        </div>
        
        <div class="form-group">
          <div class="sgs-input-wrapper">
            <input 
              type="password" 
              id="password" 
              v-model="loginForm.password" 
              required 
              placeholder="请输入密码"
              autocomplete="off"
            />
            <div class="input-border"></div>
          </div>
        </div>
        
        <div class="sgs-form-options">
          <label class="sgs-checkbox">
            <input type="checkbox" v-model="rememberMe">
            <span class="checkmark"></span>
            记住密码
          </label>
          <div class="sgs-links">
            <a href="#" class="sgs-link" @click.prevent="handleRegister">注册账号</a>
          </div>
        </div>
        
        <div class="sgs-form-actions">
          <button type="submit" class="sgs-login-btn" :disabled="loading">
            <span class="btn-text" v-if="!loading">进入战场</span>
            <span class="btn-text" v-else>登录中...</span>
          </button>
          
          <button type="button" class="sgs-guest-btn" @click="guestLogin">
            游客试玩
          </button>
        </div>
      </form>
      
      <!-- 底部信息 -->
      <div class="sgs-footer">
        <p class="copyright">© 2025 游卡网络 Yoka Games</p>
      </div>
    </div>
    
    <!-- 装饰性元素 -->
    <div class="sgs-decoration top-left"></div>
    <div class="sgs-decoration top-right"></div>
    <div class="sgs-decoration bottom-left"></div>
    <div class="sgs-decoration bottom-right"></div>
  </div>
</template>

<script>
import backgroundImg from '@/assets/sgs_background.jpg';

export default {
  name: 'Login',
  data() {
    return {
      backgroundImg,
      loginForm: {
        username: '',
        password: ''
      },
      rememberMe: false,
      loading: false
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      console.log('登录信息:', this.loginForm);

      try {
        // 调用后端登录API
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.loginForm.username,
            password: this.loginForm.password
          })
        });

        if (response.ok) {
          const user = await response.json();

          // 登录成功
          // 设置登录状态
          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('currentUser', JSON.stringify(user));
          console.log('登录状态已设置，用户:', user);

          // 如果有重定向参数，则跳转到原计划访问的页面，否则跳转到主页
          const redirect = this.$route.query.redirect || '/index';
          console.log('准备跳转到:', redirect);

          this.$router.push(redirect).then(() => {
            console.log('路由跳转成功');
          }).catch(err => {
            console.log('路由跳转失败:', err);
            // 忽略重复导航错误，这是正常现象
            if (err.name !== 'NavigationDuplicated') {
              // 如果是其他错误，则抛出
              console.error('路由跳转错误:', err);
            } else {
              console.log('重复导航错误，但这是正常的');
            }
          });

          // 延迟设置loading为false，让用户看到跳转效果
          setTimeout(() => {
            this.loading = false;
          }, 500);
        } else {
          // 登录失败
          const errorData = await response.json().catch(() => ({ message: '登录失败' }));
          alert(errorData.message || '用户名或密码错误');
          this.loading = false;
        }
      } catch (error) {
        console.error('登录请求失败:', error);
        alert('网络错误，请稍后重试');
        this.loading = false;
      }
    },
    handleRegister() {
      alert('前往注册页面');
    },
    guestLogin() {
      alert('游客访问模式');
    }
  }
}
</script>

<style scoped>
.sgs-login-container {
  display: flex;
  justify-content: flex-end; /* 将登录框移动到右边 */
  align-items: center;
  min-height: 100vh;
  background-repeat: no-repeat;
  background-position: center center;
  background-attachment: fixed;
  background-size: cover;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  padding-right: 100px; /* 添加右边距，避免紧贴边缘 */
}

.sgs-login-box {
    background: rgba(44, 22, 22, 0.5); /* 调整透明度 */
    backdrop-filter: blur(5px);
    border-radius: 10px;
    border: 2px solid #8b4513;
    box-shadow: 
        0 0 20px rgba(139, 69, 19, 0.5),
        inset 0 0 15px rgba(139, 69, 19, 0.3);
    width: 100%;
    max-width: 400px;
    padding: 30px 25px;
    position: relative;
    z-index: 10;
    overflow: hidden;
}

/* 登录框装饰边框 */
.sgs-border-decoration {
  position: absolute;
  background: linear-gradient(45deg, #8b4513, #d2691e, #8b4513);
  z-index: -1;
}

.sgs-border-decoration.top {
  top: -2px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d2691e, transparent);
}

.sgs-border-decoration.bottom {
  bottom: -2px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d2691e, transparent);
}

.sgs-border-decoration.left {
  left: -2px;
  top: 10%;
  bottom: 10%;
  width: 2px;
  background: linear-gradient(180deg, transparent, #d2691e, transparent);
}

.sgs-border-decoration.right {
  right: -2px;
  top: 10%;
  bottom: 10%;
  width: 2px;
  background: linear-gradient(180deg, transparent, #d2691e, transparent);
}

.sgs-logo-frame {
  position: relative;
  padding: 15px;
  margin-bottom: 20px;
}

.sgs-logo-frame::before,
.sgs-logo-frame::after {
  content: "";
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid #8b4513;
}

.sgs-logo-frame::before {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.sgs-logo-frame::after {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.sgs-logo-frame .sgs-subtitle::before,
.sgs-logo-frame .sgs-subtitle::after {
  content: "";
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid #8b4513;
}

.sgs-logo-frame .sgs-subtitle::before {
  bottom: -25px;
  left: 0;
  border-right: none;
  border-top: none;
}

.sgs-logo-frame .sgs-subtitle::after {
  bottom: -25px;
  right: 0;
  border-left: none;
  border-top: none;
}

.sgs-title {
  font-size: 36px;
  background: linear-gradient(to right, #f5deb3, #d2b48c, #f5deb3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 10px;
  font-weight: bold;
  letter-spacing: 5px;
  text-shadow: 0 0 10px rgba(210, 180, 140, 0.5);
  font-family: '华文行楷', 'STXingkai', cursive;
  position: relative;
}

.sgs-title::before {
  content: "★";
  position: absolute;
  left: -25px;
  top: 50%;
  transform: translateY(-50%);
  color: #d2b48c;
  font-size: 20px;
}

.sgs-title::after {
  content: "★";
  position: absolute;
  right: -25px;
  top: 50%;
  transform: translateY(-50%);
  color: #d2b48c;
  font-size: 20px;
}

.sgs-subtitle {
  color: #d2b48c;
  font-size: 20px;
  margin: 0;
  text-shadow: 0 0 5px rgba(210, 180, 140, 0.5);
  font-family: '华文行楷', 'STXingkai', cursive;
  position: relative;
}

.sgs-login-form {
  position: relative;
}

.form-group {
  margin-bottom: 20px;
}

.sgs-input-wrapper {
  position: relative;
}

.sgs-input-wrapper input {
  width: 100%;
  padding: 14px 18px;
  background: rgba(30, 15, 15, 0.7);
  border: 1px solid #8b4513;
  border-radius: 5px;
  color: #f5deb3;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
  transition: all 0.3s ease;
}

.sgs-input-wrapper input:focus {
  border-color: #d2b48c;
  box-shadow: 0 0 10px rgba(210, 180, 140, 0.5);
}

.sgs-input-wrapper input::placeholder {
  color: #8b7355;
}

.input-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #8b4513;
  border-radius: 5px;
  pointer-events: none;
  opacity: 0.5;
}

.sgs-form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 14px;
}

.sgs-checkbox {
  display: flex;
  align-items: center;
  color: #d2b48c;
  cursor: pointer;
  position: relative;
}

.sgs-checkbox input {
  opacity: 0;
  position: absolute;
}

.checkmark {
  width: 18px;
  height: 18px;
  background: rgba(30, 15, 15, 0.7);
  border: 1px solid #8b4513;
  border-radius: 3px;
  margin-right: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sgs-checkbox input:checked + .checkmark::after {
  content: '✓';
  color: #d2b48c;
  font-weight: bold;
  font-size: 14px;
}

.sgs-links {
  display: flex;
  align-items: center;
}

.sgs-link {
  color: #d2b48c;
  text-decoration: none;
  transition: color 0.3s ease;
  font-size: 14px;
}

.sgs-link:hover {
  color: #f5deb3;
  text-decoration: underline;
}

.sgs-form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sgs-login-btn, .sgs-guest-btn {
  padding: 14px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  color: #fff;
  text-align: center;
}

.sgs-login-btn {
  background: linear-gradient(45deg, #8b4513, #d2691e);
  box-shadow: 0 4px 10px rgba(139, 69, 19, 0.4);
  letter-spacing: 2px;
}

.sgs-login-btn:hover:not(:disabled) {
  background: linear-gradient(45deg, #a0522d, #cd853f);
  box-shadow: 0 6px 15px rgba(139, 69, 19, 0.6);
  transform: translateY(-2px);
}

.sgs-login-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.sgs-guest-btn {
  background: transparent;
  border: 1px solid #8b4513;
  color: #d2b48c;
}

.sgs-guest-btn:hover {
  background: rgba(139, 69, 19, 0.2);
  box-shadow: 0 0 10px rgba(139, 69, 19, 0.3);
}

.sgs-footer {
  text-align: center;
  margin-top: 20px;
}

.copyright {
  color: #8b7355;
  font-size: 12px;
  margin: 0;
}

.sgs-decoration {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 2px solid #8b4513;
  z-index: 5;
}

.sgs-decoration.top-left {
  top: 15px;
  left: 15px;
  border-right: none;
  border-bottom: none;
}

.sgs-decoration.top-right {
  top: 15px;
  right: 15px;
  border-left: none;
  border-bottom: none;
}

.sgs-decoration.bottom-left {
  bottom: 15px;
  left: 15px;
  border-right: none;
  border-top: none;
}

.sgs-decoration.bottom-right {
  bottom: 15px;
  right: 15px;
  border-left: none;
  border-top: none;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .sgs-login-box {
    padding: 25px 20px;
    margin: 0 15px;
  }
  
  .sgs-title {
    font-size: 30px;
  }
  
  .sgs-subtitle {
    font-size: 18px;
  }
}
</style>
