<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const route = useRoute()

const dish = ref(null)
const loading = ref(false)
const error = ref('')
const isLiked = ref(false)
const liking = ref(false)
const user = ref(null)
const likeButtonRef = ref(null)
const likeIconRef = ref(null)

const recipeNumber = parseInt(route.params.recipeNumber)

onMounted(async () => {
  await checkUser()
  await fetchDishDetails()
  if (user.value) {
    checkLikeStatus()
  }
})

const checkUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
}

const fetchDishDetails = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const { data, error: fetchError } = await supabase.rpc('get_dish_by_recipe_number', {
      p_recipe_number: recipeNumber
    })
    
    if (fetchError) throw fetchError
    
    if (data && data.length > 0) {
      dish.value = data[0]
    } else {
      error.value = 'Dish not found'
    }
  } catch (err) {
    console.error('Error fetching dish details:', err)
    error.value = err.message || 'Failed to fetch dish details. Please try again.'
  } finally {
    loading.value = false
  }
}

const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A'
  return `$${(price / 100).toFixed(2)}`
}

const formatIngredients = (ingredients) => {
  if (!ingredients) return ''
  
  // Decode HTML entities
  let decoded = ingredients
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = decoded
  
  // Find and format sub-ingredients
  const subIngredientSpans = tempDiv.querySelectorAll('.sub-ingredients, span.sub-ingredients')
  
  subIngredientSpans.forEach(span => {
    // Keep the span but ensure it's styled properly
    span.className = 'sub-ingredients'
  })
  
  // Get the final HTML
  let formatted = tempDiv.innerHTML
  
  // Format allergen mentions with styling
  formatted = formatted.replace(/\/allergen:\s*(\w+)/gi, '<span class="allergen-marker">/allergen: $1</span>')
  
  // Clean up extra whitespace but preserve structure
  formatted = formatted.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ')
  
  return formatted
}

const checkLikeStatus = async () => {
  if (!user.value || !recipeNumber) return
  
  try {
    const { data, error } = await supabase
      .from('dish_likes')
      .select('*')
      .eq('user_id', user.value.id)
      .eq('recipe_number', recipeNumber)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }
    
    isLiked.value = !!data
  } catch (err) {
    console.error('Error checking like status:', err)
  }
}

const toggleLike = async () => {
  if (!user.value) {
    // Redirect to login if not authenticated
    router.push('/?login=true')
    return
  }
  
  liking.value = true
  
  // Animate the like button immediately
  await nextTick()
  animateLikeToggle(!isLiked.value)
  
  try {
    if (isLiked.value) {
      // Remove like
      const { error } = await supabase.rpc('remove_like', {
        p_recipe_number: recipeNumber
      })
      
      if (error) throw error
      
      isLiked.value = false
    } else {
      // Add like
      const { error } = await supabase.rpc('add_like', {
        p_recipe_number: recipeNumber
      })
      
      if (error) throw error
      
      isLiked.value = true
    }
  } catch (err) {
    console.error('Error toggling like:', err)
    if (err.message?.includes('Not authenticated')) {
      router.push('/?login=true')
    }
  } finally {
    liking.value = false
  }
}

const animateLikeToggle = (liking) => {
  if (!likeButtonRef.value || !likeIconRef.value) return
  
  const tl = gsap.timeline()
  
  if (liking) {
    // Adding like - burst animation
    tl.to(likeButtonRef.value, {
      scale: 1.1,
      rotation: -5,
      duration: 0.15,
      ease: 'power2.out'
    })
    .to(likeIconRef.value, {
      scale: 1.5,
      rotation: -15,
      duration: 0.2,
      ease: 'back.out(2)'
    })
    .to(likeIconRef.value, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)'
    })
    .to(likeButtonRef.value, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)'
    }, '-=0.3')
    
    // Create burst particles
    createBurstParticles(likeIconRef.value)
  } else {
    // Removing like - shrink animation
    tl.to(likeIconRef.value, {
      scale: 0.8,
      rotation: 15,
      duration: 0.2,
      ease: 'power2.in'
    })
    .to(likeButtonRef.value, {
      scale: 0.95,
      rotation: 5,
      duration: 0.2,
      ease: 'power2.in'
    }, '-=0.2')
    .to(likeIconRef.value, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'power2.out'
    })
    .to(likeButtonRef.value, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.3')
  }
}

