<script setup>
import { computed } from 'vue'
import MenuControls from './MenuControls.vue'
import MenuCategory from './MenuCategory.vue'

const props = defineProps({
  hallName: {
    type: String,
    required: true
  },
  selectedDate: {
    type: String,
    required: true
  },
  selectedMeal: {
    type: String,
    required: true
  },
  meals: {
    type: Array,
    required: true
  },
  menuItems: {
    type: Array,
    default: () => []
  },
  loadingMenu: {
    type: Boolean,
    default: false
  },
  menuError: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['back', 'update:selectedDate', 'update:selectedMeal', 'dateChange', 'mealChange'])

const localSelectedDate = computed({
  get: () => props.selectedDate,
  set: (value) => emit('update:selectedDate', value)
})

const localSelectedMeal = computed({
  get: () => props.selectedMeal,
  set: (value) => emit('update:selectedMeal', value)
})

// Group menu items by category
const groupedMenuItems = computed(() => {
  if (!props.menuItems || props.menuItems.length === 0) return {}
  
  const grouped = {}
  props.menuItems.forEach(item => {
    const category = item.menu_category_name || 'Other'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(item)
  })
  return grouped
})
</script>

<template>
  <div class="menu-section">
    <div class="menu-header">
      <button class="back-button" @click="emit('back')">← Back</button>
      <h1>{{ hallName }}</h1>
    </div>
    
    <MenuControls
      v-model:selected-date="localSelectedDate"
      v-model:selected-meal="localSelectedMeal"
      :meals="meals"
      @date-change="emit('dateChange', $event)"
      @meal-change="emit('mealChange', $event)"
    />
    
    <div class="menu-content">
      <div v-if="loadingMenu" class="loading-message">
        Loading menu...
      </div>
      
      <div v-else-if="menuError" class="error-message">
        {{ menuError }}
      </div>
      
      <div v-else-if="menuItems.length === 0" class="empty-message">
        No menu items available
      </div>
      
      <div v-else class="menu-items">
        <MenuCategory
          v-for="(items, category) in groupedMenuItems"
          :key="category"
          :category="category"
          :items="items"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-section {
  margin-top: 2rem;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.menu-header h1 {
  font-size: 2rem;
  margin: 0;
  color: #000;
  font-weight: 600;
}

.back-button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  color: #000;
  transition: all 0.2s ease;
}

.back-button:hover {
  background-color: #000;
  color: #fff;
  border-color: #000;
}

.menu-content {
  margin-top: 1rem;
}

.loading-message,
.error-message,
.empty-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error-message {
  color: #d32f2f;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
