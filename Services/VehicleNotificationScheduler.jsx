// services/VehicleNotificationScheduler.js
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import NotificationService from './NotificationService';

class VehicleNotificationScheduler {

  // Schedule notifications for all vehicles
  async scheduleAllVehicleNotifications() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Cancel existing notifications first
      await NotificationService.cancelAllNotifications();

      // Get all vehicles
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const vehiclesSnapshot = await getDocs(vehiclesRef);

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
        
        // Schedule license notifications
        await this.scheduleLicenseNotifications(user.uid, vehicle);
        
        // Schedule insurance notifications
        await this.scheduleInsuranceNotifications(user.uid, vehicle);
      }

      console.log('All vehicle notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  // Schedule license expiry notifications
  async scheduleLicenseNotifications(userId, vehicle) {
    try {
      const licensesRef = collection(db, 'users', userId, 'licenses');
      const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicle.id));
      const licenseSnap = await getDocs(licenseQuery);

      if (!licenseSnap.empty) {
        const licenseData = licenseSnap.docs[0].data();
        const expireDate = new Date(licenseData.expireDate);
        const today = new Date();

        if (expireDate > today) {
          // Schedule notifications at different intervals
          await this.scheduleNotificationIntervals(
            'license',
            vehicle,
            licenseData,
            expireDate,
            `License for ${vehicle.brand} ${vehicle.model}`,
            `License No: ${licenseData.licenseNumber}`
          );
        }
      }
    } catch (error) {
      console.log('No license data for vehicle:', vehicle.id);
    }
  }

  // Schedule insurance expiry notifications
  async scheduleInsuranceNotifications(userId, vehicle) {
    try {
      const insuranceRef = collection(db, 'users', userId, 'insurance');
      const insuranceQuery = query(insuranceRef, where('vehicleId', '==', vehicle.id));
      const insuranceSnap = await getDocs(insuranceQuery);

      if (!insuranceSnap.empty) {
        const insuranceData = insuranceSnap.docs[0].data();
        const expireDate = new Date(insuranceData.expireDate);
        const today = new Date();

        if (expireDate > today) {
          // Schedule notifications at different intervals
          await this.scheduleNotificationIntervals(
            'insurance',
            vehicle,
            insuranceData,
            expireDate,
            `Insurance for ${vehicle.brand} ${vehicle.model}`,
            `Policy: ${insuranceData.policyNumber}`
          );
        }
      }
    } catch (error) {
      console.log('No insurance data for vehicle:', vehicle.id);
    }
  }

  // Schedule notifications at multiple intervals before expiry
  async scheduleNotificationIntervals(type, vehicle, data, expireDate, title, subtitle) {
    const intervals = [30, 14, 7, 3, 1]; // Days before expiry
    
    for (const days of intervals) {
      const notificationDate = new Date(expireDate);
      notificationDate.setDate(notificationDate.getDate() - days);
      
      // Only schedule if notification date is in the future
      if (notificationDate > new Date()) {
        const urgencyLevel = this.getUrgencyLevel(days);
        
        await NotificationService.scheduleNotificationForDate(
          `${urgencyLevel.emoji} ${title}`,
          `${subtitle} ${urgencyLevel.message} ${days} ${days === 1 ? 'day' : 'days'}`,
          notificationDate,
          {
            type: type,
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.brand} ${vehicle.model}`,
            vehiclePlate: vehicle.plate,
            daysRemaining: days,
            expireDate: expireDate.toISOString(),
            action: 'open_document'
          }
        );
      }
    }

    // Schedule "expired" notification for day after expiry
    const expiredDate = new Date(expireDate);
    expiredDate.setDate(expiredDate.getDate() + 1);
    
    if (expiredDate > new Date()) {
      await NotificationService.scheduleNotificationForDate(
        `🚨 ${title} EXPIRED`,
        `${subtitle} expired yesterday. Renew immediately!`,
        expiredDate,
        {
          type: type,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          vehiclePlate: vehicle.plate,
          daysRemaining: -1,
          expireDate: expireDate.toISOString(),
          action: 'open_document',
          urgent: true
        }
      );
    }
  }

  // Get urgency level based on days remaining
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

  // Save user's push token to Firebase for server-side notifications
  async savePushToken(token) {
    try {
      const user = auth.currentUser;
      if (!user || !token) return;

      await setDoc(doc(db, 'users', user.uid, 'settings', 'notifications'), {
        pushToken: token,
        updatedAt: new Date().toISOString(),
        platform: Platform.OS
      });

      console.log('Push token saved to Firebase');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Check and schedule immediate notifications for items expiring soon
  async checkImmediateNotifications() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      // Get all vehicles and check for items expiring within 3 days
      const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
      const vehiclesSnapshot = await getDocs(vehiclesRef);

      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
        
        // Check license
        const licensesRef = collection(db, 'users', user.uid, 'licenses');
        const licenseQuery = query(licensesRef, where('vehicleId', '==', vehicle.id));
        const licenseSnap = await getDocs(licenseQuery);

        if (!licenseSnap.empty) {
          const licenseData = licenseSnap.docs[0].data();
          const expireDate = new Date(licenseData.expireDate);
          
          if (expireDate <= threeDaysFromNow && expireDate > today) {
            const days = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
            await NotificationService.scheduleLocalNotification(
              `🚨 License Expiring Soon`,
              `${vehicle.brand} ${vehicle.model} license expires in ${days} ${days === 1 ? 'day' : 'days'}`,
              {
                type: 'license',
                vehicleId: vehicle.id,
                action: 'open_document'
              }
            );
          }
        }

        // Check insurance
        const insuranceRef = collection(db, 'users', user.uid, 'insurance');
        const insuranceQuery = query(insuranceRef, where('vehicleId', '==', vehicle.id));
        const insuranceSnap = await getDocs(insuranceQuery);

        if (!insuranceSnap.empty) {
          const insuranceData = insuranceSnap.docs[0].data();
          const expireDate = new Date(insuranceData.expireDate);
          
          if (expireDate <= threeDaysFromNow && expireDate > today) {
            const days = Math.ceil((expireDate - today) / (1000 * 60 * 60 * 24));
            await NotificationService.scheduleLocalNotification(
              `🚨 Insurance Expiring Soon`,
              `${vehicle.brand} ${vehicle.model} insurance expires in ${days} ${days === 1 ? 'day' : 'days'}`,
              {
                type: 'insurance',
                vehicleId: vehicle.id,
                action: 'open_document'
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking immediate notifications:', error);
    }
  }
}

export default new VehicleNotificationScheduler();