import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const TaskItem = ({ task, onComplete, onRemove, onEdit, onMoveUp, onMoveDown }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(task.description);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (newDescription.trim() !== '') {
      onEdit(task.id, newDescription);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewDescription(task.description);
    setIsEditing(false);
  };

  // Editing template
  const editingTemplate = (
    <View style={styles.container}>
      <TextInput
        style={styles.editInput}
        value={newDescription}
        onChangeText={setNewDescription}
        autoFocus
      />
      <View style={styles.editButtonsContainer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleCancel}
        >
          <Text style={styles.editButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleSubmit}
        >
          <Text style={styles.editButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Viewing template
  const viewTemplate = (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.checkbox, task.completed && styles.checkboxChecked]}
        onPress={() => onComplete(!task.completed)}
      />
      <Text style={[
        styles.text, 
        task.completed && styles.textCompleted,
        task.textColor && { color: task.textColor }
      ]}>
        {task.description}
      </Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onMoveUp(task.id)}
        >
          <Text style={styles.actionButtonText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onMoveDown(task.id)}
        >
          <Text style={styles.actionButtonText}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEdit}
        >
          <Text style={styles.actionButtonText}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => onRemove(task.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return isEditing ? editingTemplate : viewTemplate;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffd834',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#ffd834',
  },
  text: {
    flex: 1,
    color: '#ffd834',
    fontFamily: 'Roboto_400Regular',
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: '#A0A0A0',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
  actionButtonText: {
    color: '#ffd834',
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
  },
  removeButton: {
    padding: 5,
    marginLeft: 5,
  },
  removeButtonText: {
    color: '#ffd834',
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
  },
  editInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    color: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 10,
    fontFamily: 'Roboto_400Regular',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#ffd834',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 5,
  },
  editButtonText: {
    color: '#222222',
    fontFamily: 'Roboto_700Bold',
    fontSize: 14,
  }
});

export default TaskItem;
