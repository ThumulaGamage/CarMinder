import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useServiceUpdates } from './service_done';

import { auth, db } from '../../../config/firebaseConfig';
import useTheme from '../../../Theme/theme';

const ServiceOngoing = () => {
  const theme = useTheme();
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animatedValues] = useState({
    oil: new Animated.Value(0),
    fullService: new Animated.Value(0),
    tyre: new Animated.Value(0),
    brakeOil: new Animated.Value(0),
    battery: new Animated.Value(0),
  });

  // Get current mileage first, then use it in the hook
  const currentMileage = vehicle?.mileage || 0;
  
  // Now use the hook with the refresh function
  const {
    markOilServiceDone,
    markFullServiceDone,
    markTyreChangeDone,
    markBrakeOilDone,
    markBatteryCheckDone
  } = useServiceUpdates(vehicleId, currentMileage, fetchVehicleData);

  useEffect(() => {
    fetchVehicleData();
  }, [vehicleId]);

  useEffect(() => {
    if (vehicle) {
      animateProgressBars();
    }
  }, [vehicle]);

  const fetchVehicleData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !vehicleId) {
        setLoading(false);
        return;
      }

      // Using Firebase v8 compat syntax
      const vehicleDocRef = db.collection('users').doc(userId).collection('vehicles').doc(vehicleId);
      const docSnap = await vehicleDocRef.get();

      if (docSnap.exists) {
        setVehicle({ id: docSnap.id, ...docSnap.data() });
        console.log('Vehicle data fetched:', { id: docSnap.id, ...docSnap.data() });
      } else {
        console.log('Vehicle document does not exist');
        setVehicle(null);
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  const animateProgressBars = () => {
    const animations = Object.values(animatedValues).map((animValue, index) => {
      return Animated.timing(animValue, {
        toValue: 1,
        duration: 1000 + (index * 200), // Staggered animation
        useNativeDriver: false,
      });
    });

    Animated.stagger(100, animations).start();
  };
  
  const getServiceProgress = () => {
    if (!vehicle) return {};
    
    return {
      oil: {
        lastServiceMileage: vehicle.oilServiceMileage || 0,
        interval: 5000,
        current: vehicle.oilServiceMileage || 0,
        next: (vehicle.oilServiceMileage || 0) + 5000,
        icon: 'water-outline',
        color: '#E74C3C',
        title: 'Oil Service',
        unit: 'km'
      },
      fullService: {
        lastServiceMileage: vehicle.fullServiceMileage || 0,
        interval: 10000,
        current: vehicle.fullServiceMileage || 0,
        next: (vehicle.fullServiceMileage || 0) + 10000,
        icon: 'construct-outline',
        color: '#4ECDC4',
        title: 'Full Service',
        unit: 'km'
      },
      tyre: {
        lastServiceMileage: vehicle.tyreChangeMileage || 0,
        interval: 40000,
        current: vehicle.tyreChangeMileage || 0,
        next: (vehicle.tyreChangeMileage || 0) + 40000,
        icon: 'ellipse-outline',
        color: '#45B7D1',
        title: 'Tyre Change',
        unit: 'km'
      },
      brakeOil: {
        lastDate: vehicle.brakeOilDate ? new Date(vehicle.brakeOilDate) : new Date(),
        nextDate: vehicle.brakeOilDate ? 
          new Date(new Date(vehicle.brakeOilDate).setFullYear(new Date(vehicle.brakeOilDate).getFullYear() + 2)) : 
          new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
        interval: 24, // months
        icon: 'disc-outline',
        color: '#F39C12',
        title: 'Brake Oil',
        unit: 'months'
      },
      battery: {
        lastDate: vehicle.batteryCheckDate ? new Date(vehicle.batteryCheckDate) : new Date(),
        nextDate: vehicle.batteryCheckDate ? 
          new Date(new Date(vehicle.batteryCheckDate).setMonth(new Date(vehicle.batteryCheckDate).getMonth() + 6)) : 
          new Date(new Date().setMonth(new Date().getMonth() + 6)),
        interval: 6, // months
        icon: 'battery-charging-outline',
        color: '#9B59B6',
        title: 'Battery Check',
        unit: 'months'
      }
    };
  };

  const calculateMileageProgress = (current, next, currentMileage) => {
    if (!current || !currentMileage) return 0;
    const progress = (currentMileage - current) / (next - current);
    return Math.min(Math.max(progress, 0), 1);
  };

  const calculateDateProgress = (lastDate, nextDate) => {
    const now = new Date();
    const total = nextDate.getTime() - lastDate.getTime();
    const elapsed = now.getTime() - lastDate.getTime();
    const progress = elapsed / total;
    return Math.min(Math.max(progress, 0), 1);
  };

  const getProgressColor = (progress) => {
    if (progress < 0.5) return '#4CAF50'; // Green
    if (progress < 0.8) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getStatusText = (progress) => {
    if (progress < 0.5) return 'Good';
    if (progress < 0.8) return 'Due Soon';
    return 'Overdue';
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchVehicleData();
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading service data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle" size={64} color={theme.textMuted} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Vehicle data not found
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const serviceData = getServiceProgress();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary + '20', theme.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Service Progress
          </Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
            <Ionicons name="refresh" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleName, { color: theme.text }]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={[styles.currentMileage, { color: theme.textMuted }]}>
            Current: {currentMileage.toLocaleString()} km
          </Text>
          
          {/* Edit Vehicle Button */}
          <TouchableOpacity 
            style={[styles.editVehicleButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
            onPress={() => router.push({
              pathname: '/tabs/service_records/service_input',
              params: { vehicleId: vehicleId }
            })}
          >
            <Ionicons name="pencil" size={16} color={theme.primary} />
            <Text style={[styles.editVehicleText, { color: theme.primary }]}>Edit Vehicle Record</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Mileage-Based Services */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mileage-Based Services</Text>
          
          {/* Oil Service */}
          <ServiceProgressCard
            data={serviceData.oil}
            progress={calculateMileageProgress(serviceData.oil.lastServiceMileage, serviceData.oil.next, currentMileage)}
            animatedValue={animatedValues.oil}
            currentValue={currentMileage}
            theme={theme}
            isMileage={true}
            onMarkDone={markOilServiceDone}
          />

          {/* Full Service */}
          <ServiceProgressCard
            data={serviceData.fullService}
            progress={calculateMileageProgress(serviceData.fullService.lastServiceMileage, serviceData.fullService.next, currentMileage)}
            animatedValue={animatedValues.fullService}
            currentValue={currentMileage}
            theme={theme}
            isMileage={true}
            onMarkDone={markFullServiceDone}
          />

          {/* Tyre Change */}
          <ServiceProgressCard
            data={serviceData.tyre}
            progress={calculateMileageProgress(serviceData.tyre.lastServiceMileage, serviceData.tyre.next, currentMileage)}
            animatedValue={animatedValues.tyre}
            currentValue={currentMileage}
            theme={theme}
            isMileage={true}
            onMarkDone={markTyreChangeDone}
          />
        </View>

        {/* Date-Based Services */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Date-Based Services</Text>
          
          {/* Brake Oil */}
          <ServiceProgressCard
            data={serviceData.brakeOil}
            progress={calculateDateProgress(serviceData.brakeOil.lastDate, serviceData.brakeOil.nextDate)}
            animatedValue={animatedValues.brakeOil}
            theme={theme}
            isMileage={false}
            onMarkDone={markBrakeOilDone}
          />

          {/* Battery Check */}
          <ServiceProgressCard
            data={serviceData.battery}
            progress={calculateDateProgress(serviceData.battery.lastDate, serviceData.battery.nextDate)}
            animatedValue={animatedValues.battery}
            theme={theme}
            isMileage={false}
            onMarkDone={markBatteryCheckDone}
          />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ServiceProgressCard = ({ data, progress, animatedValue, currentValue, theme, isMileage, onMarkDone }) => {
  const progressColor = progress < 0.5 ? '#4CAF50' : progress < 0.8 ? '#FF9800' : '#F44336';
  const statusText = progress < 0.5 ? 'Good' : progress < 0.8 ? 'Due Soon' : 'Overdue';

  return (
    <View style={[styles.progressCard, { backgroundColor: theme.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: data.color + '20' }]}>
            <Ionicons name={data.icon} size={24} color={data.color} />
          </View>
          <View style={styles.titleInfo}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{data.title}</Text>
            <Text style={[styles.statusText, { color: progressColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <View style={styles.progressInfo}>
          <TouchableOpacity 
            style={[styles.doneButton, { backgroundColor: progressColor }]}
            onPress={onMarkDone}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: theme.textMuted + '20' }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: progressColor,
                width: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${progress * 100}%`],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.serviceDetails}>
        {isMileage ? (
          <>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Last Service</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {data.current.toLocaleString()} km
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Next Due</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {data.next.toLocaleString()} km
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Remaining</Text>
              <Text style={[styles.detailValue, { color: progressColor }]}>
                {Math.max(0, data.next - currentValue).toLocaleString()} km
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Last Service</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {data.lastDate.toLocaleDateString('en-GB')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Next Due</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {data.nextDate.toLocaleDateString('en-GB')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                {progress >= 1 ? 'Overdue by' : 'Time left'}
              </Text>
              <Text style={[styles.detailValue, { color: progressColor }]}>
                {progress >= 1 
                  ? `${Math.round((progress - 1) * data.interval)} ${data.unit}`
                  : `${Math.round((1 - progress) * data.interval)} ${data.unit}`
                }
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

// ... (keep all the existing styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  vehicleInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  currentMileage: {
    fontSize: 14,
    fontWeight: '500',
  },
  editVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  editVehicleText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    paddingLeft: 5,
  },
  progressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceOngoing;