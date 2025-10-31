<script setup>
import { ref, watch, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { supabase } from '../lib/supabase'

const props = defineProps({
  mode: {
    type: String,
    default: 'login' // 'login' or 'signup'
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

const email = ref('')
const password = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')
const forgotPasswordMode = ref(false)
const resetEmailSent = ref(false)

// Template refs for GSAP animations
const modalOverlay = ref(null)
const modalContent = ref(null)
const formGroups = ref([])
const formWrapper = ref(null)
const errorMessage = ref(null)
const successAnimation = ref(null)
const checkmarkCircle = ref(null)
const checkmarkCheck = ref(null)
const successText = ref(null)

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (props.mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      })
      
      if (signUpError) throw signUpError
      
      if (data.user) {
        emit('success', { message: 'Account created! Please check your email to verify your account.' })
        resetForm()
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      
      if (signInError) throw signInError
      
      if (data.user) {
        // Clear form immediately
        resetForm()
        // Set success state - v-show will hide form instantly
        success.value = true
        // Show success animation immediately
        nextTick(() => {
          animateSuccess()
          // Close modal after success animation
          setTimeout(() => {
            emit('success', { message: 'Logged in successfully!' })
            // Keep success state true until modal is fully closed
            // This prevents form from showing again
          }, 2000)
        })
      }
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
    // Animate error shake with GSAP
    nextTick(() => {
      animateError()
    })
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = async () => {
  if (!email.value) {
    error.value = 'Please enter your email address'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (resetError) throw resetError
    
    resetEmailSent.value = true
    error.value = ''
  } catch (err) {
    error.value = err.message || 'An error occurred'
    nextTick(() => {
      animateError()
    })
  } finally {
    loading.value = false
  }
}

const showForgotPassword = () => {
  forgotPasswordMode.value = true
  password.value = ''
  error.value = ''
  resetEmailSent.value = false
}

const backToLogin = () => {
  forgotPasswordMode.value = false
  resetEmailSent.value = false
  error.value = ''
}

// GSAP Animation Functions
const animateModalIn = () => {
  if (!modalOverlay.value || !modalContent.value) return
  
  const tl = gsap.timeline()
  
  tl.fromTo(modalOverlay.value, 
    { opacity: 0 },
    { opacity: 1, duration: 0.3, ease: 'power2.out' }
  )
  .fromTo(modalContent.value,
    { 
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    },
    '-=0.2'
  )
  .fromTo(formGroups.value,
    {
      opacity: 0,
      y: 20
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: 'power2.out'
    },
    '-=0.2'
  )
}

const animateModalOut = () => {
  if (!modalContent.value) return
  
  // Ensure success state is maintained during close animation
  const wasSuccess = success.value
  
  gsap.to(modalContent.value, {
    opacity: 0,
    scale: 0.95,
    y: -20,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: () => {
      // Reset success state only after modal is fully closed
      if (wasSuccess) {
        success.value = false
      }
    }
  })
  
  if (modalOverlay.value) {
    gsap.to(modalOverlay.value, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in'
    })
  }
}

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

const resetForm = () => {
  email.value = ''
  password.value = ''
  error.value = ''
  forgotPasswordMode.value = false
  resetEmailSent.value = false
}

const closeModal = () => {
  resetForm()
  success.value = false
  emit('close')
}

// Close modal on escape key
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closeModal()
  }
}

// Manage body scroll and escape key listener when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'
    // Reset success state and forgot password mode when modal opens
    success.value = false
    forgotPasswordMode.value = false
    resetEmailSent.value = false
    // Animate modal in with GSAP
    nextTick(() => {
      animateModalIn()
    })
  } else {
    document.body.style.overflow = ''
    // Don't reset success state here - let animateModalOut handle it
    // This prevents form from showing during close animation
    // Animate modal out with GSAP
    animateModalOut()
  }
})

// Watch for error changes to animate
watch(() => error.value, (newError) => {
  if (newError) {
    nextTick(() => {
      animateError()
    })
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div v-if="isOpen" ref="modalOverlay" class="modal-overlay" @click.self="closeModal">
    <div ref="modalContent" class="modal-content">
      <button class="close-button" @click="closeModal">&times;</button>
      
      <h2>
        <span v-if="forgotPasswordMode && mode === 'login'">Reset Password</span>
        <span v-else>{{ mode === 'login' ? 'Log in' : 'Sign up' }}</span>
      </h2>
      
      <!-- Forgot Password View -->
      <div v-if="forgotPasswordMode && mode === 'login' && !resetEmailSent">
        <form @submit.prevent="handleForgotPassword" class="forgot-password-form">
          <div class="form-group">
            <label for="forgot-email">Email</label>
            <input
              id="forgot-email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              autocomplete="email"
            />
          </div>
          
          <div v-if="error" ref="errorMessage" class="error-message">{{ error }}</div>
          
          <button type="submit" class="submit-button" :disabled="loading">
            <span v-if="loading" class="button-content">
              <span class="spinner"></span>
              <span>Sending...</span>
            </span>
            <span v-else class="button-content">
              Send Reset Link
            </span>
          </button>
          
          <button type="button" class="back-button" @click="backToLogin">
            Back to Log in
          </button>
        </form>
      </div>
      
      <!-- Reset Email Sent Success View -->
      <div v-else-if="forgotPasswordMode && mode === 'login' && resetEmailSent" class="reset-success">
        <div class="success-icon">✓</div>
        <h3>Check Your Email</h3>
        <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
        <p class="helper-text">Please check your inbox and follow the instructions to reset your password.</p>
        <button type="button" class="back-button" @click="backToLogin">
          Back to Log in
        </button>
      </div>
      
      <!-- Regular Login/Signup View -->
      <form v-else @submit.prevent="handleSubmit">
        <div v-show="!(success && mode === 'login')" ref="formWrapper">
          <div ref="el => formGroups[0] = el" class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              autocomplete="email"
            />
          </div>
          
          <div ref="el => formGroups[1] = el" class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
            <a v-if="mode === 'login'" href="#" class="forgot-password-link" @click.prevent="showForgotPassword">
              Forgot password?
            </a>
          </div>
          
          <div v-if="error" ref="errorMessage" class="error-message">{{ error }}</div>
        </div>
        
        <div v-if="success && mode === 'login'" ref="successAnimation" class="success-animation">
          <div class="checkmark">
            <svg class="checkmark-svg" viewBox="0 0 52 52">
              <circle ref="checkmarkCircle" class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path ref="checkmarkCheck" class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <p ref="successText" class="success-text">Welcome back!</p>
        </div>
        
        <button v-show="!(success && mode === 'login')" type="submit" class="submit-button" :disabled="loading || success">
          <span v-if="loading" class="button-content">
            <span class="spinner"></span>
            <span>Logging in...</span>
          </span>
          <span v-else class="button-content">
            {{ mode === 'login' ? 'Log in' : 'Sign up' }}
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  /* GSAP will handle animation */
}

.modal-content {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: visible;
  /* GSAP will handle animation */
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #000;
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #000;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

/* Form group animations handled by GSAP */

.form-wrapper-hidden {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 6px;
  font-size: 0.9rem;
}

.submit-button {
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

.submit-button:hover:not(:disabled) {
  background-color: #333;
}

.submit-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
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
  /* GSAP will handle animation */
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
  /* GSAP will handle animation */
}

.checkmark-check {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  transform-origin: 26px 26px;
  /* GSAP will handle animation */
}

.success-text {
  color: #4caf50;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  /* GSAP will handle animation */
}

/* Error message shake animation handled by GSAP */

.forgot-password-link {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  text-decoration: none;
  text-align: right;
  transition: color 0.2s;
}

.forgot-password-link:hover {
  color: #000;
  text-decoration: underline;
}

.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.back-button {
  width: 100%;
  padding: 0.75rem;
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.back-button:hover {
  background-color: #f5f5f5;
  border-color: #000;
  color: #000;
}

.reset-success {
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
  background-color: #4caf50;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
}

.reset-success h3 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #000;
  font-weight: 600;
}

.reset-success p {
  margin: 0.5rem 0;
  color: #333;
  line-height: 1.6;
}

.reset-success p strong {
  color: #000;
  font-weight: 600;
}

.helper-text {
  color: #666;
  font-size: 0.9rem;
  margin-top: 1rem;
}
</style>

