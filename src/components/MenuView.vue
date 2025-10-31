<script setup>
import { ref, computed } from 'vue'
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

const sortBy = ref('price')
const sortDirection = ref('desc') // 'asc' or 'desc'

const localSelectedDate = computed({
  get: () => props.selectedDate,
  set: (value) => emit('update:selectedDate', value)
})

const localSelectedMeal = computed({
  get: () => props.selectedMeal,
  set: (value) => emit('update:selectedMeal', value)
})

// Sort function
const sortItems = (items) => {
  const sorted = [...items]
  const isDesc = sortDirection.value === 'desc'
  
  switch (sortBy.value) {
    case 'price':
      sorted.sort((a, b) => {
        const priceA = a.selling_price || 0
        const priceB = b.selling_price || 0
        return isDesc ? priceB - priceA : priceA - priceB
      })
      break
    case 'protein-calorie-ratio': {
      sorted.sort((a, b) => {
        const proteinA = a.protein_g || 0
        const caloriesA = a.calories || 1
        const proteinB = b.protein_g || 0
        const caloriesB = b.calories || 1
        const ratioA = proteinA / caloriesA
        const ratioB = proteinB / caloriesB
        return isDesc ? ratioB - ratioA : ratioA - ratioB
      })
      break
    }
    case 'protein':
      sorted.sort((a, b) => {
        const proteinA = a.protein_g || 0
        const proteinB = b.protein_g || 0
        return isDesc ? proteinB - proteinA : proteinA - proteinB
      })
      break
    case 'calories':
      sorted.sort((a, b) => {
        const calA = a.calories || 0
        const calB = b.calories || 0
        return isDesc ? calB - calA : calA - calB
      })
      break
    default:
      break
  }
  
  return sorted
}

// Group menu items by category, sort within each category, and sort categories
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
  
  // Sort items within each category
  Object.keys(grouped).forEach(category => {
    grouped[category] = sortItems(grouped[category])
  })
  
  // Sort categories based on the selected sort option
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const itemsA = grouped[a]
    const itemsB = grouped[b]
    
    if (itemsA.length === 0 && itemsB.length === 0) return 0
    if (itemsA.length === 0) return 1
    if (itemsB.length === 0) return -1
    
    const isDesc = sortDirection.value === 'desc'
    
    switch (sortBy.value) {
      case 'price': {
        const getValue = (items, desc) => {
          if (desc) {
            return Math.max(...items.map(item => item.selling_price || -Infinity))
          } else {
            return Math.min(...items.map(item => item.selling_price || Infinity))
          }
        }
        const valueA = getValue(itemsA, isDesc)
        const valueB = getValue(itemsB, isDesc)
        return isDesc ? valueB - valueA : valueA - valueB
      }
      case 'protein-calorie-ratio': {
        const getRatio = (items, desc) => {
          if (items.length === 0) return desc ? -Infinity : Infinity
          const ratios = items.map(item => {
            const protein = item.protein_g || 0
            const calories = item.calories || 1
            return protein / calories
          })
          return desc ? Math.max(...ratios) : Math.min(...ratios)
        }
        const ratioA = getRatio(itemsA, isDesc)
        const ratioB = getRatio(itemsB, isDesc)
        return isDesc ? ratioB - ratioA : ratioA - ratioB
      }
      case 'protein': {
        const getValue = (items, desc) => {
          if (desc) {
            return Math.max(...items.map(item => item.protein_g || -Infinity))
          } else {
            return Math.min(...items.map(item => item.protein_g || Infinity))
          }
        }
        const valueA = getValue(itemsA, isDesc)
        const valueB = getValue(itemsB, isDesc)
        return isDesc ? valueB - valueA : valueA - valueB
      }
      case 'calories': {
        const getValue = (items, desc) => {
          if (desc) {
            return Math.max(...items.map(item => item.calories || -Infinity))
          } else {
            return Math.min(...items.map(item => item.calories || Infinity))
          }
        }
        const valueA = getValue(itemsA, isDesc)
        const valueB = getValue(itemsB, isDesc)
        return isDesc ? valueB - valueA : valueA - valueB
      }
      default:
        return a.localeCompare(b)
    }
  })
  
  // Create new object with sorted categories
  const sortedGrouped = {}
  sortedCategories.forEach(category => {
    sortedGrouped[category] = grouped[category]
  })
  
  return sortedGrouped
})

const handleSortToggle = (sortValue) => {
  if (sortBy.value === sortValue) {
    // Toggle direction if same option clicked
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Switch to new option, default to descending
    sortBy.value = sortValue
    sortDirection.value = 'desc'
  }
}
</script>

<template>
  <div class="menu-section">
    <div class="menu-header">
      <button class="back-button" @click="emit('back')">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back</span>
      </button>
      <h1>{{ hallName }}</h1>
    </div>
    
    <MenuControls
      v-model:selected-date="localSelectedDate"
      v-model:selected-meal="localSelectedMeal"
      :meals="meals"
      :sort-by="sortBy"
      :sort-direction="sortDirection"
      @date-change="emit('dateChange', $event)"
      @meal-change="emit('mealChange', $event)"
      @sort-toggle="handleSortToggle"
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  font-family: "SubVario OT W03 Medium", sans-serif;
  color: #000;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.back-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.back-button:hover::before {
  width: 300px;
  height: 300px;
}

.back-button:hover {
  background-color: #000;
  color: #fff;
  border-color: #000;
  transform: translateX(-4px);
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.3);
}

.back-button:active {
  transform: translateX(-2px);
}

.back-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  transition: transform 0.3s ease;
}

.back-button:hover .back-icon {
  transform: translateX(-4px);
}

.back-button span {
  position: relative;
  z-index: 1;
  letter-spacing: 0.5px;
}

.menu-content {
  margin-top: 1rem;
  position: relative;
  overflow: visible;
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
  position: relative;
  overflow: visible;
}
</style>
