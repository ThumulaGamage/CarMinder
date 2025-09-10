import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../../../../config/firebaseConfig';
import { supabase } from '../../../../config/supabaseConfig';
import useTheme from '../../../../Theme/theme';

const getVehicleIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'car': return 'car-sport';
    case 'motorcycle':
    case 'bike': return 'bicycle';
    case 'truck': return 'car-outline';
    case 'bus': return 'bus';
    default: return 'car';
  }
};

const VehicleDetailScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  
  const selectedVehicleId = params.id;

  useEffect(() => {
    if (!selectedVehicleId) {
      setLoading(false);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setLoading(false);
          return;
        }

        const vehicleDocRef = doc(db, 'users', userId, 'vehicles', selectedVehicleId);
        const docSnap = await getDoc(vehicleDocRef);

        if (docSnap.exists()) {
          setVehicle({ id: docSnap.id, ...docSnap.data() });
        } else {
          setVehicle(null);
        }
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [selectedVehicleId]);

  // Image picker functions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to set your vehicle image.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    setImagePickerVisible(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [16, 9], // Better for vehicle photos
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadVehicleImage(result.assets[0].uri);
    }
  };

  const pickImageFromGallery = async () => {
    setImagePickerVisible(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [16, 9], // Better for vehicle photos
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadVehicleImage(result.assets[0].uri);
    }
  };

  const uploadVehicleImage = async (uri) => {
    const userId = auth.currentUser?.uid;
    if (!userId || !vehicle) {
      Alert.alert('Error', 'User not authenticated or vehicle not found');
      return;
    }

    setUploading(true);
    console.log('Starting vehicle image upload process...');
    console.log('Image URI:', uri);
    console.log('Vehicle ID:', vehicle.id);

    try {
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error('Cannot connect to Supabase:', bucketsError);
        throw new Error('Cannot connect to storage service');
      }

      // Check if Vehicle Images bucket exists (you'll need to create this bucket)
      const vehicleBucket = buckets?.find(b => b.name === 'Vehicle');
      if (!vehicleBucket) {
        throw new Error('Vehicle Images bucket not found. Please create it in Supabase.');
      }

      // Compress and resize image
      console.log('Compressing vehicle image...');
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800, height: 450 } }], // 16:9 aspect ratio
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      // Create unique filename
      const fileName = `vehicle_${userId}_${vehicle.id}_${Date.now()}.jpg`;
      console.log('Filename:', fileName);

      // Convert to ArrayBuffer
      console.log('Converting to ArrayBuffer...');
      const response = await fetch(manipulatedImage.uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // Delete old vehicle image if exists
      if (vehicle.imageUrl) {
        try {
          console.log('Attempting to delete old vehicle image...');
          const urlParts = vehicle.imageUrl.split('/');
          const oldFileName = urlParts[urlParts.length - 1].split('?')[0];
          
          if (oldFileName && oldFileName.startsWith('vehicle_')) {
            const { error: deleteError } = await supabase.storage
              .from('Vehicle')
              .remove([oldFileName]);
            
            if (deleteError) {
              console.warn('Could not delete old vehicle image:', deleteError);
            } else {
              console.log('Old vehicle image deleted successfully');
            }
          }
        } catch (deleteError) {
          console.warn('Error deleting old vehicle image:', deleteError);
        }
      }

      // Upload using ArrayBuffer
      console.log('Uploading vehicle image to Supabase...');
      const { data, error } = await supabase.storage
        .from('Vehicle')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error details:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Vehicle')
        .getPublicUrl(fileName);

      console.log('Vehicle image public URL:', publicUrl);

      // Update Firebase vehicle document
      console.log('Updating Firebase vehicle document...');
      const vehicleDocRef = doc(db, 'users', userId, 'vehicles', vehicle.id);
      await updateDoc(vehicleDocRef, {
        imageUrl: publicUrl,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setVehicle(prev => ({ ...prev, imageUrl: publicUrl }));

      Alert.alert('Success', 'Vehicle image updated successfully!');
    } catch (error) {
      console.error('Full error details:', error);
      
      // Error handling similar to profile picture
      if (error.message?.includes('Network request failed')) {
        Alert.alert(
          'Network Error', 
          'Cannot connect to storage service. Please check your internet connection and try again.'
        );
      } else if (error.message?.includes('bucket not found')) {
        Alert.alert(
          'Configuration Error', 
          'Vehicle storage bucket not found. Please contact support.'
        );
      } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        Alert.alert(
          'Permission Error', 
          'You don\'t have permission to upload images. Please contact support.'
        );
      } else if (error.message?.includes('fetch image')) {
        Alert.alert(
          'Image Error', 
          'Could not process the selected image. Please try a different image.'
        );
      } else {
        Alert.alert(
          'Upload Error', 
          `Failed to update vehicle image: ${error.message}`
        );
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/options/edit_specifications',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleUpdateMileage = () => {
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/options/mileage_update',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleServiceRecords = () => {
    console.log('Navigating to Service Records with vehicle ID:', vehicle.id);
    router.push({
      pathname: '/tabs/vehicle/${vehicle.id}/service_records/service_ongoing',
      params: { vehicleId: selectedVehicleId }
    });
  };

  const handleDocuments = () => {
    console.log('Navigating to Documents with vehicle ID:', vehicle.id);
    router.push(`/tabs/vehicle/${vehicle.id}/Vehicle Documents`);
  };

  // Image Picker Modal
  const ImagePickerModal = () => (
    <Modal
      visible={imagePickerVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setImagePickerVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setImagePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Choose Vehicle Image
            </Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickImageFromCamera}
            >
              <Ionicons name="camera" size={24} color={theme.primary} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Take Photo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images" size={24} color={theme.primary} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>
                Choose from Gallery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setImagePickerVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.textMuted} />
              <Text style={[styles.modalOptionText, { color: theme.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedVehicleId || !vehicle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle" size={64} color={theme.textMuted} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {!selectedVehicleId ? 'No vehicle selected.' : 'Vehicle not found.'}
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Vehicle Image/Icon Section */}
      <LinearGradient
        colors={[theme.primary + '20', theme.background]}
        style={styles.vehicleHeader}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('../../../homepage')} style={styles.headerButton}>
            <Ionicons name="home" size={24} color='#FFFFFF' />
          </TouchableOpacity>
          <Text style={[styles.headerTitle1, { color: theme.text }]}>
            Vehicle Details
          </Text>
        </View>
        
        {/* Vehicle Image Container with Camera Button */}
        <View style={styles.vehicleImageContainer}>
          {vehicle.imageUrl ? (
            <Image
              source={{ uri: vehicle.imageUrl }}
              style={styles.vehicleImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons
                name={getVehicleIcon(vehicle.type)}
                size={80}
                color={theme.primary}
              />
            </View>
          )}
          
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.cameraButton, { backgroundColor: theme.primary }]}
            onPress={() => setImagePickerVisible(true)}
            disabled={uploading}
          >
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={[styles.modelName, { color: theme.text }]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={[styles.modelType, { color: theme.textMuted }]}>
            {vehicle.type} • {vehicle.plate}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Details Section with Edit Button */}
        <View style={[styles.detailsSection, { backgroundColor: theme.card }]}>
          {/* Section Header with Edit Button */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Specifications</Text>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: theme.primary + '20' }]}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={16} color={theme.primary} />
              <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsGrid}>
            <InfoItem label="Color" value={vehicle.color} theme={theme} />
            <InfoItem label="Fuel Type" value={vehicle.fuelType} theme={theme} />
            <InfoItem label="Engine" value={vehicle.engineCapacity} theme={theme} />
            <InfoItem label="Chassis No." value={vehicle.chassisNumber} theme={theme} />
            <InfoItem label="Registered" value={vehicle.registerYear} theme={theme} />
            <InfoItem label="Manufactured" value={vehicle.manufactureYear} theme={theme} />
            <InfoItem label="Condition" value={vehicle.condition} theme={theme} />
            <InfoItem label="Mileage" value={vehicle.mileage ? `${vehicle.mileage} km` : null} theme={theme} />
          </View>
        </View>

        {/* Update Mileage Button */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.updateMileageButton, { backgroundColor: theme.primary }]}
            onPress={handleUpdateMileage}
          >
            <Ionicons name="speedometer" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Update Mileage</Text>
          </TouchableOpacity>
        </View>

        {/* Service Records and Documents Buttons */}
        <View style={[styles.buttonsSection, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[styles.squareActionButton, { backgroundColor: theme.primary }]}
            onPress={handleServiceRecords}
          >
            <Ionicons name="construct-outline" size={24} color="white" />
            <Text style={styles.squareActionButtonText}>Service Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.squareActionButton, { backgroundColor: theme.primary }]}
            onPress={handleDocuments}
          >
            <Ionicons name="document-text-outline" size={24} color="white" />
            <Text style={styles.squareActionButtonText}>Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Additional space at bottom */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Image Picker Modal */}
      <ImagePickerModal />
    </SafeAreaView>
  );
};

const InfoItem = ({ label, value, theme }) => (
  <View style={styles.infoItem}>
    <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
    paddingTop: 1,
  },
  headerButton: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#0088ffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  headerTitle1: {
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  vehicleHeader: {
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  vehicleImageContainer: {
    position: 'relative',
    marginBottom: 15,
    marginTop: 20,
  },
  iconContainer: {
    width: 200,
    height: 150,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    width: 375,
    height: 220,
    borderRadius: 0,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  vehicleInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  modelName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
  },
  modelType: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsSection: {
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginTop: -10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  updateMileageButton: {
    // Specific styles for update mileage button if needed
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 50,
    marginTop: 20,
  },
  squareActionButton: {
    width: 100,
    height: 100,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 10,
  },
  squareActionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalCancel: {
    marginTop: 8,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});

export default VehicleDetailScreen;