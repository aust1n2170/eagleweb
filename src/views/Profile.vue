<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import AuthModal from '../components/AuthModal.vue'

const router = useRouter()
const user = ref(null)
const authModalOpen = ref(false)
const firstName = ref('')
const lastName = ref('')
const loading = ref(false)
const saving = ref(false)
const saveMessage = ref('')
const copySuccess = ref(false)
const copyButtonRef = ref(null)
const copyCheckRef = ref(null)


onMounted(() => {
  checkUser()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
    if (!user.value) {
      // Redirect to home if not logged in
      router.push('/')
    } else {
      loadProfile()
    }
  })
})

const checkUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
  if (!user.value) {
    authModalOpen.value = true
  } else {
    loadProfile()
  }
}

const loadProfile = async () => {
  if (!user.value) return
  
  loading.value = true
  try {
    // Try to get from user metadata first
    if (user.value.user_metadata?.first_name) {
      firstName.value = user.value.user_metadata.first_name
    }
    if (user.value.user_metadata?.last_name) {
      lastName.value = user.value.user_metadata.last_name
    }
    
    // Alternatively, you could fetch from a profiles table:
    // const { data, error } = await supabase
    //   .from('profiles')
    //   .select('first_name, last_name')
    //   .eq('id', user.value.id)
    //   .single()
    
    // if (data && !error) {
    //   firstName.value = data.first_name || ''
    //   lastName.value = data.last_name || ''
    // }
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  if (!user.value) return
  
  saving.value = true
  saveMessage.value = ''
  
  try {
    // Update user metadata
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.value || null,
        last_name: lastName.value || null
      }
    })
    
    if (error) throw error
    
    // Update local user object
    if (data.user) {
      user.value = data.user
    }
    
    saveMessage.value = 'Profile saved successfully!'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error saving profile:', error)
    saveMessage.value = 'Error saving profile. Please try again.'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } finally {
    saving.value = false
  }
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  } else {
    router.push('/')
  }
}

const copyUserId = async () => {
  if (!user.value?.id) return
  
  try {
    await navigator.clipboard.writeText(user.value.id)
    copySuccess.value = true
    
    // Animate success
    nextTick(() => {
      animateCopySuccess()
    })
    
    // Reset after animation
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const animateCopySuccess = () => {
  if (!copyButtonRef.value || !copyCheckRef.value) return
  
  const tl = gsap.timeline()
  
  // Animate checkmark appearance
  tl.fromTo(copyCheckRef.value,
    {
      scale: 0,
      rotation: -180,
      opacity: 0
    },
    {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    }
  )
  
  // Slight bounce effect
  .to(copyCheckRef.value,
    {
      scale: 1.2,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    },
    '-=0.2'
  )
}
</script>

<template>
  <div class="profile-page">
    <nav class="navbar">
      <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
      <div class="nav-buttons">
        <div v-if="user" class="user-info">
          <router-link to="/profile" class="user-email">{{ user.email }}</router-link>
          <button class="nav-button logout" @click="handleLogout">Log out</button>
        </div>
      </div>
    </nav>
    
    <main class="profile-content">
      <div v-if="user && !loading" class="profile-container">
        <h1>Profile</h1>
        
        <div class="profile-section">
          <h2>Account Information</h2>
          <div class="profile-info">
            <div class="info-item">
              <label>Email:</label>
              <span>{{ user.email }}</span>
            </div>
            <div class="info-item">
              <label>User ID:</label>
              <div class="user-id-container">
                <span class="user-id">{{ user.id }}</span>
                <button 
                  ref="copyButtonRef"
                  class="copy-button" 
                  @click="copyUserId"
                  :class="{ 'copy-success': copySuccess }"
                  title="Copy to clipboard"
                >
                  <svg v-if="!copySuccess" class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else ref="copyCheckRef" class="copy-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <router-link to="/change-password" class="change-password-link">
            Change Password
          </router-link>
        </div>
        
        <div class="profile-section">
          <h2>Personal Information</h2>
          <form @submit.prevent="saveProfile" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name (Optional)</label>
                <input
                  id="firstName"
                  v-model="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  class="profile-input"
                />
              </div>
              
              <div class="form-group">
                <label for="lastName">Last Name (Optional)</label>
                <input
                  id="lastName"
                  v-model="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  class="profile-input"
                />
              </div>
            </div>
            
            <div v-if="saveMessage" class="save-message" :class="{ error: saveMessage.includes('Error') }">
              {{ saveMessage }}
            </div>
            
            <button type="submit" class="save-button" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </form>
        </div>
      </div>
      
      <div v-if="loading" class="loading-container">
        <p>Loading profile...</p>
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
.profile-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.profile-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-container {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
}

.profile-container h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #000;
}

.profile-section {
  margin-bottom: 2.5rem;
}

.profile-section:last-child {
  margin-bottom: 0;
}

.profile-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  color: #000;
  font-weight: 600;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.info-item span {
  color: #000;
  font-size: 1.1rem;
}

.user-id-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-id {
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
  flex: 1;
  min-width: 0;
}

.copy-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.copy-button:hover {
  background-color: #f5f5f5;
  border-color: #000;
}

.copy-button.copy-success {
  background-color: #4caf50;
  border-color: #4caf50;
}

.copy-icon,
.copy-check {
  width: 18px;
  height: 18px;
  stroke: #666;
  transition: stroke 0.2s;
}

.copy-button:hover .copy-icon {
  stroke: #000;
}

.copy-button.copy-success .copy-check {
  stroke: #fff;
}

.copy-button:active {
  transform: scale(0.95);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
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

.profile-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.profile-input:focus {
  outline: none;
  border-color: #000;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
}

.save-button {
  padding: 0.75rem 2rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  align-self: flex-start;
}

.save-button:hover:not(:disabled) {
  background-color: #333;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-message {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: #4caf50;
  color: #ffffff;
}

.save-message.error {
  background-color: #d32f2f;
}

.loading-container {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.change-password-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #000;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.change-password-link:hover {
  background-color: #333;
}
</style>

