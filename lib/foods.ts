import type { Food } from "./types";

/**
 * Static catalog of common foods. Values are approximate, per the listed
 * serving size. This is intentionally a code constant (not in the DB) so the
 * catalog can be version-controlled and edited easily.
 */
export const FOODS: Food[] = [
  { id: "chicken-breast", name: "Chicken Breast", servingSize: "100 g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "white-rice", name: "White Rice (cooked)", servingSize: "1 cup", calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { id: "egg", name: "Egg", servingSize: "1 large", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { id: "banana", name: "Banana", servingSize: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: "oats", name: "Oats (dry)", servingSize: "1/2 cup", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { id: "milk", name: "Milk (2%)", servingSize: "1 cup", calories: 122, protein: 8, carbs: 12, fat: 4.8 },
  { id: "apple", name: "Apple", servingSize: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: "bread", name: "Whole Wheat Bread", servingSize: "1 slice", calories: 81, protein: 4, carbs: 14, fat: 1.1 },
  { id: "salmon", name: "Salmon", servingSize: "100 g", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "broccoli", name: "Broccoli", servingSize: "1 cup", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { id: "almonds", name: "Almonds", servingSize: "1 oz (28 g)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: "greek-yogurt", name: "Greek Yogurt (plain)", servingSize: "170 g", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { id: "ground-beef", name: "Ground Beef (85% lean)", servingSize: "100 g", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { id: "potato", name: "Potato (baked)", servingSize: "1 medium", calories: 161, protein: 4.3, carbs: 37, fat: 0.2 },
  { id: "pasta", name: "Pasta (cooked)", servingSize: "1 cup", calories: 221, protein: 8.1, carbs: 43, fat: 1.3 },
  { id: "peanut-butter", name: "Peanut Butter", servingSize: "2 tbsp", calories: 188, protein: 8, carbs: 6, fat: 16 },
  { id: "cheddar-cheese", name: "Cheddar Cheese", servingSize: "1 oz (28 g)", calories: 113, protein: 7, carbs: 0.4, fat: 9 },
  { id: "orange", name: "Orange", servingSize: "1 medium", calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { id: "avocado", name: "Avocado", servingSize: "1/2 fruit", calories: 120, protein: 1.5, carbs: 6, fat: 11 },
  { id: "tuna", name: "Tuna (canned in water)", servingSize: "100 g", calories: 116, protein: 26, carbs: 0, fat: 0.8 },
  { id: "sweet-potato", name: "Sweet Potato (baked)", servingSize: "1 medium", calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { id: "black-beans", name: "Black Beans (cooked)", servingSize: "1/2 cup", calories: 114, protein: 7.6, carbs: 20, fat: 0.5 },
  { id: "quinoa", name: "Quinoa (cooked)", servingSize: "1 cup", calories: 222, protein: 8, carbs: 39, fat: 3.6 },
  { id: "spinach", name: "Spinach (raw)", servingSize: "1 cup", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1 },
  { id: "coffee", name: "Coffee (black)", servingSize: "1 cup", calories: 2, protein: 0.3, carbs: 0, fat: 0 },
];
