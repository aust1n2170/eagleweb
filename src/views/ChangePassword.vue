<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import AuthModal from '../components/AuthModal.vue'

const router = useRouter()
const user = ref(null)
const authModalOpen = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const changingPassword = ref(false)
const success = ref(false)
const error = ref('')

// Template refs for GSAP animations
const formWrapper = ref(null)
const successAnimation = ref(null)
const checkmarkCircle = ref(null)
const checkmarkCheck = ref(null)
const successText = ref(null)
const errorMessage = ref(null)

onMounted(() => {
  checkUser()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
    if (!user.value) {
      // Redirect to home if not logged in
      router.push('/')
    }
  })
})

const checkUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
  if (!user.value) {
    authModalOpen.value = true
  }
}

const handleChangePassword = async () => {
  if (!currentPassword.value || !newPassword.value || !confirmNewPassword.value) {
    error.value = 'Please fill in all fields'
    nextTick(() => {
      animateError()
    })
    return
  }

  if (newPassword.value.length < 6) {
    error.value = 'New password must be at least 6 characters long'
    nextTick(() => {
      animateError()
    })
    return
  }

  if (newPassword.value !== confirmNewPassword.value) {
    error.value = 'New passwords do not match'
    nextTick(() => {
      animateError()
    })
    return
  }

  changingPassword.value = true
  error.value = ''

  try {
    // First, verify the current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.value.email,
      password: currentPassword.value
    })

    if (signInError) {
      throw new Error('Current password is incorrect')
    }

    // If sign in successful, update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value
    })

    if (updateError) throw updateError

    // Clear password fields immediately
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    
    // Set success state and animate
    success.value = true
    nextTick(() => {
      // Hide form fields instantly
      if (formWrapper.value) {
        gsap.set(formWrapper.value, { display: 'none', opacity: 0 })
      }
      // Animate success with GSAP
      animateSuccess()
      // Redirect back to profile after success animation
      setTimeout(() => {
        router.push('/profile')
      }, 2500)
    })
  } catch (err) {
    console.error('Error changing password:', err)
    error.value = err.message || 'Error changing password. Please try again.'
    // Animate error shake with GSAP
    nextTick(() => {
      animateError()
    })
  } finally {
    changingPassword.value = false
  }
}

// GSAP Animation Functions
const animateSuccess = () => {
  if (!successAnimation.value || !checkmarkCircle.value || !checkmarkCheck.value || !successText.value) return
  
  const tl = gsap.timeline()
  
  // Animate success container
  tl.fromTo(successAnimation.value,
    {
      opacity: 0,
      scale: 0.8
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'back.out(1.7)'
    }
  )
  
  // Animate checkmark circle
  .fromTo(checkmarkCircle.value,
    {
      strokeDashoffset: 166,
      rotation: -90
    },
    {
      strokeDashoffset: 0,
      rotation: 0,
      duration: 0.6,
      ease: 'power2.out'
    },
    '-=0.3'
  )
  
  // Animate checkmark path
  .fromTo(checkmarkCheck.value,
    {
      strokeDashoffset: 48,
      scale: 0
    },
    {
      strokeDashoffset: 0,
      scale: 1,
      duration: 0.3,
      ease: 'back.out(2)'
    },
    '-=0.2'
  )
  
  // Animate success text
  .fromTo(successText.value,
    {
      opacity: 0,
      y: 10
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    },
    '-=0.2'
  )
}

const animateError = () => {
  if (!errorMessage.value) return
  
  gsap.fromTo(errorMessage.value,
    {
      x: 0
    },
    {
      x: -10,
      duration: 0.1,
      repeat: 5,
      yoyo: true,
      ease: 'power1.inOut'
    }
  )
  
  gsap.fromTo(errorMessage.value,
    {
      scale: 1
    },
    {
      scale: 1.05,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    }
  )
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  } else {
    router.push('/')
  }
}
</script>

<template>
  <div class="change-password-page">
    <nav class="navbar">
      <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
      <div class="nav-buttons">
        <div v-if="user" class="user-info">
          <router-link to="/profile" class="user-email">{{ user.email }}</router-link>
          <button class="nav-button logout" @click="handleLogout">Log out</button>
        </div>
      </div>
    </nav>
    
    <main class="change-password-content">
      <div v-if="user" class="change-password-container">
        <div class="page-header">
          <button class="back-button-nav" @click="router.push('/profile')">
            ← Back to Profile
          </button>
          <h1>Change Password</h1>
        </div>
        
        <form @submit.prevent="handleChangePassword" class="change-password-form">
          <div v-show="!success" ref="formWrapper">
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                v-model="currentPassword"
                type="password"
                placeholder="Enter your current password"
                required
                autocomplete="current-password"
                class="password-input"
              />
            </div>
            
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                placeholder="Enter your new password"
                required
                autocomplete="new-password"
                class="password-input"
              />
              <small class="password-hint">Must be at least 6 characters</small>
            </div>
            
            <div class="form-group">
              <label for="confirmNewPassword">Confirm New Password</label>
              <input
                id="confirmNewPassword"
                v-model="confirmNewPassword"
                type="password"
                placeholder="Confirm your new password"
                required
                autocomplete="new-password"
                class="password-input"
              />
            </div>
            
            <div v-if="error && !success" ref="errorMessage" class="password-message error">
              {{ error }}
            </div>
            
            <button type="submit" class="change-password-button" :disabled="changingPassword || success">
              <span v-if="changingPassword" class="button-content">
                <span class="spinner"></span>
                <span>Changing password...</span>
              </span>
              <span v-else class="button-content">
                Change Password
              </span>
            </button>
          </div>
          
          <div v-if="success" ref="successAnimation" class="success-animation">
            <div class="checkmark">
              <svg class="checkmark-svg" viewBox="0 0 52 52">
                <circle ref="checkmarkCircle" class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path ref="checkmarkCheck" class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
            </div>
            <p ref="successText" class="success-text">Password changed successfully!</p>
          </div>
        </form>
      </div>
    </main>
    
    <AuthModal
      :is-open="authModalOpen"
      mode="login"
      @close="() => { authModalOpen = false; router.push('/') }"
      @success="() => { authModalOpen = false; checkUser() }"
    />
  </div>
</template>

<style scoped>
.change-password-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.change-password-content {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.change-password-container {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 2.5rem;
  margin-top: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.back-button-nav {
  background: none;
  border: none;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  font-family: inherit;
  transition: color 0.2s;
}

.back-button-nav:hover {
  color: #000;
}

.change-password-container h1 {
  font-size: 2rem;
  margin: 0 0 2rem 0;
  color: #000;
}

.change-password-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.password-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.password-input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.password-hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.password-message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #4caf50;
  color: #ffffff;
}

.password-message.error {
  background-color: #d32f2f;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-animation {
  text-align: center;
  padding: 1rem 0;
  overflow: visible;
}

.checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  position: relative;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkmark-svg {
  width: 60px;
  height: 60px;
  stroke: #4caf50;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  overflow: visible;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  transform-origin: 26px 26px;
}

.checkmark-check {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  transform-origin: 26px 26px;
}

.success-text {
  color: #4caf50;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

.change-password-button {
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

.change-password-button:hover:not(:disabled) {
  background-color: #333;
}

.change-password-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

