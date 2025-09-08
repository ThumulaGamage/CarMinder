import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { db } from '../../config/firebaseConfig';
import { useUser } from '../../context/UserDetailContext';
import useTheme from '../../Theme/theme';

import * as ImageManipulator from 'expo-image-manipulator';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import { supabase } from '../../config/supabaseConfig';

const { width, height } = Dimensions.get('window');

export default function UserTab() {
  const { user, userDetails, logout, refreshUserDetails } = useUser();
  const router = useRouter();
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/tabs/EditData');
  };

  const getInitials = () => {
    if (!userDetails?.name) return user?.email?.charAt(0).toUpperCase() || '?';
    const names = userDetails.name.split(' ');
    return names.map(name => name[0]).join('').toUpperCase().substring(0, 2);
  };

  // Image picker functions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to set your profile picture.',
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
    mediaTypes: 'Images', // Change this line
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    uploadImage(result.assets[0].uri);
  }
};

const pickImageFromGallery = async () => {
  setImagePickerVisible(false);
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'Images', // Change this line
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    uploadImage(result.assets[0].uri);
  }
};
const uploadImage = async (uri) => {
  if (!user?.uid) {
    Alert.alert('Error', 'User not authenticated');
    return;
  }

  setUploading(true);
  console.log('Starting upload process...');
  console.log('Image URI:', uri);
  console.log('User UID:', user.uid);

  try {
    // Test Supabase connection first
    console.log('Testing Supabase connection...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Cannot connect to Supabase:', bucketsError);
      throw new Error('Cannot connect to storage service');
    }
    console.log('Supabase connection OK, buckets:', buckets?.map(b => b.name));

    // Check if our bucket exists
    const profileBucket = buckets?.find(b => b.name === 'Profile Picture');
    if (!profileBucket) {
      throw new Error('Profile Picture bucket not found');
    }

    // Compress and resize image
    console.log('Compressing image...');
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400, height: 400 } }],
      { 
        compress: 0.8, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    console.log('Image compressed:', manipulatedImage.uri);

    // Create unique filename
    const fileName = `profile_${user.uid}_${Date.now()}.jpg`;
    console.log('Filename:', fileName);

    // Convert to ArrayBuffer (more reliable than blob in React Native)
    console.log('Converting to ArrayBuffer...');
    const response = await fetch(manipulatedImage.uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);

    // Delete old profile picture if exists
    if (userDetails?.profilePicture) {
      try {
        console.log('Attempting to delete old image...');
        const urlParts = userDetails.profilePicture.split('/');
        const oldFileName = urlParts[urlParts.length - 1].split('?')[0];
        
        if (oldFileName && oldFileName.startsWith('profile_')) {
          const { error: deleteError } = await supabase.storage
            .from('Profile Picture')
            .remove([oldFileName]);
          
          if (deleteError) {
            console.warn('Could not delete old image:', deleteError);
          } else {
            console.log('Old image deleted successfully');
          }
        }
      } catch (deleteError) {
        console.warn('Error deleting old image:', deleteError);
      }
    }

    // Upload using ArrayBuffer
    console.log('Uploading to Supabase...');
    const { data, error } = await supabase.storage
      .from('Profile Picture')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error details:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error
      });
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('Profile Picture')
      .getPublicUrl(fileName);

    console.log('Public URL:', publicUrl);

    // Verify the URL is accessible
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('Uploaded image may not be accessible:', testResponse.status);
      }
    } catch (urlError) {
      console.warn('Could not verify image URL:', urlError);
    }

    // Update Firebase user document
    console.log('Updating Firebase document...');
    await db.collection('users').doc(user.uid).update({
      profilePicture: publicUrl,
      updatedAt: new Date().toISOString(),
    });

    await refreshUserDetails();
    Alert.alert('Success', 'Profile picture updated successfully!');
  } catch (error) {
    console.error('Full error details:', error);
    
    // More specific error handling
    if (error.message?.includes('Network request failed')) {
      Alert.alert(
        'Network Error', 
        'Cannot connect to storage service. Please check your internet connection and try again.'
      );
    } else if (error.message?.includes('bucket not found')) {
      Alert.alert(
        'Configuration Error', 
        'Storage bucket not found. Please contact support.'
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
        `Failed to update profile picture: ${error.message}`
      );
    }
  } finally {
    setUploading(false);
  }
};

  const ProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileImageContainer}>
        {userDetails?.profilePicture ? (
          <Image 
            source={{ uri: userDetails.profilePicture }} 
            style={styles.profileImage}
          />
        ) : (
          <View style={[styles.profileIcon, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.profileInitials}>{getInitials()}</ThemedText>
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

      <ThemedText style={[styles.userName, { color: theme.text }]}>
        {userDetails?.name || 'User'}
      </ThemedText>
      <ThemedText style={[styles.userEmail, { color: theme.textMuted }]}>
        {user?.email || 'email@example.com'}
      </ThemedText>
    </View>
  );

  const InfoCard = ({ title, children }) => (
    <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
      <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{title}</ThemedText>
      {children}
    </View>
  );

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={20} color={theme.primary} />
        <ThemedText style={[styles.infoLabel, { color: theme.text }]}>{label}</ThemedText>
      </View>
      <View style={styles.infoRowRight}>
        <ThemedText style={[styles.infoValue, { color: theme.textMuted }]}>{value}</ThemedText>
      </View>
    </View>
  );

  const ActionButton = ({ icon, title, onPress, color, textColor = '#fff' }) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color={textColor} />
      <ThemedText style={[styles.actionButtonText, { color: textColor }]}>{title}</ThemedText>
    </TouchableOpacity>
  );

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
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              Choose Profile Picture
            </ThemedText>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickImageFromCamera}
            >
              <Ionicons name="camera" size={24} color={theme.primary} />
              <ThemedText style={[styles.modalOptionText, { color: theme.text }]}>
                Take Photo
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images" size={24} color={theme.primary} />
              <ThemedText style={[styles.modalOptionText, { color: theme.text }]}>
                Choose from Gallery
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setImagePickerVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.textMuted} />
              <ThemedText style={[styles.modalOptionText, { color: theme.textMuted }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
    <View
  style={[
    styles.header,
    {
      backgroundColor: theme.background,
      borderBottomColor: theme.border,
      paddingVertical: 16, // space inside the header
      paddingHorizontal: 20, // left & right padding
      marginTop: 30, // pushes it down a bit
    },
  ]}
>
  <ThemedText
    style={[
      styles.headerTitle,
      { color: theme.text },
    ]}
  >
    My Profile
  </ThemedText>
</View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Section */}
          <ProfileSection />

          {/* Account Information - Read Only */}
          <InfoCard title="Account Information">
            <InfoRow
              icon="person-outline"
              label="Full Name"
              value={userDetails?.name || 'Not provided'}
            />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user?.email || 'N/A'}
            />
            <InfoRow
              icon="calendar-outline"
              label="Member Since"
              value={userDetails?.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : 'Unknown'}
            />

                 <View style={[styles.bottomActions, { 
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        }]}>
          <ActionButton
            icon="create-outline"
            title="Edit Profile"
            onPress={handleEditProfile}
            color={theme.primary}
          />
       
        </View>   
          </InfoCard>
              
                <View style={[styles.bottomActions, { 
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        }]}>
         <ActionButton
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleLogout}
            color="#EF4444"
          />
       
        </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <ThemedText style={[styles.versionText, { color: theme.textMuted }]}>
              CarMinder v1.0.0
            </ThemedText>
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
       

        {/* Image Picker Modal */}
        <ImagePickerModal />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 25,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 48,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    marginRight: 8,
    flexShrink: 1,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
  },
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 25 : 15,
    borderTopWidth: 0.5,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
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