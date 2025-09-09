import { Alert } from 'react-native';
import { auth, db } from '../../../../../config/firebaseConfig';

// Main service update handler
export const ServiceUpdateHandler = {
  
  // Handle marking service as done with confirmation
  handleMarkServiceDone: async (serviceType, vehicleId, currentMileage, onSuccess) => {
    
    // Show confirmation dialog
    Alert.alert(
      'Confirm Service Completion',
      `Are you sure you completed the ${serviceType}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, I did it',
          style: 'default',
          onPress: () => ServiceUpdateHandler.updateServiceRecord(serviceType, vehicleId, currentMileage, onSuccess)
        }
      ],
      { cancelable: true }
    );
  },

  // Update service record in database
  updateServiceRecord: async (serviceType, vehicleId, currentMileage, onSuccess) => {
    try {
      if (!auth?.currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const userId = auth.currentUser.uid;
      const updateData = {};
      const currentDate = new Date().toISOString();

      // Determine what to update based on service type
      switch (serviceType) {
        case 'Oil Service':
          updateData.oilServiceMileage = currentMileage;
          updateData.lastOilServiceDate = currentDate;
          break;
          
        case 'Full Service':
          updateData.fullServiceMileage = currentMileage;
          updateData.lastFullServiceDate = currentDate;
          break;
          
        case 'Tyre Change':
          updateData.tyreChangeMileage = currentMileage;
          updateData.lastTyreChangeDate = currentDate;
          break;
          
        case 'Brake Oil':
          updateData.brakeOilDate = currentDate;
          break;
          
        case 'Battery Check':
          updateData.batteryCheckDate = currentDate;
          break;
          
        default:
          Alert.alert('Error', 'Unknown service type');
          return;
      }

      // Add general update timestamp
      updateData.lastServiceUpdate = currentDate;

      console.log(`Updating ${serviceType}:`, updateData);
      console.log(`Vehicle ID: ${vehicleId}, User ID: ${userId}`);

      // Update the vehicle document using Firebase v8 compat syntax
      await db
        .collection('users')
        .doc(userId)
        .collection('vehicles')
        .doc(vehicleId.toString())
        .update(updateData);

      console.log(`${serviceType} updated successfully`);

      // Show success message
      Alert.alert(
        'Service Updated!',
        `${serviceType} has been marked as completed and your records have been updated.`,
        [{ 
          text: 'OK',
          onPress: () => {
            // Call the success callback to refresh data
            if (onSuccess) {
              onSuccess();
            }
          }
        }]
      );

      // Return success status for UI updates
      return { success: true, serviceType, updateData };

    } catch (error) {
      console.error(`Error updating ${serviceType}:`, error);
      Alert.alert(
        'Update Failed',
        `Failed to update ${serviceType}. Please try again.\n\nError: ${error.message}`,
        [{ text: 'OK' }]
      );
      return { success: false, error };
    }
  },

  // Calculate next service dates/mileages (helper function)
  calculateNextService: (serviceType, currentValue) => {
    const serviceIntervals = {
      'Oil Service': { mileage: 5000, months: 6 },
      'Full Service': { mileage: 10000, months: 12 },
      'Tyre Change': { mileage: 40000, months: 24 },
      'Brake Oil': { months: 24 },
      'Battery Check': { months: 6 }
    };

    const interval = serviceIntervals[serviceType];
    const currentDate = new Date();

    if (serviceType === 'Oil Service' || serviceType === 'Full Service' || serviceType === 'Tyre Change') {
      // For mileage-based services
      return {
        nextMileage: currentValue + interval.mileage,
        nextDate: new Date(currentDate.setMonth(currentDate.getMonth() + interval.months))
      };
    } else {
      // For date-based services
      return {
        nextDate: new Date(currentDate.setMonth(currentDate.getMonth() + interval.months))
      };
    }
  }
};

// Hook for use in React components
export const useServiceUpdates = (vehicleId, currentMileage, onRefresh) => {
  const markOilServiceDone = () => {
    ServiceUpdateHandler.handleMarkServiceDone('Oil Service', vehicleId, currentMileage, onRefresh);
  };
  
  const markFullServiceDone = () => {
    ServiceUpdateHandler.handleMarkServiceDone('Full Service', vehicleId, currentMileage, onRefresh);
  };
  
  const markTyreChangeDone = () => {
    ServiceUpdateHandler.handleMarkServiceDone('Tyre Change', vehicleId, currentMileage, onRefresh);
  };
  
  const markBrakeOilDone = () => {
    ServiceUpdateHandler.handleMarkServiceDone('Brake Oil', vehicleId, null, onRefresh);
  };
  
  const markBatteryCheckDone = () => {
    ServiceUpdateHandler.handleMarkServiceDone('Battery Check', vehicleId, null, onRefresh);
  };

  return {
    markOilServiceDone,
    markFullServiceDone,
    markTyreChangeDone,
    markBrakeOilDone,
    markBatteryCheckDone
  };
};

export default ServiceUpdateHandler;