const createBurstParticles = (element) => {
  if (!element) return
  
  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  // Create 8 particles
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div')
    particle.className = 'like-particle'
    particle.style.cssText = `
      position: fixed;
      width: 6px;
      height: 6px;
      background: #d32f2f;
      border-radius: 50%;
      left: ${centerX}px;
      top: ${centerY}px;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(particle)
    
    const angle = (i * 360) / 8
    const distance = 40 + Math.random() * 20
    const radians = (angle * Math.PI) / 180
    
    gsap.to(particle, {
      x: Math.cos(radians) * distance,
      y: Math.sin(radians) * distance,
      opacity: 0,
      scale: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        document.body.removeChild(particle)
      }
    })
  }
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="dish-detail-page">
      <nav class="navbar">
        <div class="navbar-left">
          <img src="/AppIcon.png" alt="Logo" class="logo" @click="router.push('/')" style="cursor: pointer;" />
          <router-link to="/browse" class="nav-link">Browse Dining Halls</router-link>
        </div>
        <div class="nav-buttons">
          <button class="back-nav-button" @click="goBack">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back</span>
          </button>
        </div>
      </nav>
    
    <main class="dish-detail-content">
      <div v-if="loading" class="loading-container">
        <p>Loading dish details...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button class="back-button" @click="goBack">Go Back</button>
      </div>
      
      <div v-else-if="dish" class="dish-detail-container">
        <div class="dish-header">
          <div class="dish-title-section">
            <h1>{{ dish.recipe_print_as_name || dish.recipe_name || 'Dish Details' }}</h1>
            <button 
              ref="likeButtonRef"
              class="like-button" 
              :class="{ liked: isLiked, 'not-liked': !isLiked }"
              @click="toggleLike"
              :disabled="liking"
              :title="isLiked ? 'Remove like' : 'Add like'"
            >
              <svg 
                ref="likeIconRef"
                class="like-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span v-if="liking" class="like-text">...</span>
              <span v-else class="like-text">{{ isLiked ? 'Liked' : 'Like' }}</span>
            </button>
          </div>
          <div v-if="dish.selling_price" class="dish-price">
            {{ formatPrice(dish.selling_price) }}
          </div>
        </div>
        
        <div v-if="dish.allergens" class="detail-section">
          <h2>Allergens</h2>
          <p class="allergens">{{ dish.allergens }}</p>
        </div>
        
        <div v-if="dish.ingredient_list" class="detail-section">
          <h2>Ingredients</h2>
          <div class="ingredients-content" v-html="formatIngredients(dish.ingredient_list)"></div>
        </div>
        
        <div class="detail-section">
          <h2>Nutrition Information</h2>
          <div class="nutrition-grid">
            <div v-if="dish.calories !== null && dish.calories !== undefined" class="nutrition-item">
              <span class="nutrition-label">Calories:</span>
              <span class="nutrition-value">{{ dish.calories }}</span>
            </div>
            
            <div v-if="dish.serving_size" class="nutrition-item">
              <span class="nutrition-label">Serving Size:</span>
              <span class="nutrition-value">{{ dish.serving_size }}</span>
            </div>
            
            <div v-if="dish.servings_per_container !== null && dish.servings_per_container !== undefined" class="nutrition-item">
              <span class="nutrition-label">Servings Per Container:</span>
              <span class="nutrition-value">{{ dish.servings_per_container }}</span>
            </div>
            
            <div v-if="dish.total_fat_g !== null && dish.total_fat_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Total Fat:</span>
              <span class="nutrition-value">{{ dish.total_fat_g }}g</span>
            </div>
            
            <div v-if="dish.sat_fat_g !== null && dish.sat_fat_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Saturated Fat:</span>
              <span class="nutrition-value">{{ dish.sat_fat_g }}g</span>
            </div>
            
            <div v-if="dish.trans_fat_g !== null && dish.trans_fat_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Trans Fat:</span>
              <span class="nutrition-value">{{ dish.trans_fat_g }}g</span>
            </div>
            
            <div v-if="dish.cholesterol_mg !== null && dish.cholesterol_mg !== undefined" class="nutrition-item">
              <span class="nutrition-label">Cholesterol:</span>
              <span class="nutrition-value">{{ dish.cholesterol_mg }}mg</span>
            </div>
            
            <div v-if="dish.sodium_mg !== null && dish.sodium_mg !== undefined" class="nutrition-item">
              <span class="nutrition-label">Sodium:</span>
              <span class="nutrition-value">{{ dish.sodium_mg }}mg</span>
            </div>
            
            <div v-if="dish.total_carb_g !== null && dish.total_carb_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Total Carbohydrates:</span>
              <span class="nutrition-value">{{ dish.total_carb_g }}g</span>
            </div>
            
            <div v-if="dish.sugars_g !== null && dish.sugars_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Sugars:</span>
              <span class="nutrition-value">{{ dish.sugars_g }}g</span>
            </div>
            
            <div v-if="dish.added_sugar_g !== null && dish.added_sugar_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Added Sugar:</span>
              <span class="nutrition-value">{{ dish.added_sugar_g }}g</span>
            </div>
            
            <div v-if="dish.protein_g !== null && dish.protein_g !== undefined" class="nutrition-item">
              <span class="nutrition-label">Protein:</span>
              <span class="nutrition-value">{{ dish.protein_g }}g</span>
            </div>
            
            <div v-if="dish.vitamin_d_mcg !== null && dish.vitamin_d_mcg !== undefined" class="nutrition-item">
              <span class="nutrition-label">Vitamin D:</span>
              <span class="nutrition-value">{{ dish.vitamin_d_mcg }}mcg</span>
            </div>
            
            <div v-if="dish.calcium_mg !== null && dish.calcium_mg !== undefined" class="nutrition-item">
              <span class="nutrition-label">Calcium:</span>
              <span class="nutrition-value">{{ dish.calcium_mg }}mg</span>
            </div>
            
            <div v-if="dish.iron_mg !== null && dish.iron_mg !== undefined" class="nutrition-item">
              <span class="nutrition-label">Iron:</span>
              <span class="nutrition-value">{{ dish.iron_mg }}mg</span>
            </div>
            
            <div v-if="dish.potassium_mg !== null && dish.potassium_mg !== undefined" class="nutrition-item">
              <span class="nutrition-label">Potassium:</span>
              <span class="nutrition-value">{{ dish.potassium_mg }}mg</span>
            </div>
            
            <div v-if="dish.vitamin_a !== null && dish.vitamin_a !== undefined" class="nutrition-item">
              <span class="nutrition-label">Vitamin A:</span>
              <span class="nutrition-value">{{ dish.vitamin_a }}</span>
            </div>
            
            <div v-if="dish.vitamin_c !== null && dish.vitamin_c !== undefined" class="nutrition-item">
              <span class="nutrition-label">Vitamin C:</span>
              <span class="nutrition-value">{{ dish.vitamin_c }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="dish.recipe_web_codes" class="detail-section">
          <h2>Recipe Web Codes</h2>
          <p>{{ dish.recipe_web_codes }}</p>
        </div>
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

.dish-detail-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.dish-detail-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 3rem;
}

.error-message {
  color: #d32f2f;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.dish-detail-container {
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 2.5rem;
  margin-top: 2rem;
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #000;
}

.dish-title-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.dish-header h1 {
  font-size: 2rem;
  margin: 0;
  color: #000;
  font-weight: 600;
  flex: 1;
}

.dish-price {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4caf50;
  margin-left: 2rem;
}

.like-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  color: #666;
  font-family: "SubVario OT W03 Medium", sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.like-button:hover:not(:disabled) {
  border-color: #000;
  background-color: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.like-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.like-button.liked {
  background-color: #ffebee;
  border-color: #d32f2f;
  color: #d32f2f;
}

.like-button.liked:hover:not(:disabled) {
  background-color: #ffcdd2;
  border-color: #c62828;
  color: #c62828;
}

.like-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  fill: currentColor;
  transition: all 0.3s ease;
}

.like-button.liked .like-icon {
  fill: #d32f2f;
  stroke: #d32f2f;
  animation: heartBeat 0.5s ease;
}

.like-button:not(.liked) .like-icon {
  fill: none;
}

@keyframes heartBeat {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(0.95);
  }
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h2 {
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: #000;
  font-weight: 600;
  font-family: "SubVario OT W03 Medium", sans-serif;
}

.detail-section p {
  color: #333;
  line-height: 1.6;
  font-size: 1rem;
}

.ingredients-content {
  color: #333;
  line-height: 1.8;
  font-size: 1rem;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.ingredients-content :deep(.sub-ingredients) {
  font-size: 0.9em;
  color: #666;
  font-style: italic;
  display: block;
  margin-top: 0.75rem;
  padding-left: 1.5rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-left: 3px solid #ddd;
  margin-bottom: 0.75rem;
  background-color: #fafafa;
  border-radius: 4px;
}

.ingredients-content :deep(.allergen-marker) {
  font-weight: 600;
  color: #d32f2f;
}

.allergens {
  color: #d32f2f;
  font-weight: 500;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.nutrition-label {
  font-weight: 500;
  color: #666;
}

.nutrition-value {
  font-weight: 600;
  color: #000;
}

.back-nav-button {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  font-family: "SubVario OT W03 Medium", sans-serif !important;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.back-nav-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.back-nav-button:hover::before {
  width: 300px;
  height: 300px;
}

.back-nav-button:hover {
  background-color: #333;
  transform: translateX(-4px);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.3);
}

.back-nav-button:active {
  transform: translateX(-2px);
}

.back-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  transition: transform 0.3s ease;
}

.back-nav-button:hover .back-icon {
  transform: translateX(-4px);
}

.back-nav-button span {
  position: relative;
  z-index: 1;
  letter-spacing: 0.5px;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background-color: #000;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  font-family: "SubVario OT W03 Medium", sans-serif;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #333;
}

@media (max-width: 768px) {
  .dish-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .dish-price {
    margin-left: 0;
  }
  
  .nutrition-grid {
    grid-template-columns: 1fr;
  }
  
  .dish-detail-container {
    padding: 1.5rem;
  }
}
</style>
