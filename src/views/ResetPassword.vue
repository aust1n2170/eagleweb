<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const email = ref('')

onMounted(async () => {
  // Get the email from URL hash if available
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const accessToken = hashParams.get('access_token')
  
  if (accessToken) {
    // User came from email link - verify they have a valid session
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        email.value = user.email || ''
      }
    } catch (err) {
      console.error('Error getting user:', err)
      error.value = 'Invalid or expired reset link. Please request a new password reset.'
    }
  } else {
    // Check if user is already authenticated with a password reset session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      email.value = session.user.email || ''
    } else {
      error.value = 'No reset session found. Please request a new password reset.'
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  }
})

const handleResetPassword = async () => {
  if (!password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data, error: resetError } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (resetError) throw resetError
    
    if (data.user) {
      success.value = true
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    }
  } catch (err) {
    error.value = err.message || 'Error resetting password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-password-page">
    <nav class="navbar">
      <div class="navbar-left">
        <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
        <router-link to="/browse" class="nav-link">Browse Dining Halls</router-link>
      </div>
      <div class="nav-buttons">
      </div>
    </nav>
    
    <main class="reset-content">
      <div class="reset-container">
        <h1>Reset Your Password</h1>
        
        <div v-if="success" class="success-view">
          <div class="success-icon">✓</div>
          <h2>Password Reset Successful!</h2>
          <p>Your password has been updated successfully.</p>
          <p class="redirect-text">Redirecting to login...</p>
        </div>
        
        <form v-else @submit.prevent="handleResetPassword" class="reset-form">
          <div v-if="email" class="email-display">
            <p>Resetting password for: <strong>{{ email }}</strong></p>
          </div>
          
          <div class="form-group">
            <label for="password">New Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your new password"
              required
              autocomplete="new-password"
              class="reset-input"
            />
            <small class="password-hint">Must be at least 6 characters</small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              required
              autocomplete="new-password"
              class="reset-input"
            />
          </div>
          
          <div v-if="error" class="error-message">{{ error }}</div>
          
          <button type="submit" class="reset-button" :disabled="loading">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
          
          <button type="button" class="back-link" @click="router.push('/')">
            Back to Login
          </button>
        </form>
      </div>
    </main>
  </div>
</template>

<style scoped>
.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  text-decoration: underline;
}

.reset-password-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.reset-content {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
}

.reset-container {
  width: 100%;
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reset-container h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #000;
  text-align: center;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.email-display {
  padding: 1rem;
  background-color: #e3f2fd;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.email-display p {
  margin: 0;
  color: #333;
  font-size: 0.9rem;
}

.email-display strong {
  color: #000;
  font-weight: 600;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.reset-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.reset-input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.password-hint {
  font-size: 0.8rem;
  color: #666;
}

.error-message {
  color: #d32f2f;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 6px;
  font-size: 0.9rem;
}

.reset-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-button:hover:not(:disabled) {
  background-color: #333;
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-link {
  width: 100%;
  padding: 0.75rem;
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.back-link:hover {
  background-color: #f5f5f5;
  border-color: #000;
  color: #000;
}

.success-view {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background-color: #4caf50;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.success-view h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #000;
  font-weight: 600;
}

.success-view p {
  color: #333;
  margin: 0.5rem 0;
  line-height: 1.6;
}

.redirect-text {
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
}
</style>

