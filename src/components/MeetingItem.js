import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { firestore } from '../services/firebase';
import TaskItem from './TaskItem';
import SaveToGoogleDrive from './SaveToGoogleDrive';
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

const MeetingItem = ({ meeting, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  
  let [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
  });

  useEffect(() => {
    if (expanded) {
      loadSummariesAndTasks();
    }
  }, [expanded]);

  const loadSummariesAndTasks = async () => {
    setLoading(true);
    try {
      // Fetch summaries with limit
      const summariesSnapshot = await firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('summaries')
        .limit(1) // Only need the latest summary
        .get();
        
      const summariesList = summariesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSummaries(summariesList);
      
      // Fetch tasks with limit
      const tasksSnapshot = await firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .orderBy('createdAt', 'asc')
        .limit(20) // Limit to 20 tasks per meeting
        .get();
        
      const tasksList = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("Tasks loaded:", tasksList.length, tasksList);
      setTasks(tasksList);
    } catch (error) {
      console.error("Error loading meeting details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleTaskComplete = async (taskId, isCompleted) => {
    try {
      await firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(taskId)
        .update({
          completed: isCompleted
        });
        
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: isCompleted } : task
      ));
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleTaskRemove = async (taskId) => {
    try {
      await firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(taskId)
        .delete();

      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error removing task:", error);
    }
  };
  
  const handleTaskEdit = async (taskId, newDescription) => {
    try {
      await firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(taskId)
        .update({
          description: newDescription
        });
        
      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, description: newDescription } : task
      ));
    } catch (error) {
      console.error("Error editing task:", error);
    }
  };
  
  const handleTaskMoveUp = async (taskId) => {
    const currentIndex = tasks.findIndex(task => task.id === taskId);
    if (currentIndex <= 0) return; // Already at the top
    
    try {
      // Swap tasks in the UI
      const newTasks = [...tasks];
      const temp = newTasks[currentIndex];
      newTasks[currentIndex] = newTasks[currentIndex - 1];
      newTasks[currentIndex - 1] = temp;
      
      setTasks(newTasks);
      
      // Update timestamps to reflect new order
      const batch = firestore.batch();
      
      const currentTask = firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(taskId);
        
      const otherTask = firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(newTasks[currentIndex].id);
        
      // Use timestamps for ordering
      const now = new Date();
      batch.update(currentTask, { 
        createdAt: new Date(now.getTime() - 1000).toISOString() 
      });
      batch.update(otherTask, { 
        createdAt: new Date(now.getTime()).toISOString() 
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error moving task up:", error);
      // Reload to restore correct order
      loadSummariesAndTasks();
    }
  };
  
  const handleTaskMoveDown = async (taskId) => {
    const currentIndex = tasks.findIndex(task => task.id === taskId);
    if (currentIndex >= tasks.length - 1) return; // Already at the bottom
    
    try {
      // Swap tasks in the UI
      const newTasks = [...tasks];
      const temp = newTasks[currentIndex];
      newTasks[currentIndex] = newTasks[currentIndex + 1];
      newTasks[currentIndex + 1] = temp;
      
      setTasks(newTasks);
      
      // Update timestamps to reflect new order
      const batch = firestore.batch();
      
      const currentTask = firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(taskId);
        
      const otherTask = firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .doc(newTasks[currentIndex].id);
        
      // Use timestamps for ordering
      const now = new Date();
      batch.update(currentTask, { 
        createdAt: new Date(now.getTime()).toISOString() 
      });
      batch.update(otherTask, { 
        createdAt: new Date(now.getTime() - 1000).toISOString() 
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error moving task down:", error);
      // Reload to restore correct order
      loadSummariesAndTasks();
    }
  };
  
  const handleAddTask = async () => {
    if (newTaskText.trim() === '') return;
    
    try {
      // Add to Firestore
      const taskRef = await firestore
        .collection('meetings')
        .doc(meeting.id)
        .collection('tasks')
        .add({
          description: newTaskText,
          completed: false,
          createdAt: new Date().toISOString()
        });
      
      // Update local state
      const newTask = {
        id: taskRef.id,
        description: newTaskText,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      setTasks([...tasks, newTask]);
      setNewTaskText('');
      setAddingTask(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Meeting",
      "Are you sure you want to delete this meeting? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete && onDelete(meeting.id) }
      ]
    );
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0373fc" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleExpand} style={styles.headerTitle}>
          <Text style={styles.title}>{meeting.title}</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <Text style={styles.date}>{new Date(meeting.date).toLocaleDateString()}</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {expanded && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="small" color="#0373fc" />
          ) : (
            <>
              {/* Summary Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Meeting Summary</Text>
                {summaries.length > 0 ? (
                  <>
                    <Text style={styles.summaryText}>
                      {summaries[0].content}
                    </Text>
                    <SaveToGoogleDrive 
                      meetingId={meeting.id} 
                      summaryId={summaries[0].id} 
                      summary={summaries[0].content} 
                    />
                  </>
                ) : (
                  <Text style={styles.emptyText}>No summary available</Text>
                )}
              </View>
              
              {/* Tasks Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tasks</Text>
                  <TouchableOpacity 
                    style={styles.addTaskButton}
                    onPress={() => setAddingTask(true)}
                  >
                    <Text style={styles.addTaskButtonText}>+ Add Task</Text>
                  </TouchableOpacity>
                </View>
                
                {addingTask && (
                  <View style={styles.addTaskContainer}>
                    <TextInput
                      style={styles.addTaskInput}
                      value={newTaskText}
                      onChangeText={setNewTaskText}
                      placeholder="Enter new task..."
                      placeholderTextColor="#A0A0A0"
                      autoFocus
                    />
                    <View style={styles.addTaskActions}>
                      <TouchableOpacity 
                        style={[styles.addTaskAction, styles.cancelButton]}
                        onPress={() => {
                          setAddingTask(false);
                          setNewTaskText('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.addTaskAction, styles.saveButton]}
                        onPress={handleAddTask}
                      >
                        <Text style={styles.saveButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <TaskItem 
                      key={task.id}
                      task={{...task, textColor: '#E0E0E0'}}
                      onComplete={(isCompleted) => handleTaskComplete(task.id, isCompleted)}
                      onRemove={() => handleTaskRemove(task.id)}
                      onEdit={(taskId, newDescription) => handleTaskEdit(taskId, newDescription)}
                      onMoveUp={() => handleTaskMoveUp(task.id)}
                      onMoveDown={() => handleTaskMoveDown(task.id)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No tasks remaining</Text>
                )}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffd834',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffd834',
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#222222',
  },
  date: {
    color: '#FFFFFF',
    marginRight: 10,
    fontFamily: 'Roboto_400Regular',
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '222222',
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
  },
  content: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffd834',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  summaryText: {
    lineHeight: 20,
    marginBottom: 10,
    color: '#E0E0E0',
    fontFamily: 'Roboto_400Regular',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#E0E0E0',
    fontFamily: 'Roboto_400Regular',
  },
  addTaskButton: {
    backgroundColor: '#ffd834',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  addTaskButtonText: {
    color: '#222222',
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
  },
  addTaskContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addTaskInput: {
    backgroundColor: '#333',
    borderRadius: 4,
    padding: 10,
    color: '#FFFFFF',
    fontFamily: 'Roboto_400Regular',
    marginBottom: 10,
  },
  addTaskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addTaskAction: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#A0A0A0',
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
  },
  saveButton: {
    backgroundColor: '#ffd834',
  },
  saveButtonText: {
    color: '#222222',
    fontSize: 14,
    fontFamily: 'Roboto_700Bold',
  },
});

export default MeetingItem;
