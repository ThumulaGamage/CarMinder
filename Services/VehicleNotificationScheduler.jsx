// services/VehicleNotificationScheduler.js
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebaseConfig';
import NotificationService from './NotificationService';

class VehicleNotificationScheduler {

  async scheduleAllVehicleNotifications() {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found, skipping notification scheduling');
        return;
      }

      console.log('Scheduling notifications for user:', user.uid);
      
      // Cancel existing notifications first
      await NotificationService.cancelAllNotifications();

      // Get all vehicles with error handling
      try {
        const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
        const vehiclesSnapshot = await getDocs(vehiclesRef);

        if (vehiclesSnapshot.empty) {
          console.log('No vehicles found for user');
          return;
        }

        console.log(`Found ${vehiclesSnapshot.docs.length} vehicles`);

        for (const vehicleDoc of vehiclesSnapshot.docs) {
          const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
          
          try {
            // Schedule license notifications
            await this.scheduleLicenseNotifications(user.uid, vehicle);
            
            // Schedule insurance notifications
            await this.scheduleInsuranceNotifications(user.uid, vehicle);
          } catch (vehicleError) {
            console.error(`Error scheduling notifications for vehicle ${vehicle.id}:`, vehicleError);
            // Continue with other vehicles even if one fails
          }
        }

        console.log('All vehicle notifications scheduled successfully');
      } catch (firestoreError) {
        console.error('Error accessing vehicles collection:', firestoreError);
        throw firestoreError;
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  }

  async scheduleLicenseNotifications(userId, vehicle) {
    try {
      if (!userId || !vehicle || !vehicle.id) {
        console.error('Invalid parameters for license notifications');
        return;
      }

      const licensesRef = collection(db, 'users', userId, 'licenses');
      const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicle.id));
      const licenseSnap = await getDocs(licenseQuery);

