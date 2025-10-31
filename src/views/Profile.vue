<script setup>
import { ref, onMounted, computed } from 'vue'
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

onMounted(() => {
  checkUser()
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (_event, session) => {
    user.value = session?.user ?? null
    if (!user.value) {
      // Redirect to home if not logged in
      router.push('/')
    } else {
      // Refresh user data to get latest metadata
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        user.value = data.user
      }
      loadProfile()
    }
  })
})

// Computed property to get display name
const displayName = computed(() => {
  if (!user.value) return ''
  
  const firstName = user.value.user_metadata?.first_name
  const lastName = user.value.user_metadata?.last_name
  
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  } else {
    return user.value.email || ''
  }
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
      // Update form fields with saved values
      firstName.value = data.user.user_metadata?.first_name || ''
      lastName.value = data.user.user_metadata?.last_name || ''
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
</script>

<template>
  <div class="profile-page">
    <nav class="navbar">
      <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
      <div class="nav-buttons">
        <div v-if="user" class="user-info">
          <router-link to="/profile" class="user-email">{{ displayName }}</router-link>
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
              <span class="user-id">{{ user.id }}</span>
            </div>
          </div>
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

.user-id {
  font-family: monospace;
  font-size: 0.9rem;
  word-break: break-all;
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
</style>

