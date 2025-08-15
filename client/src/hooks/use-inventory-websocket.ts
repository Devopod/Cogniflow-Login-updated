import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { toast } from "react-toastify";

// Types for WebSocket events
interface InventoryEventData {
  product?: any;
  products?: any[];
  count?: number;
  adjustment?: number;
  oldQuantity?: number;
  newQuantity?: number;
  reason?: string;
  movements?: any[];
  stock?: any;
  location?: string;
}

export function useInventoryWebSocket() {
  const queryClient = useQueryClient();
  
  const { sendMessage } = useWebSocket({
    resource: 'inventory',
    resourceId: 'all',
    onMessage: (message) => {
      // Handle inventory-specific WebSocket messages
      handleInventoryWebSocketMessage(message, queryClient);
    },
    invalidateQueries: [
      ['/api/inventory/products'],
      ['/api/inventory/dashboard'],
      ['/api/inventory/stock-movements'],
      ['/api/inventory/products/alerts/low-stock'],
      ['/api/products'] // Legacy endpoint
    ]
  });

  const handleInventoryWebSocketMessage = (message: any, queryClient: any) => {
    const { type, data } = message;

    // ==================== PRODUCT EVENTS ====================
    
    const handleProductCreated = (data: InventoryEventData) => {
      // Invalidate all relevant queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.product) {
        toast.success(`New product added: ${data.product.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleProductUpdated = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.product) {
        queryClient.invalidateQueries({ queryKey: ["/api/inventory/products", data.product.id] });
        queryClient.invalidateQueries({ queryKey: ["/api/products", data.product.id] });
      }
    };

    const handleProductDeleted = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.product) {
        toast.info(`Product removed: ${data.product.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const handleProductsImported = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.count !== undefined) {
        toast.success(`${data.count} products imported successfully!`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };

    // ==================== STOCK EVENTS ====================
    
    const handleStockAdjusted = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.product && data.adjustment !== undefined) {
        const adjustmentText = data.adjustment > 0 ? 'increased' : 'decreased';
        const absoluteAdjustment = Math.abs(data.adjustment);
        
        toast.info(
          `Stock ${adjustmentText}: ${data.product.name} by ${absoluteAdjustment} units (${data.oldQuantity} → ${data.newQuantity})`,
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
      }
    };

    const handleStockTransferred = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      if (data.product) {
        toast.info(`Stock transferred: ${data.product.name}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    };

    const handleLowStockAlert = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      
      if (data.product) {
        toast.warning(
          `Low stock alert: ${data.product.name} (${data.product.quantity} remaining)`,
          {
            position: "top-right",
            autoClose: 6000,
          }
        );
      }
    };

    const handleOutOfStockAlert = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products/alerts/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      
      if (data.product) {
        toast.error(`Out of stock: ${data.product.name}`, {
          position: "top-right",
          autoClose: 0, // Don't auto-close critical alerts
        });
      }
    };

    // ==================== LOCATION/WAREHOUSE EVENTS ====================
    
    const handleWarehouseUpdated = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      
      if (data.location) {
        toast.info(`Warehouse updated: ${data.location}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    // ==================== INVENTORY ANALYTICS EVENTS ====================
    
    const handleInventoryReportGenerated = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
      
      toast.success("Inventory report generated successfully", {
        position: "top-right",
        autoClose: 3000,
      });
    };

    const handleInventoryMetricsUpdated = (data: InventoryEventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/dashboard"] });
    };

    // ==================== EVENT ROUTING ====================

    switch (type) {
      // Product Events
      case 'product_created':
        handleProductCreated(data);
        break;
      case 'product_updated':
        handleProductUpdated(data);
        break;
      case 'product_deleted':
        handleProductDeleted(data);
        break;
      case 'products_imported':
        handleProductsImported(data);
        break;

      // Stock Events
      case 'stock_adjusted':
        handleStockAdjusted(data);
        break;
      case 'stock_transferred':
        handleStockTransferred(data);
        break;
      case 'low_stock_alert':
        handleLowStockAlert(data);
        break;
      case 'out_of_stock_alert':
        handleOutOfStockAlert(data);
        break;

      // Location Events
      case 'warehouse_updated':
        handleWarehouseUpdated(data);
        break;

      // Analytics Events
      case 'inventory_report_generated':
        handleInventoryReportGenerated(data);
        break;
      case 'inventory_metrics_updated':
        handleInventoryMetricsUpdated(data);
        break;

      default:
        console.log('Unhandled inventory WebSocket event:', type, data);
    }
  };

  // Function to send inventory-specific messages
  const sendInventoryMessage = (type: string, data: any) => {
    sendMessage({ type, data });
  };

  return {
    sendInventoryMessage,
    sendMessage
  };
}

export default useInventoryWebSocket;