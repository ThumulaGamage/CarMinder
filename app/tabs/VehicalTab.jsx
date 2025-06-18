import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Add this at the top

import { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constant/Colors';

export default function HomeTab() {
  const [vehicles, setVehicles] = useState([
    { id: '1', name: 'Toyota Prius', plate: 'ABC-1234' },
    { id: '2', name: 'Nissan Leaf', plate: 'XYZ-5678' },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', plate: '' });
  const router = useRouter();


  const handleAddVehicle = () => {
    if (!newVehicle.name || !newVehicle.plate) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setVehicles([
      ...vehicles,
      {
        id: Date.now().toString(),
        name: newVehicle.name,
        plate: newVehicle.plate,
      },
    ]);

    setNewVehicle({ name: '', plate: '' });
    setModalVisible(false);
  };

  const handleDeleteVehicle = (id) => {
    Alert.alert('Delete Vehicle', 'Are you sure you want to delete this vehicle?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setVehicles(vehicles.filter((v) => v.id !== id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vehicles</Text>
      </View>

      {/* Vehicle List */}
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
     <TouchableOpacity
  onPress={() => router.push(`/tabs/vehicle/${item.id}`)} // 👈 Navigate to vehicle tab
  onLongPress={() => handleDeleteVehicle(item.id)}
  style={styles.vehicleCard}
>
  <Text style={styles.vehicleName}>{item.name}</Text>
  <Text style={styles.plate}>Plate No: {item.plate}</Text>
</TouchableOpacity>

        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No vehicles added.</Text>}
      />

      {/* Add Vehicle Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle-outline" size={28} color={Colors.WHITE} />
        <Text style={styles.addButtonText}>Add Vehicle</Text>
      </TouchableOpacity>

      {/* Add Vehicle Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Vehicle</Text>

            <TextInput
              style={styles.input}
              placeholder="Vehicle Name"
              value={newVehicle.name}
              onChangeText={(text) => setNewVehicle((prev) => ({ ...prev, name: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="License Plate"
              value={newVehicle.plate}
              onChangeText={(text) => setNewVehicle((prev) => ({ ...prev, plate: text }))}
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAddVehicle}>
                <Text style={styles.saveButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.WHITE,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.BLUE_DARK,
  },
  vehicleCard: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    margin: 12,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  plate: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 30,
  },
  addButton: {
    backgroundColor: Colors.BLUE_DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    margin: 20,
  },
  addButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: Colors.BLUE_DARK,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
