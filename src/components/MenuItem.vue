<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
})

const getItemName = (item) => {
  return item.recipe_print_as_name || item.recipe_name || 'Menu Item'
}
</script>

<template>
  <div class="menu-item">
    <div class="item-name">
      {{ getItemName(item) }}
    </div>
    <div v-if="item.allergens" class="item-allergens">
      Allergens: {{ item.allergens }}
    </div>
    <div class="item-nutrition">
      <span v-if="item.calories !== null && item.calories !== undefined">
        {{ item.calories }} cal
      </span>
      <span v-if="item.total_carb_g !== null && item.total_carb_g !== undefined" class="nutrition-sep">
        • {{ item.total_carb_g }}g carbs
      </span>
      <span v-if="item.protein_g !== null && item.protein_g !== undefined" class="nutrition-sep">
        • {{ item.protein_g }}g protein
      </span>
    </div>
    <div v-if="item.selling_price !== null && item.selling_price !== undefined" class="item-price">
      ${{ (item.selling_price / 100).toFixed(2) }}
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.menu-item:hover {
  border-color: #000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
}

.item-allergens {
  font-size: 0.85rem;
  color: #d32f2f;
  font-weight: 500;
}

.item-nutrition {
  font-size: 0.9rem;
  color: #666;
}

.nutrition-sep {
  margin-left: 0.5rem;
}

.item-price {
  font-size: 1rem;
  font-weight: 600;
  color: #000;
  margin-top: 0.25rem;
}
</style>
