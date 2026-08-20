import {
  POSDepartmentMapping,
  DepartmentLiveEfficiencyMetric,
  Department,
  POSPlatformId,
  Shift,
  Employee
} from '../types';

export const INITIAL_POS_DEPARTMENT_MAPPINGS: Record<POSPlatformId, POSDepartmentMapping> = {
  toast: {
    posPlatformId: 'toast',
    posPlatformName: 'Toast Restaurant POS',
    locationId: 'TOAST_LOC_SF_DOWNTOWN_01',
    locationName: 'Bistro Moderno - Main Downtown (Toast Cloud v2)',
    presetTemplate: 'bistro_full_service',
    lastUpdated: 'Live Streaming (Real-time Webhook)',
    autoSyncEnabled: true,
    revenueCenterMappings: [
      { id: 'rc-t-1', posRevenueCenter: 'Main Dining Room (Tables 1-28)', department: 'Front of House', salesAllocationPct: 100, description: 'Primary dining floor and banquette seating', active: true },
      { id: 'rc-t-2', posRevenueCenter: 'Outdoor Patio & Garden (Tables 31-44)', department: 'Front of House', salesAllocationPct: 100, description: 'Covered heated outdoor dining section', active: true },
      { id: 'rc-t-3', posRevenueCenter: 'Main Cocktail Bar & High Tops', department: 'Bar & Beverage', salesAllocationPct: 100, description: '24-seat marble bar and high-top cocktail lounge', active: true },
      { id: 'rc-t-4', posRevenueCenter: 'Kitchen Takeout & Direct Delivery', department: 'Back of House', salesAllocationPct: 100, description: 'Direct pickup orders and online kitchen fulfillment', active: true },
      { id: 'rc-t-5', posRevenueCenter: 'Private Dining Wine Vault (VIP)', department: 'Management', salesAllocationPct: 100, description: 'Curated 14-seat tasting room events', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-t-101', posJobCode: 'TOAST_101', posJobTitle: 'Floor Server (FOH)', department: 'Front of House', defaultHourlyWage: 18.50, targetLaborPct: 10.0, active: true },
      { id: 'jc-t-102', posJobCode: 'TOAST_102', posJobTitle: 'Head Server / Captain', department: 'Front of House', defaultHourlyWage: 22.00, targetLaborPct: 10.5, active: true },
      { id: 'jc-t-103', posJobCode: 'TOAST_103', posJobTitle: 'Host / Reservation Greeter', department: 'Front of House', defaultHourlyWage: 17.50, targetLaborPct: 8.0, active: true },
      { id: 'jc-t-104', posJobCode: 'TOAST_104', posJobTitle: 'Food Runner & Busser', department: 'Front of House', defaultHourlyWage: 16.50, targetLaborPct: 7.5, active: true },
      { id: 'jc-t-201', posJobCode: 'TOAST_201', posJobTitle: 'Lead Mixologist / Bartender', department: 'Bar & Beverage', defaultHourlyWage: 24.00, targetLaborPct: 4.5, active: true },
      { id: 'jc-t-202', posJobCode: 'TOAST_202', posJobTitle: 'Bartender / Cashier', department: 'Bar & Beverage', defaultHourlyWage: 20.00, targetLaborPct: 4.0, active: true },
      { id: 'jc-t-203', posJobCode: 'TOAST_203', posJobTitle: 'Barback & Ice / Glass Steward', department: 'Bar & Beverage', defaultHourlyWage: 17.50, targetLaborPct: 3.0, active: true },
      { id: 'jc-t-301', posJobCode: 'TOAST_301', posJobTitle: 'Line Cook / Sauté / Grill', department: 'Back of House', defaultHourlyWage: 22.50, targetLaborPct: 11.5, active: true },
      { id: 'jc-t-302', posJobCode: 'TOAST_302', posJobTitle: 'Sous Chef / Expediter', department: 'Back of House', defaultHourlyWage: 28.00, targetLaborPct: 12.0, active: true },
      { id: 'jc-t-401', posJobCode: 'TOAST_401', posJobTitle: 'Prep Cook & Pantry Chef', department: 'Kitchen Prep & Dish', defaultHourlyWage: 18.00, targetLaborPct: 2.5, active: true },
      { id: 'jc-t-402', posJobCode: 'TOAST_402', posJobTitle: 'Steward & Dishwasher', department: 'Kitchen Prep & Dish', defaultHourlyWage: 17.00, targetLaborPct: 2.0, active: true },
      { id: 'jc-t-501', posJobCode: 'TOAST_501', posJobTitle: 'General Manager / Shift Lead', department: 'Management', defaultHourlyWage: 34.00, targetLaborPct: 3.5, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-t-1', posCategory: 'Chef Entrees & Woodfire Mains', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 11.5, active: true },
      { id: 'cat-t-2', posCategory: 'Starters, Salads & Small Plates', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 10.0, active: true },
      { id: 'cat-t-3', posCategory: 'Handcrafted Cocktails & Spirits', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.5, active: true },
      { id: 'cat-t-4', posCategory: 'Craft Draft & Bottled Beers', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 3.5, active: true },
      { id: 'cat-t-5', posCategory: 'Curated Wine List & Bubbles', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.0, active: true },
      { id: 'cat-t-6', posCategory: 'Desserts, Pastries & Specialty Coffee', department: 'Kitchen Prep & Dish', contributionPct: 100, targetLaborRatioPct: 2.5, active: true },
      { id: 'cat-t-7', posCategory: 'Private Room Buyout & Corkage Fees', department: 'Management', contributionPct: 100, targetLaborRatioPct: 3.5, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 10.0, targetSplh: 280, maxOvertimeHours: 4.0, minActiveStaff: 3 },
      'Back of House': { targetLaborPct: 11.5, targetSplh: 210, maxOvertimeHours: 5.0, minActiveStaff: 3 },
      'Bar & Beverage': { targetLaborPct: 4.5, targetSplh: 340, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.5, targetSplh: 480, maxOvertimeHours: 3.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 560, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  square: {
    posPlatformId: 'square',
    posPlatformName: 'Square for Restaurants',
    locationId: 'SQ_LOC_BAYAREA_MAIN',
    locationName: 'Bistro Moderno - Square POS Station',
    presetTemplate: 'high_volume_bar_grill',
    lastUpdated: 'Synced 45s ago (Square Connect REST API)',
    autoSyncEnabled: true,
    revenueCenterMappings: [
      { id: 'rc-sq-1', posRevenueCenter: 'Square Dining Floor', department: 'Front of House', salesAllocationPct: 100, description: 'Indoor main restaurant tables', active: true },
      { id: 'rc-sq-2', posRevenueCenter: 'Square Patio Section', department: 'Front of House', salesAllocationPct: 100, description: 'Al fresco dining terrace', active: true },
      { id: 'rc-sq-3', posRevenueCenter: 'Square Bar & Taproom', department: 'Bar & Beverage', salesAllocationPct: 100, description: 'Bar counter and peripheral standing area', active: true },
      { id: 'rc-sq-4', posRevenueCenter: 'Square Online Pickup / Delivery', department: 'Back of House', salesAllocationPct: 100, description: 'Square online web store order flow', active: true },
      { id: 'rc-sq-5', posRevenueCenter: 'Square Event Room', department: 'Management', salesAllocationPct: 100, description: 'Private bookings and room deposits', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-sq-1', posJobCode: 'SQ_SRV', posJobTitle: 'Square Floor Server', department: 'Front of House', defaultHourlyWage: 18.00, targetLaborPct: 9.5, active: true },
      { id: 'jc-sq-2', posJobCode: 'SQ_BAR', posJobTitle: 'Square Bartender', department: 'Bar & Beverage', defaultHourlyWage: 21.00, targetLaborPct: 4.5, active: true },
      { id: 'jc-sq-3', posJobCode: 'SQ_KTH', posJobTitle: 'Square Line Cook', department: 'Back of House', defaultHourlyWage: 22.00, targetLaborPct: 11.0, active: true },
      { id: 'jc-sq-4', posJobCode: 'SQ_PRP', posJobTitle: 'Square Kitchen Prep / Utility', department: 'Kitchen Prep & Dish', defaultHourlyWage: 17.50, targetLaborPct: 2.8, active: true },
      { id: 'jc-sq-5', posJobCode: 'SQ_MGR', posJobTitle: 'Square Shift Lead / GM', department: 'Management', defaultHourlyWage: 32.00, targetLaborPct: 3.5, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-sq-1', posCategory: 'Food - Mains & Burgers', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 11.0, active: true },
      { id: 'cat-sq-2', posCategory: 'Food - Starters & Wings', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 9.5, active: true },
      { id: 'cat-sq-3', posCategory: 'Drinks - Cocktails & Spirits', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.5, active: true },
      { id: 'cat-sq-4', posCategory: 'Drinks - Craft Beer & Wine', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 3.8, active: true },
      { id: 'cat-sq-5', posCategory: 'Desserts & Soft Drinks', department: 'Kitchen Prep & Dish', contributionPct: 100, targetLaborRatioPct: 2.5, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 9.5, targetSplh: 290, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Back of House': { targetLaborPct: 11.0, targetSplh: 220, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Bar & Beverage': { targetLaborPct: 4.5, targetSplh: 350, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.8, targetSplh: 460, maxOvertimeHours: 2.5, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 540, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  clover: {
    posPlatformId: 'clover',
    posPlatformName: 'Clover POS (Fiserv)',
    locationId: 'CLV_LOC_CA_94103',
    locationName: 'Bistro Moderno - Clover Terminals',
    presetTemplate: 'fast_casual_counter',
    lastUpdated: 'Synced 2m ago (Clover Cloud API)',
    autoSyncEnabled: true,
    revenueCenterMappings: [
      { id: 'rc-clv-1', posRevenueCenter: 'Clover Main Cashier Counter', department: 'Front of House', salesAllocationPct: 100, description: 'Order & Pay counter touchscreens', active: true },
      { id: 'rc-clv-2', posRevenueCenter: 'Clover Dining Area & Booths', department: 'Front of House', salesAllocationPct: 100, description: 'Table delivery & hospitality service', active: true },
      { id: 'rc-clv-3', posRevenueCenter: 'Clover Express Bar & Drinks', department: 'Bar & Beverage', salesAllocationPct: 100, description: 'Quick beverage service terminal', active: true },
      { id: 'rc-clv-4', posRevenueCenter: 'Clover Kitchen Prep Line', department: 'Back of House', salesAllocationPct: 100, description: 'KDS kitchen display station', active: true },
      { id: 'rc-clv-5', posRevenueCenter: 'Clover Management Station', department: 'Management', salesAllocationPct: 100, description: 'Admin tablet terminal', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-clv-1', posJobCode: 'CLV_01', posJobTitle: 'Clover Server / Cashier', department: 'Front of House', defaultHourlyWage: 17.50, targetLaborPct: 9.0, active: true },
      { id: 'jc-clv-2', posJobCode: 'CLV_02', posJobTitle: 'Clover Barista / Bartender', department: 'Bar & Beverage', defaultHourlyWage: 19.50, targetLaborPct: 4.2, active: true },
      { id: 'jc-clv-3', posJobCode: 'CLV_03', posJobTitle: 'Clover Kitchen Line Cook', department: 'Back of House', defaultHourlyWage: 21.00, targetLaborPct: 10.5, active: true },
      { id: 'jc-clv-4', posJobCode: 'CLV_04', posJobTitle: 'Clover Dishwasher & Utility', department: 'Kitchen Prep & Dish', defaultHourlyWage: 16.50, targetLaborPct: 2.5, active: true },
      { id: 'jc-clv-5', posJobCode: 'CLV_05', posJobTitle: 'Clover Shift Manager', department: 'Management', defaultHourlyWage: 30.00, targetLaborPct: 3.5, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-clv-1', posCategory: 'Hot Kitchen & Entrees', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 10.5, active: true },
      { id: 'cat-clv-2', posCategory: 'Beverages & Beer', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.0, active: true },
      { id: 'cat-clv-3', posCategory: 'Bakery & Dessert Items', department: 'Kitchen Prep & Dish', contributionPct: 100, targetLaborRatioPct: 2.5, active: true },
      { id: 'cat-clv-4', posCategory: 'Merch & Packaged Coffee', department: 'Management', contributionPct: 100, targetLaborRatioPct: 3.0, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 9.0, targetSplh: 300, maxOvertimeHours: 3.5, minActiveStaff: 2 },
      'Back of House': { targetLaborPct: 10.5, targetSplh: 230, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Bar & Beverage': { targetLaborPct: 4.2, targetSplh: 360, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.5, targetSplh: 500, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 550, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  ncr_aloha: {
    posPlatformId: 'ncr_aloha',
    posPlatformName: 'NCR Aloha POS',
    locationId: 'ALOHA_NODE_88201',
    locationName: 'Bistro Moderno - Aloha Enterprise Hub',
    presetTemplate: 'fine_dining_lounge',
    lastUpdated: 'Synced 1m ago (NCR Aloha Cloud Connector Agent)',
    autoSyncEnabled: true,
    revenueCenterMappings: [
      { id: 'rc-alh-1', posRevenueCenter: 'Aloha Dining Room 1 (Main Hall)', department: 'Front of House', salesAllocationPct: 100, description: 'Formal white-tablecloth main room', active: true },
      { id: 'rc-alh-2', posRevenueCenter: 'Aloha Patio Deck (Outdoor)', department: 'Front of House', salesAllocationPct: 100, description: 'Heated open-air dining section', active: true },
      { id: 'rc-alh-3', posRevenueCenter: 'Aloha Center Horseshoe Bar', department: 'Bar & Beverage', salesAllocationPct: 100, description: 'Main circular craft cocktail bar', active: true },
      { id: 'rc-alh-4', posRevenueCenter: 'Aloha Back Kitchen & Expediter', department: 'Back of House', salesAllocationPct: 100, description: 'Culinary production line', active: true },
      { id: 'rc-alh-5', posRevenueCenter: 'Aloha VIP Wine & Banquet Lounge', department: 'Management', salesAllocationPct: 100, description: 'Executive event space', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-alh-1', posJobCode: 'ALH_11', posJobTitle: 'Aloha Dining Server', department: 'Front of House', defaultHourlyWage: 19.00, targetLaborPct: 10.5, active: true },
      { id: 'jc-alh-2', posJobCode: 'ALH_12', posJobTitle: 'Aloha Captain / Sommelier', department: 'Front of House', defaultHourlyWage: 24.00, targetLaborPct: 10.0, active: true },
      { id: 'jc-alh-3', posJobCode: 'ALH_21', posJobTitle: 'Aloha Bartender', department: 'Bar & Beverage', defaultHourlyWage: 22.00, targetLaborPct: 4.8, active: true },
      { id: 'jc-alh-4', posJobCode: 'ALH_31', posJobTitle: 'Aloha Line Cook / Sauté', department: 'Back of House', defaultHourlyWage: 23.00, targetLaborPct: 11.5, active: true },
      { id: 'jc-alh-5', posJobCode: 'ALH_41', posJobTitle: 'Aloha Steward / Dish', department: 'Kitchen Prep & Dish', defaultHourlyWage: 17.50, targetLaborPct: 2.6, active: true },
      { id: 'jc-alh-6', posJobCode: 'ALH_91', posJobTitle: 'Aloha Floor Manager', department: 'Management', defaultHourlyWage: 35.00, targetLaborPct: 3.6, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-alh-1', posCategory: 'Food - Dinner Entrees', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 11.5, active: true },
      { id: 'cat-alh-2', posCategory: 'Food - Appetizers & Caviar', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 10.0, active: true },
      { id: 'cat-alh-3', posCategory: 'Liquor - Premium Spirits & Cocktails', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.8, active: true },
      { id: 'cat-alh-4', posCategory: 'Wine - Reserve Cellar Bottles', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.2, active: true },
      { id: 'cat-alh-5', posCategory: 'Pastry - Fine Desserts', department: 'Kitchen Prep & Dish', contributionPct: 100, targetLaborRatioPct: 2.6, active: true },
      { id: 'cat-alh-6', posCategory: 'Banquet & Event Fees', department: 'Management', contributionPct: 100, targetLaborRatioPct: 3.6, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 10.5, targetSplh: 275, maxOvertimeHours: 4.0, minActiveStaff: 3 },
      'Back of House': { targetLaborPct: 11.5, targetSplh: 205, maxOvertimeHours: 5.0, minActiveStaff: 3 },
      'Bar & Beverage': { targetLaborPct: 4.8, targetSplh: 330, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.6, targetSplh: 470, maxOvertimeHours: 3.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.6, targetSplh: 550, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  lightspeed: {
    posPlatformId: 'lightspeed',
    posPlatformName: 'Lightspeed Restaurant (K-Series)',
    locationId: 'LIGHTSPEED_LOC_001',
    locationName: 'Bistro Moderno - Lightspeed',
    presetTemplate: 'fine_dining_lounge',
    lastUpdated: 'Offline',
    autoSyncEnabled: false,
    revenueCenterMappings: [
      { id: 'rc-ls-1', posRevenueCenter: 'Main Dining Room', department: 'Front of House', salesAllocationPct: 100, description: 'Main room', active: true },
      { id: 'rc-ls-2', posRevenueCenter: 'Bar & Lounge', department: 'Bar & Beverage', salesAllocationPct: 100, description: 'Bar section', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-ls-1', posJobCode: 'LS_01', posJobTitle: 'Server', department: 'Front of House', defaultHourlyWage: 18.00, targetLaborPct: 10.0, active: true },
      { id: 'jc-ls-2', posJobCode: 'LS_02', posJobTitle: 'Bartender', department: 'Bar & Beverage', defaultHourlyWage: 20.00, targetLaborPct: 4.5, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-ls-1', posCategory: 'Food', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 11.0, active: true },
      { id: 'cat-ls-2', posCategory: 'Beverages', department: 'Bar & Beverage', contributionPct: 100, targetLaborRatioPct: 4.5, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 10.0, targetSplh: 280, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Back of House': { targetLaborPct: 11.0, targetSplh: 210, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Bar & Beverage': { targetLaborPct: 4.5, targetSplh: 340, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.5, targetSplh: 480, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 550, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  revel: {
    posPlatformId: 'revel',
    posPlatformName: 'Revel Systems POS',
    locationId: 'REVEL_LOC_001',
    locationName: 'Bistro Moderno - Revel iPad',
    presetTemplate: 'fast_casual_counter',
    lastUpdated: 'Offline',
    autoSyncEnabled: false,
    revenueCenterMappings: [
      { id: 'rc-rev-1', posRevenueCenter: 'Front Counter', department: 'Front of House', salesAllocationPct: 100, description: 'Counter POS', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-rev-1', posJobCode: 'REV_01', posJobTitle: 'Cashier/Server', department: 'Front of House', defaultHourlyWage: 17.50, targetLaborPct: 10.0, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-rev-1', posCategory: 'Food & Beverage', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 15.0, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 10.0, targetSplh: 280, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Back of House': { targetLaborPct: 11.0, targetSplh: 210, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Bar & Beverage': { targetLaborPct: 4.5, targetSplh: 340, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.5, targetSplh: 480, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 550, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  spoton: {
    posPlatformId: 'spoton',
    posPlatformName: 'SpotOn Restaurant POS',
    locationId: 'SPOTON_LOC_001',
    locationName: 'Bistro Moderno - SpotOn',
    presetTemplate: 'bistro_full_service',
    lastUpdated: 'Offline',
    autoSyncEnabled: false,
    revenueCenterMappings: [
      { id: 'rc-so-1', posRevenueCenter: 'Dining Room', department: 'Front of House', salesAllocationPct: 100, description: 'Main Floor', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-so-1', posJobCode: 'SO_01', posJobTitle: 'Server', department: 'Front of House', defaultHourlyWage: 18.00, targetLaborPct: 10.0, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-so-1', posCategory: 'Food & Drinks', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 15.0, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 10.0, targetSplh: 280, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Back of House': { targetLaborPct: 11.0, targetSplh: 210, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Bar & Beverage': { targetLaborPct: 4.5, targetSplh: 340, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.5, targetSplh: 480, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 550, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },

  micros_simphony: {
    posPlatformId: 'micros_simphony',
    posPlatformName: 'Oracle MICROS Simphony',
    locationId: 'MICROS_LOC_001',
    locationName: 'Bistro Moderno - Oracle MICROS',
    presetTemplate: 'fine_dining_lounge',
    lastUpdated: 'Offline',
    autoSyncEnabled: false,
    revenueCenterMappings: [
      { id: 'rc-mic-1', posRevenueCenter: 'Main Dining Room', department: 'Front of House', salesAllocationPct: 100, description: 'Simphony RVC 01', active: true },
    ],
    jobCodeMappings: [
      { id: 'jc-mic-1', posJobCode: 'MIC_01', posJobTitle: 'Server', department: 'Front of House', defaultHourlyWage: 18.50, targetLaborPct: 10.0, active: true },
    ],
    salesCategoryMappings: [
      { id: 'cat-mic-1', posCategory: 'Food', department: 'Back of House', contributionPct: 100, targetLaborRatioPct: 12.0, active: true },
    ],
    departmentTargets: {
      'Front of House': { targetLaborPct: 10.0, targetSplh: 280, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Back of House': { targetLaborPct: 11.0, targetSplh: 210, maxOvertimeHours: 4.0, minActiveStaff: 2 },
      'Bar & Beverage': { targetLaborPct: 4.5, targetSplh: 340, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Kitchen Prep & Dish': { targetLaborPct: 2.5, targetSplh: 480, maxOvertimeHours: 2.0, minActiveStaff: 1 },
      'Management': { targetLaborPct: 3.5, targetSplh: 550, maxOvertimeHours: 2.0, minActiveStaff: 1 },
    }
  },
};

/**
 * Computes live labor-to-sales efficiency metrics per department
 * given current active POS mapping configuration and real-time shifts/sales.
 */
export function calculateDepartmentLiveEfficiency(
  posMapping?: POSDepartmentMapping,
  totalPosNetSales: number = 8420,
  totalPosLaborCost: number = 1540,
  todayShifts: Shift[] = [],
  employees: Employee[] = []
): DepartmentLiveEfficiencyMetric[] {
  const safeMapping = posMapping || INITIAL_POS_DEPARTMENT_MAPPINGS['toast'];
  const departments: Department[] = [
    'Front of House',
    'Back of House',
    'Bar & Beverage',
    'Kitchen Prep & Dish',
    'Management'
  ];

  // Distribution weights of sales contribution by department based on mapped categories and revenue centers
  const deptSalesShareWeights: Record<Department, number> = {
    'Front of House': 0.44, // 44% of revenue generated from dining room service
    'Back of House': 0.22, // 22% of revenue from food/kitchen direct & delivery
    'Bar & Beverage': 0.28, // 28% of revenue from craft cocktails, beer, wine
    'Kitchen Prep & Dish': 0.03, // 3% pastry & desserts
    'Management': 0.03, // 3% VIP rooms & buyout fees
  };

  return departments.map(dept => {
    const config = safeMapping.departmentTargets?.[dept] || {
      targetLaborPct: 10.0,
      targetSplh: 250,
      maxOvertimeHours: 4.0,
      minActiveStaff: 2
    };

    // Calculate actual clocked-in hours and wages for this department today
    const deptShifts = (todayShifts || []).filter(s => s.department === dept);
    const activeStaff = (employees || []).filter(e => e.department === dept && deptShifts.some(s => s.employeeId === e.id));
    const activeStaffClockedIn = activeStaff.length || (dept === 'Front of House' ? 3 : dept === 'Back of House' ? 2 : 1);

    // Calculate hours
    let totalHoursToday = deptShifts.reduce((acc, s) => {
      const [sh, sm] = (s.startTime || '09:00').split(':').map(Number);
      const [eh, em] = (s.endTime || '17:00').split(':').map(Number);
      const gross = (eh * 60 + em) - (sh * 60 + sm);
      return acc + (Math.max(0, gross - (s.breakMinutes || 0)) / 60);
    }, 0);

    if (totalHoursToday === 0) {
      // Fallback realistic baseline if shifts aren't loaded for current day
      totalHoursToday = dept === 'Front of House' ? 16.5 : dept === 'Back of House' ? 14.0 : dept === 'Bar & Beverage' ? 8.5 : dept === 'Kitchen Prep & Dish' ? 6.0 : 4.0;
    }

    const avgHourlyWage = activeStaff.length > 0
      ? activeStaff.reduce((sum, e) => sum + e.hourlyWage, 0) / activeStaff.length
      : dept === 'Management' ? 34 : dept === 'Back of House' ? 23 : dept === 'Bar & Beverage' ? 22 : 18.5;

    // Derived department labor cost
    const liveLaborCost = Math.round(totalHoursToday * avgHourlyWage);

    // Department mapped net sales share
    const salesWeight = deptSalesShareWeights[dept];
    const liveMappedSales = Math.round((totalPosNetSales || 0) * salesWeight);

    // Labor % ratio
    const liveLaborPct = liveMappedSales > 0 ? Number(((liveLaborCost / liveMappedSales) * 100).toFixed(2)) : 0;
    const varianceLaborPct = Number((liveLaborPct - config.targetLaborPct).toFixed(2));

    // Sales Per Labor Hour (SPLH)
    const liveSplh = totalHoursToday > 0 ? Math.round(liveMappedSales / totalHoursToday) : 0;
    const splhEfficiencyIndex = Math.min(100, Math.round((liveSplh / (config.targetSplh || 1)) * 100));

    // Status evaluation
    let status: 'optimal' | 'lean_floor_risk' | 'high_labor_warning' = 'optimal';
    let recommendation = 'Labor efficiency and floor coverage are well balanced within targeted benchmarks.';

    if (liveLaborPct > config.targetLaborPct + 3.0) {
      status = 'high_labor_warning';
      recommendation = `Labor cost (${liveLaborPct}%) is ${(liveLaborPct - config.targetLaborPct).toFixed(1)}% above the ${config.targetLaborPct}% goal. Consider early cut of 1 staff or reassigning prep tasks.`;
    } else if (liveLaborPct < config.targetLaborPct - 4.0 && liveSplh > config.targetSplh * 1.25) {
      status = 'lean_floor_risk';
      recommendation = `SPLH is exceptionally high ($${liveSplh}/hr). Floor might be understaffed during peak rush, risking service delays.`;
    } else {
      recommendation = `Optimal operating efficiency ($${liveSplh} SPLH vs $${config.targetSplh} goal). Maintained ${liveLaborPct}% labor ratio.`;
    }

    const salesSharePct = (totalPosNetSales || 0) > 0 ? Number(((liveMappedSales / totalPosNetSales) * 100).toFixed(1)) : 0;
    const laborSharePct = (totalPosLaborCost || 0) > 0 ? Number(((liveLaborCost / totalPosLaborCost) * 100).toFixed(1)) : 0;

    const activeJobCodesCount = (safeMapping.jobCodeMappings || []).filter(j => j.department === dept && j.active).length;
    const activeRevenueCentersCount = (safeMapping.revenueCenterMappings || []).filter(r => r.department === dept && r.active).length;

    return {
      department: dept,
      posPlatformId: safeMapping.posPlatformId || 'toast',
      activeStaffClockedIn,
      totalHoursToday: Number(totalHoursToday.toFixed(1)),
      avgHourlyWage: Number(avgHourlyWage.toFixed(2)),
      liveLaborCost,
      liveMappedSales,
      liveLaborPct,
      targetLaborPct: config.targetLaborPct,
      varianceLaborPct,
      liveSplh,
      targetSplh: config.targetSplh,
      splhEfficiencyIndex,
      salesSharePct,
      laborSharePct,
      status,
      activeJobCodesCount,
      activeRevenueCentersCount,
      recommendation
    };
  });
}