      if (!licenseSnap.empty) {
        const licenseData = licenseSnap.docs[0].data();
        
        if (!licenseData.expireDate) {
          console.log(`No expiry date for license of vehicle ${vehicle.id}`);
          return;
        }

        const expireDate = new Date(licenseData.expireDate);
        const today = new Date();

        // Validate expiry date
        if (isNaN(expireDate.getTime())) {
          console.error(`Invalid expiry date for license of vehicle ${vehicle.id}:`, licenseData.expireDate);
          return;
        }

        if (expireDate > today) {
          await this.scheduleNotificationIntervals(
            'license',
            vehicle,
            licenseData,
            expireDate,
            `License for ${vehicle.brand || 'Vehicle'} ${vehicle.model || ''}`.trim(),
            `License No: ${licenseData.licenseNumber || 'N/A'}`
          );
          console.log(`License notifications scheduled for vehicle ${vehicle.id}`);
        } else {
          console.log(`License already expired for vehicle ${vehicle.id}`);
        }
      } else {
        console.log(`No license data found for vehicle ${vehicle.id}`);
      }
    } catch (error) {
      console.error(`Error scheduling license notifications for vehicle ${vehicle.id}:`, error);
    }
  }

  async scheduleInsuranceNotifications(userId, vehicle) {
    try {
      if (!userId || !vehicle || !vehicle.id) {
        console.error('Invalid parameters for insurance notifications');
        return;
      }

      const insuranceRef = collection(db, 'users', userId, 'insurance');
      const insuranceQuery = query(insuranceRef, where('vehicleId', '==', vehicle.id));
      const insuranceSnap = await getDocs(insuranceQuery);

      if (!insuranceSnap.empty) {
        const insuranceData = insuranceSnap.docs[0].data();
        
        if (!insuranceData.expireDate) {
          console.log(`No expiry date for insurance of vehicle ${vehicle.id}`);
          return;
        }

        const expireDate = new Date(insuranceData.expireDate);
        const today = new Date();

        // Validate expiry date
        if (isNaN(expireDate.getTime())) {
          console.error(`Invalid expiry date for insurance of vehicle ${vehicle.id}:`, insuranceData.expireDate);
          return;
        }

        if (expireDate > today) {
          await this.scheduleNotificationIntervals(
            'insurance',
            vehicle,
            insuranceData,
            expireDate,
            `Insurance for ${vehicle.brand || 'Vehicle'} ${vehicle.model || ''}`.trim(),
            `Policy: ${insuranceData.policyNumber || 'N/A'}`
          );
          console.log(`Insurance notifications scheduled for vehicle ${vehicle.id}`);
        } else {
          console.log(`Insurance already expired for vehicle ${vehicle.id}`);
        }
      } else {
        console.log(`No insurance data found for vehicle ${vehicle.id}`);
      }
    } catch (error) {
      console.error(`Error scheduling insurance notifications for vehicle ${vehicle.id}:`, error);
    }
  }

  async scheduleNotificationIntervals(type, vehicle, data, expireDate, title, subtitle) {
    try {
      const intervals = [30, 14, 7, 3, 1]; // Days before expiry
      const today = new Date();
      
      for (const days of intervals) {
        try {
          const notificationDate = new Date(expireDate);
          notificationDate.setDate(notificationDate.getDate() - days);
          
          // Only schedule if notification date is in the future
          if (notificationDate > today) {
            const urgencyLevel = this.getUrgencyLevel(days);
            
            const notificationTitle = `${urgencyLevel.emoji} ${title}`;
            const notificationBody = `${subtitle} ${urgencyLevel.message} ${days} ${days === 1 ? 'day' : 'days'}`;
            
            const notificationData = {
              type: type,
              vehicleId: vehicle.id,
              vehicleName: `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle',
              vehiclePlate: vehicle.plate || 'N/A',
              daysRemaining: days,
              expireDate: expireDate.toISOString(),
              action: 'open_document'
            };

            const notificationId = await NotificationService.scheduleNotificationForDate(
              notificationTitle,
              notificationBody,
              notificationDate,
              notificationData
            );

            if (notificationId) {
              console.log(`Scheduled ${type} notification for ${days} days before expiry`);
            }
          }
        } catch (intervalError) {
          console.error(`Error scheduling ${days}-day notification:`, intervalError);
        }
      }

      // Schedule "expired" notification for day after expiry
      try {
        const expiredDate = new Date(expireDate);
        expiredDate.setDate(expiredDate.getDate() + 1);
        
        if (expiredDate > today) {
          const expiredNotificationData = {
            type: type,
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle',
            vehiclePlate: vehicle.plate || 'N/A',
            daysRemaining: -1,
            expireDate: expireDate.toISOString(),
            action: 'open_document',
            urgent: true
          };

          await NotificationService.scheduleNotificationForDate(
            `🚨 ${title} EXPIRED`,
            `${subtitle} expired yesterday. Renew immediately!`,
            expiredDate,
            expiredNotificationData
          );
        }
      } catch (expiredError) {
        console.error('Error scheduling expired notification:', expiredError);
      }
    } catch (error) {
      console.error('Error in scheduleNotificationIntervals:', error);
    }
  }

  getUrgencyLevel(days) {
    if (days <= 1) {
      return { emoji: '🚨', message: 'expires in' };
    } else if (days <= 3) {
      return { emoji: '⚠️', message: 'expires in' };
    } else if (days <= 7) {
      return { emoji: '⏰', message: 'expires in' };
    } else if (days <= 14) {
      return { emoji: '📅', message: 'expires in' };
    } else {
      return { emoji: '📋', message: 'expires in' };
    }
  }

  async savePushToken(token) {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user to save push token');
        return false;
      }

      if (!token) {
        console.error('No token provided to save');
        return false;
      }

      const tokenData = {
        pushToken: token,
        updatedAt: new Date().toISOString(),
        platform: Platform.OS,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version
        }
      };

      await setDoc(
        doc(db, 'users', user.uid, 'settings', 'notifications'), 
        tokenData,
        { merge: true } // Use merge to preserve other settings
      );

      console.log('Push token saved to Firebase');
      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  async checkImmediateNotifications() {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user for immediate notifications check');
        return;
      }

      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      // Get all vehicles and check for items expiring within 3 days
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const vehiclesSnapshot = await getDocs(vehiclesRef);

      if (vehiclesSnapshot.empty) {
        console.log('No vehicles found for immediate notifications check');
        return;
      }

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
        
        try {
          // Check license expiry
          await this.checkImmediateLicenseExpiry(user.uid, vehicle, today, threeDaysFromNow);
          
          // Check insurance expiry
          await this.checkImmediateInsuranceExpiry(user.uid, vehicle, today, threeDaysFromNow);
        } catch (vehicleError) {
          console.error(`Error checking immediate notifications for vehicle ${vehicle.id}:`, vehicleError);
        }
      }
    } catch (error) {
      console.error('Error checking immediate notifications:', error);
    }
  }

  async checkImmediateLicenseExpiry(userId, vehicle, today, threeDaysFromNow) {
    try {
      const licensesRef = collection(db, 'users', userId, 'licenses');
      const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicle.id));
      const licenseSnap = await getDocs(licenseQuery);

      if (!licenseSnap.empty) {
        const licenseData = licenseSnap.docs[0].data();
        
        if (licenseData.expireDate) {
          const expireDate = new Date(licenseData.expireDate);
          
          if (!isNaN(expireDate.getTime()) && expireDate <= threeDaysFromNow && expireDate > today) {
            const days = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
            await NotificationService.scheduleLocalNotification(
              `🚨 License Expiring Soon`,
              `${vehicle.brand || 'Vehicle'} ${vehicle.model || ''} license expires in ${days} ${days === 1 ? 'day' : 'days'}`,
              {
                type: 'license',
                vehicleId: vehicle.id,
                action: 'open_document',
                immediate: true
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking immediate license expiry:', error);
    }
  }

  async checkImmediateInsuranceExpiry(userId, vehicle, today, threeDaysFromNow) {
    try {
      const insuranceRef = collection(db, 'users', userId, 'insurance');
      const insuranceQuery = query(insuranceRef, where('vehicleId', '==', vehicle.id));
      const insuranceSnap = await getDocs(insuranceQuery);

      if (!insuranceSnap.empty) {
        const insuranceData = insuranceSnap.docs[0].data();
        
        if (insuranceData.expireDate) {
          const expireDate = new Date(insuranceData.expireDate);
          
          if (!isNaN(expireDate.getTime()) && expireDate <= threeDaysFromNow && expireDate > today) {
            const days = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
            await NotificationService.scheduleLocalNotification(
              `🚨 Insurance Expiring Soon`,
              `${vehicle.brand || 'Vehicle'} ${vehicle.model || ''} insurance expires in ${days} ${days === 1 ? 'day' : 'days'}`,
              {
                type: 'insurance',
                vehicleId: vehicle.id,
                action: 'open_document',
                immediate: true
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking immediate insurance expiry:', error);
    }
  }
}

export default new VehicleNotificationScheduler();