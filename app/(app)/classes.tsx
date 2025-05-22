import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { config, database, storage } from "@/lib/appwrite";
import icons from "@/constants/icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ID, Query } from "react-native-appwrite";
import { Ionicons } from "@expo/vector-icons";

const ClassCard = ({
  title,
  description,
  image,
  code,
  days,
  time,
  onPress,
}) => (
  <TouchableOpacity
    className="bg-white m-2 rounded-2xl border border-slate-200 mx-5"
    onPress={onPress}
  >
    <View className="relative">
      <Image
        source={{
          uri: "https://www.gstatic.com/classroom/themes/img_reachout.jpg",
        }}
        className="absolute top-0 left-0 right-0 w-full h-full rounded-t-xl"
      />
      <View className="z-10 px-4 py-6">
        <Text className="text-4xl font-rubik-bold mb-2 text-white">
          {title}
        </Text>

        <Text className="text-lg mb-1 text-white">Code: {code}</Text>
        <Text className="text-lg mb-1 text-white">Time: {time}</Text>
        <Text className="text-lg text-white">{days}</Text>
      </View>
    </View>
    <View className="p-3 flex flex-row justify-between items-center">
      <Text>View Class</Text>
      <Image source={icons.rightArrow} className="size-5" />
    </View>
  </TouchableOpacity>
);

const Classes = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [enrolledClass, setEnrolledClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [isAddClassModalVisible, setIsAddClassModalVisible] = useState(false);
  const [isEnrollClassModalVisible, setIsEnrollClassModalVisible] =
    useState(false);
  const [classCode, setClassCode] = useState("");

  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    code: "",
    days: "",
    time: "",
    faculty: "",
  });
  const [facultyList, setFacultyList] = useState([]);
  const { user, role } = useAuth();

  const navigation = useNavigation();

  const [assignments, setAssignments] = useState([]);
  const [isAssignmentModalVisible, setIsAssignmentModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submission, setSubmission] = useState("");

  const [isAddAssignmentModalVisible, setIsAddAssignmentModalVisible] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    classId: "",
  });

  // Add these to your existing state declarations
  const [isEditAssignmentModalVisible, setIsEditAssignmentModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  useEffect(() => {
    checkEnrollment();
    fetchFacultyList();
  }, []);

  const checkEnrollment = async () => {
    try {
      const response = await database.listDocuments(
        config.db,
        config.classesCollectionId
      );
      console.log(response);

      const enrolledClass = response.documents.find((classItem) =>
        classItem.students.includes(user.$id)
      );

      if (enrolledClass) {
        setEnrolledClass(enrolledClass);
        fetchModules(enrolledClass.modules);
      } else {
        if (role === "faculty") {
          const facultyClasses = response.documents.filter(
            (classItem) => classItem.faculty === user.$id
          );
          setClasses(facultyClasses);
        } else {
          setClasses(response.documents);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchModules = async (moduleIds) => {
    try {
      const moduleFiles = await Promise.all(
        moduleIds.map(async (moduleId) => {
          const file = await storage.getFile(config.modulesBucket, moduleId);
          return file;
        })
      );
      setModules(moduleFiles);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const response = await database.listDocuments(
        config.db,
        config.facultiesCollectionId
      );

      setFacultyList(response.documents);
      console.log("Faculties:", response.documents);
    } catch (error) {
      console.error("Fetch Faculty", error);
    }
  };

  const handleClassPress = (classItem) => {
    setSelectedClass(classItem);
    if (role === "student") {
      setIsModalVisible(true);
    } else {
      console.log(classItem);

      setEnrolledClass(classItem);
      fetchModules(classItem.modules);
    }
  };

  const handleEnrollPress = async () => {
    if (!classCode.trim()) {
      Alert.alert("Error", "Please enter a class code");
      return;
    }

    setLoading(true);
    try {
      // Find class with matching code
      const response = await database.listDocuments(
        config.db,
        config.classesCollectionId,
        [Query.equal("code", classCode)]
      );

      if (response.documents.length === 0) {
        Alert.alert("Error", "Invalid class code");
        return;
      }

      const classItem = response.documents[0];

      // Check if already enrolled
      if (classItem.students.includes(user.$id)) {
        Alert.alert("Error", "You are already enrolled in this class");
        return;
      }

      // Add student to class
      const updatedStudents = [...classItem.students, user.$id];
      await database.updateDocument(
        config.db,
        config.classesCollectionId,
        classItem.$id,
        { students: updatedStudents }
      );

      // Update local state
      setEnrolledClass(classItem);
      fetchModules(classItem.modules);

      Alert.alert("Success", "Successfully enrolled in class");
      setClassCode("");
      setIsEnrollClassModalVisible(false);
    } catch (error) {
      console.error("Enroll error:", error);
      Alert.alert("Error", "Failed to enroll in class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    setDownloading(true);
    try {
      const fileUrl = storage.getFileDownload(config.modulesBucket, fileId);
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl.href,
        FileSystem.documentDirectory + fileName
      );

      const { uri } = await downloadResumable.downloadAsync();
      await Sharing.shareAsync(uri);
      Alert.alert("Success", "File downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        "There was an error downloading the file. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleDropClass = async () => {
    setLoading(true);
    try {
      // Get the current class document
      const document = await database.getDocument(
        config.db,
        config.classesCollectionId,
        enrolledClass.$id
      );

      // Remove the current user from the students array
      const updatedStudents = document.students.filter(
        (studentId) => studentId !== user.$id
      );

      // Update the class document with the new students array
      await database.updateDocument(
        config.db,
        config.classesCollectionId,
        enrolledClass.$id,
        { students: updatedStudents }
      );

      // Clear local state
      setEnrolledClass(null);
      setModules([]);

      // Add the class back to available classes
      setClasses((prevClasses) => [...prevClasses, document]);

      // Show success message
      Alert.alert("Success", "You have successfully dropped the class");
    } catch (error) {
      console.error("Drop class error:", error);
      Alert.alert("Error", "Failed to drop class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async () => {
    try {
      // Step 1: Pick the document
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        copyToCacheDirectory: true, // This ensures the file is accessible
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      // Step 2: Convert file to base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Step 3: Create a FormData instance
      // Step 4: Upload to Appwrite
      const fileId = ID.unique();

      const uploadResponse = await storage.createFile(
        "67b9e53c000c0291cb9c",
        fileId,
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
          size: selectedFile.size,
        }
      );

      // Step 5: Update the class document with the new module
      if (uploadResponse) {
        const updatedModules = [...enrolledClass.modules, fileId];
        await database.updateDocument(
          config.db,
          config.classesCollectionId,
          enrolledClass.$id,
          { modules: updatedModules }
        );

        // Step 6: Refresh the modules list
        fetchModules(updatedModules);
        Alert.alert("Success", "Module uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        "There was an error uploading the file. Please try again."
      );
    }
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      // Show confirmation dialog
      Alert.alert(
        "Delete Module",
        "Are you sure you want to delete this module?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                // Step 1: Delete file from storage
                await storage.deleteFile(config.modulesBucket, moduleId);

                // Step 2: Update class document to remove module ID
                const updatedModules = enrolledClass.modules.filter(
                  (id) => id !== moduleId
                );
                await database.updateDocument(
                  config.db,
                  config.classesCollectionId,
                  enrolledClass.$id,
                  { modules: updatedModules }
                );

                // Step 3: Refresh modules list
                fetchModules(updatedModules);
                Alert.alert("Success", "Module deleted successfully");
              } catch (error) {
                console.error("Delete error:", error);
                Alert.alert(
                  "Delete Failed",
                  "There was an error deleting the module. Please try again."
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Delete module error:", error);
      Alert.alert(
        "Error",
        "There was an error processing your request. Please try again."
      );
    }
  };

  const handleEditClass = async (classItem) => {
    try {
      // Set up the class data for editing
      setNewClass({
        name: classItem.name,
        description: classItem.description,
        days: classItem.days,
        time: classItem.time,
        faculty: classItem.faculty,
      });

      // Show the modal for editing
      setIsAddClassModalVisible(true);

      // Update the class document
      const updatedClass = await database.updateDocument(
        config.db,
        config.classesCollectionId,
        classItem.$id,
        {
          name: newClass.name,
          description: newClass.description,
          days: newClass.days,
          time: newClass.time,
          faculty: newClass.faculty,
        }
      );

      // Update the local state
      setEnrolledClass(updatedClass);

      // Close the modal
      setIsAddClassModalVisible(false);

      Alert.alert("Success", "Class updated successfully");
    } catch (error) {
      console.error("Edit class error:", error);
      Alert.alert("Error", "Failed to update class. Please try again.");
    }
  };

  const handleDeleteClass = async (classId) => {
    Alert.alert(
      "Delete Class",
      "Are you sure you want to delete this class? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Delete all modules associated with the class
              if (enrolledClass.modules.length > 0) {
                await Promise.all(
                  enrolledClass.modules.map(async (moduleId) => {
                    try {
                      await storage.deleteFile(config.modulesBucket, moduleId);
                    } catch (error) {
                      console.error("Error deleting module:", error);
                    }
                  })
                );
              }

              // Delete the class document
              await database.deleteDocument(
                config.db,
                config.classesCollectionId,
                classId
              );

              // Update local state
              setEnrolledClass(null);
              setModules([]);

              // Refresh the classes list
              checkEnrollment();

              Alert.alert("Success", "Class deleted successfully");
            } catch (error) {
              console.error("Delete class error:", error);
              Alert.alert("Error", "Failed to delete class. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Modify the Add Class Modal to handle both adding and editing
  const handleAddOrUpdateClass = async () => {
    setLoading(true);
    try {
      if (enrolledClass) {
        // Update existing class
        await handleEditClass(enrolledClass);
      } else {
        // Create new class
        await handleAddClass();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the modal title and button text based on whether we're editing or adding
  const modalTitle = enrolledClass ? "Edit Class" : "Add New Class";
  const buttonText = enrolledClass ? "Update Class" : "Add Class";

  const handleAddClass = async () => {
    setLoading(true);
    try {
      const newClassDocument = {
        ...newClass,
        students: [],
        modules: [],
      };

      console.log(newClassDocument);

      await database.createDocument(
        config.db,
        config.classesCollectionId,
        ID.unique(),
        newClassDocument
      );

      setClasses((prevClasses) => [...prevClasses, newClassDocument]);
      setIsAddClassModalVisible(false);
      setNewClass({
        name: "",
        description: "",
        days: "",
        time: "",
        faculty: "",
      });
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchAssignments = async (classId) => {
    try {
      const response = await database.listDocuments(
        config.db,
        config.assignmentsCollectionId,
        [Query.equal("classId", classId)]
      );
      console.log("Assignments:", response.documents);
      
      setAssignments(response.documents);
    } catch (error) {
      console.error("Fetch assignments error:", error);
    }
  };

  useEffect(() => {
    if (enrolledClass) {
      fetchAssignments(enrolledClass.$id);
    }
  }, [enrolledClass]);

  // Add this with your other handler functions
  const handleAddAssignment = async () => {
    try {
      if (!newAssignment.title.trim() || !newAssignment.description.trim()) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        classId: enrolledClass.$id,
        submissions: [],
      };

      await database.createDocument(
        config.db,
        config.assignmentsCollectionId,
        ID.unique(),
        assignmentData
      );

      // Refresh assignments list
      fetchAssignments(enrolledClass.$id);
      setIsAddAssignmentModalVisible(false);
      setNewAssignment({
        title: "",
        description: "",
        classId: "",
      });
      Alert.alert("Success", "Assignment created successfully");
    } catch (error) {
      console.error("Add assignment error:", error);
      Alert.alert("Error", "Failed to create assignment");
    }
  };

  // Add these with your other handler functions
  const handleEditAssignment = async () => {
    try {
      if (!editingAssignment.title.trim() || !editingAssignment.description.trim()) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      await database.updateDocument(
        config.db,
        config.assignmentsCollectionId,
        editingAssignment.$id,
        {
          title: editingAssignment.title,
          description: editingAssignment.description
        }
      );

      fetchAssignments(enrolledClass.$id);
      setIsEditAssignmentModalVisible(false);
      setEditingAssignment(null);
      Alert.alert("Success", "Assignment updated successfully");
    } catch (error) {
      console.error("Edit assignment error:", error);
      Alert.alert("Error", "Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    Alert.alert(
      "Delete Assignment",
      "Are you sure you want to delete this assignment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.deleteDocument(
                config.db,
                config.assignmentsCollectionId,
                assignmentId
              );
              
              fetchAssignments(enrolledClass.$id);
              Alert.alert("Success", "Assignment deleted successfully");
            } catch (error) {
              console.error("Delete assignment error:", error);
              Alert.alert("Error", "Failed to delete assignment");
            }
          }
        }
      ]
    );
  };

  if (
    enrolledClass &&
    (role === "faculty" || role === "admin" || role === "student")
  ) {
    return (
      <SafeAreaView className="flex h-full w-full bg-white relative ">
        <ScrollView>
          {role !== "student" && (
            <View className="pl-4">
              <TouchableOpacity
                onPress={() => setEnrolledClass(null)}
                className="size-10 bg-gray-200 p-2 rounded-full"
              >
                <Image source={icons.backArrow} className="size-6" />
              </TouchableOpacity>
            </View>
          )}

          <View className="p-4">
            <View className="relative">
              <Image
                source={{
                  uri: "https://www.gstatic.com/classroom/themes/img_reachout.jpg",
                }}
                className="absolute top-0 left-0 right-0 w-full h-52 rounded-lg"
              />
              <View className="z-10 px-4 py-6">
                <Text className="text-4xl font-rubik-bold mb-2 text-white">
                  {enrolledClass.name}
                </Text>

                <Text className="text-lg mb-1 text-white">
                  Time: {enrolledClass.time}
                </Text>
                <Text className="text-lg text-white">{enrolledClass.days}</Text>
              </View>
            </View>
          </View>

          <View className="px-4 mt-[40px]">
            <Text className="text-lg text-black-200">
              {enrolledClass.description}
            </Text>
            <View className="flex flex-row justify-between items-center mb-4 mt-[40px]">
              <Text className="text-xl font-rubik-bold">Module & Assignments</Text>
              {role === "faculty" && (
                <TouchableOpacity
                  onPress={handleAddModule}
                  className="px-4 py-2 bg-blue-500 rounded-full"
                >
                  <Text className="text-white text-center font-rubik">
                    Add Module
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={modules}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => (
                <View className="bg-white pl-2 py-4 pr-4 rounded-2xl border border-slate-200 mb-2">
                  <TouchableOpacity
                    onPress={() => handleDownload(item.$id, item.name)}
                    className="flex flex-row gap-2 items-center"
                  >
                    <Image source={icons.file} className="size-14" />
                    <View className="flex-1">
                      <Text className="font-bold text-wrap font-rubik-medium">
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Tap to download
                      </Text>
                    </View>
                    {downloading && (
                      <ActivityIndicator size="small" color="#0000ff" />
                    )}
                  </TouchableOpacity>

                  {role === "faculty" && (
                    <View className="flex flex-row justify-end gap-2 mt-2">
                      <TouchableOpacity
                        onPress={() => handleDeleteModule(item.$id)}
                        className="px-4 py-2 bg-red-500 rounded-full"
                      >
                        <Text className="text-white text-center font-rubik">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />

            {/* Add this after the modules FlatList */}
            <View className="mt-8">
              <View className="flex flex-row justify-between items-center mb-4">
                <Text className="text-xl font-rubik-bold">Assignments</Text>
                {role === "faculty" && (
                  <TouchableOpacity
                    onPress={() => setIsAddAssignmentModalVisible(true)}
                    className="px-4 py-2 bg-blue-500 rounded-full"
                  >
                    <Text className="text-white text-center font-rubik">
                      Add Assignment
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <FlatList
                data={assignments}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedAssignment(item);
                      setIsAssignmentModalVisible(true);
                    }}
                    className="bg-white p-4 rounded-2xl border border-slate-200 mb-2"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-bold text-lg font-rubik-medium">
                          {item.title}
                        </Text>
                        <Text className="text-gray-600 mt-1">
                          {item.description}
                        </Text>
                        {item.fileId && (
                          <TouchableOpacity 
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDownload(item.fileId, 'assignment.pdf');
                            }}
                            className="mt-2"
                          >
                            <Text className="text-blue-500">Download Attachment</Text>
                          </TouchableOpacity>
                        )}
                        {/* Show different status based on role */}
                        {role === "faculty" ? (
                          <Text className="text-gray-500 mt-2">
                            Submissions: {item.submissions?.length || 0}
                          </Text>
                        ) : (
                          <Text className="text-gray-500 mt-2">
                            Status: {item.submissions?.find(s => {
                              const submission = JSON.parse(s);
                              return submission.userId === user.$id;
                            }) ? 'Submitted' : 'Not Submitted'}
                          </Text>
                        )}
                      </View>
                      
                      {role === "faculty" && (
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setEditingAssignment(item);
                              setIsEditAssignmentModalVisible(true);
                            }}
                            className="p-2 bg-gray-100 rounded-full"
                          >
                            <Ionicons name="create-outline" size={20} color="#374151" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(item.$id);
                            }}
                            className="p-2 bg-red-100 rounded-full"
                          >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View className="py-8 items-center">
                    <Text className="text-gray-500">No assignments yet</Text>
                  </View>
                )}
              />
            </View>

            {role === "student" && (
              <View className="mt-8">
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Drop Class",
                      "Are you sure you want to drop this class?",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Drop",
                          style: "destructive",
                          onPress: handleDropClass,
                        },
                      ]
                    );
                  }}
                  className="bg-red-500 px-4 py-2 rounded-full"
                >
                  <Text className="text-white text-center font-rubik">
                    Drop Class
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {role === "admin" && (
              <View className="flex flex-row justify-between mt-4">
                <TouchableOpacity
                  onPress={() => handleEditClass(enrolledClass)}
                  className="px-4 py-2 bg-green-500 rounded-full"
                >
                  <Text className="text-white text-center">Edit Class</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteClass(enrolledClass.$id)}
                  className="px-4 py-2 bg-red-500 rounded-full"
                >
                  <Text className="text-white text-center">Delete Class</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
        <Modal visible={isAssignmentModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96 mx-4">
              {selectedAssignment && (
                <>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-2xl font-bold">{selectedAssignment.title}</Text>
                    <TouchableOpacity onPress={() => setIsAssignmentModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  <Text className="text-gray-600 mb-4">{selectedAssignment.description}</Text>

                  {role === "student" && (
                    <>
                      <Text className="font-bold mb-2">Your Submission:</Text>
                      {selectedAssignment.submissions?.find(s => {
                        const submission = JSON.parse(s);
                        return submission.userId === user.$id;
                      }) ? (
                        <ScrollView className="border border-gray-300 p-4 rounded-lg mb-4 max-h-[400px]">
                          <Text className="text-gray-600">
                            {JSON.parse(selectedAssignment.submissions.find(s => {
                              const submission = JSON.parse(s);
                              return submission.userId === user.$id;
                            })).text}
                          </Text>
                        </ScrollView>
                      ) : (
                        <TextInput
                          multiline
                          numberOfLines={8}
                          placeholder="Enter your answer here. Maximum 5000 characters."
                          value={submission}
                          onChangeText={setSubmission}
                          className="border border-gray-300 p-4 rounded-lg mb-4"
                          textAlignVertical="top"
                          style={{
                            minHeight: 200,
                            maxHeight: 400,
                          }}
                        />
                      )}

                      {!selectedAssignment.submissions?.find(s => {
                        const submission = JSON.parse(s);
                        return submission.userId === user.$id;
                      }) && (
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              // Validate submission length
                              if (!submission.trim()) {
                                Alert.alert("Error", "Please enter your answer before submitting");
                                return;
                              }
                              
                              if (submission.length > 5000) {
                                Alert.alert("Error", "Your answer exceeds the maximum length of 5000 characters");
                                return;
                              }

                              // Convert submission object to string format
                              const submissionString = JSON.stringify({
                                name: user.name,
                                userId: user.$id,
                                text: submission
                              });

                              const updatedSubmissions = [
                                ...(selectedAssignment.submissions || []),
                                submissionString
                              ];
                              
                              await database.updateDocument(
                                config.db,
                                config.assignmentsCollectionId,
                                selectedAssignment.$id,
                                { submissions: updatedSubmissions }
                              );
                              
                              fetchAssignments(enrolledClass.$id);
                              setIsAssignmentModalVisible(false);
                              setSubmission("");
                              Alert.alert("Success", "Assignment submitted successfully");
                            } catch (error) {
                              console.error("Submit error:", error);
                              Alert.alert("Error", "Failed to submit assignment");
                            }
                          }}
                          className="bg-blue-500 px-4 py-2 rounded-full"
                        >
                          <Text className="text-white text-center font-rubik">Submit</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {role === "faculty" && (
                    <>
                      <Text className="font-bold mb-2">Submissions:</Text>
                      {selectedAssignment.submissions?.length > 0 ? (
                        <FlatList
                          data={selectedAssignment.submissions}
                          keyExtractor={(item, index) => index.toString()}
                          renderItem={({ item }) => {
                            const submission = JSON.parse(item);
                            return (
                              <View className="border-b border-gray-200 py-2">
                                <Text className="font-bold">Student: {submission.name}</Text>
                                <Text className="text-gray-500 text-sm">ID: {submission.userId}</Text>
                                <Text className="text-gray-600 mt-1">{submission.text}</Text>
                              </View>
                            );
                          }}
                        />
                      ) : (
                        <Text className="text-gray-500">No submissions yet</Text>
                      )}
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
        <Modal visible={isAddAssignmentModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96 mx-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold">Add Assignment</Text>
                <TouchableOpacity onPress={() => setIsAddAssignmentModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Assignment Title"
                value={newAssignment.title}
                onChangeText={(text) => setNewAssignment({ ...newAssignment, title: text })}
                className="border border-gray-300 p-3 rounded-lg mb-4"
              />

              <TextInput
                placeholder="Assignment Description"
                value={newAssignment.description}
                onChangeText={(text) => setNewAssignment({ ...newAssignment, description: text })}
                className="border border-gray-300 p-3 rounded-lg mb-4"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity
                onPress={handleAddAssignment}
                className="bg-blue-500 px-4 py-2 rounded-full"
              >
                <Text className="text-white text-center font-rubik">Create Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal visible={isEditAssignmentModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96 mx-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-bold">Edit Assignment</Text>
                <TouchableOpacity onPress={() => {
                  setIsEditAssignmentModalVisible(false);
                  setEditingAssignment(null);
                }}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {editingAssignment && (
                <>
                  <TextInput
                    placeholder="Assignment Title"
                    value={editingAssignment.title}
                    onChangeText={(text) => setEditingAssignment({
                      ...editingAssignment,
                      title: text
                    })}
                    className="border border-gray-300 p-3 rounded-lg mb-4"
                  />

                  <TextInput
                    placeholder="Assignment Description"
                    value={editingAssignment.description}
                    onChangeText={(text) => setEditingAssignment({
                      ...editingAssignment,
                      description: text
                    })}
                    className="border border-gray-300 p-3 rounded-lg mb-4"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    onPress={handleEditAssignment}
                    className="bg-blue-500 px-4 py-2 rounded-full"
                  >
                    <Text className="text-white text-center font-rubik">Update Assignment</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex h-full w-full bg-white relative">
      {role == "student" && (
        <>
          <View className="px-4 py-6 bg-white border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-3xl font-bold text-gray-800">
                  Classes
                </Text>
                <Text className="text-gray-500 mt-1">
                  List of available classes
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEnrollClassModalVisible(true)}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Enroll Class</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="book-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-400 mt-4 text-lg">No classes found</Text>
            <Text className="text-gray-400 text-sm">
              Enroll a class to get started
            </Text>
          </View>
        </>
      )}
      {role !== "student" && (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <ClassCard
              title={item.name}
              description={item.description}
              image={"https://placehold.co/400x100/000000/svg"} // Placeholder image URL
              days={item.days}
              code={item.code}
              time={item.time}
              onPress={() =>
                handleClassPress({
                  ...item,
                  image: "https://placehold.co/400x100/000000/svg",
                })
              } // Placeholder image URL
              key={item.$id}
            />
          )}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <View className="px-4 py-6 bg-white border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-3xl font-bold text-gray-800">
                    Classes
                  </Text>
                  <Text className="text-gray-500 mt-1">
                    List of available classes
                  </Text>
                </View>
                {role === "admin" && (
                  <TouchableOpacity
                    onPress={() => setIsAddClassModalVisible(true)}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-semibold">Add</Text>
                  </TouchableOpacity>
                )}
                {role === "student" && (
                  <TouchableOpacity
                    onPress={() => setIsEnrollClassModalVisible(true)}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-semibold">
                      Enroll Class
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="book-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-400 mt-4 text-lg">
                No classes found
              </Text>
              <Text className="text-gray-400 text-sm">
                Add a class to get started
              </Text>
            </View>
          )}
        />
      )}

      {role === "student" && (
        <Modal visible={isModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96">
              {selectedClass && (
                <>
                  <Image
                    source={{ uri: "https://placehold.co/600x400/png" }}
                    className="w-full h-52 rounded-lg mb-4"
                  />
                  <Text className="text-2xl font-bold mb-2">
                    {selectedClass.name}
                  </Text>
                  <Text className="text-base text-gray-600 mb-2">
                    {selectedClass.description}
                  </Text>
                  <Text className="text-base mb-2">
                    Time: {selectedClass.time}
                  </Text>
                  <Text className="text-base">Days: {selectedClass.days}</Text>
                  <Text className="text-base">Days: {selectedClass.code}</Text>

                  <View className="flex flex-row justify-between items-center mt-4">
                    <TouchableOpacity
                      onPress={() => setIsModalVisible(false)}
                      className="rounded-full"
                    >
                      <Text className="text-center">Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleEnrollPress(selectedClass)}
                      className="px-4 rounded-full bg-primary-300 py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-center font-rubik-medium text-white ">
                          Enroll Class
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      {role === "admin" && (
        <Modal visible={isAddClassModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96">
              <Text className="text-2xl font-bold mb-4">{modalTitle}</Text>
              <TextInput
                placeholder="Class Name"
                value={newClass.name}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, name: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="Description"
                value={newClass.description}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, description: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="code"
                value={newClass.code}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, code: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="Days (e.g. MWF)"
                value={newClass.days}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, days: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="Time (e.g. 1:00-2:30pm)"
                value={newClass.time}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, time: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <Picker
                selectedValue={newClass.faculty}
                onValueChange={(itemValue) => {
                  console.log(itemValue);
                  setNewClass({ ...newClass, faculty: itemValue });
                }}
                className="border border-gray-300 p-2 rounded mb-4"
              >
                {facultyList.map((faculty) => (
                  <Picker.Item
                    key={faculty.$id}
                    label={faculty.name}
                    value={faculty.user_id}
                  />
                ))}
              </Picker>
              <View className="flex flex-row justify-between items-center mt-4">
                <TouchableOpacity
                  onPress={() => setIsAddClassModalVisible(false)}
                  className="rounded-full"
                >
                  <Text className="text-center">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddOrUpdateClass}
                  className="px-4 rounded-full bg-primary-300 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center font-rubik-medium text-white ">
                      {buttonText}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {role === "student" && (
        <Modal visible={isEnrollClassModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96 mx-4">
              <Text className="text-2xl font-bold mb-4">Enroll in Class</Text>
              <Text className="text-gray-600 mb-4">
                Enter the class code provided by your instructor to enroll.
              </Text>

              <TextInput
                placeholder="Enter class code"
                value={classCode}
                onChangeText={setClassCode}
                className="border border-gray-300 p-3 rounded-lg mb-4"
                autoCapitalize="none"
              />

              <View className="flex flex-row justify-between items-center mt-4">
                <TouchableOpacity
                  onPress={() => {
                    setIsEnrollClassModalVisible(false);
                    setClassCode("");
                  }}
                  className="rounded-full"
                >
                  <Text className="text-center text-gray-600">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleEnrollPress}
                  className="px-6 py-2 rounded-full bg-blue-500"
                  disabled={loading || !classCode.trim()}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center font-rubik-medium text-white">
                      Enroll
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default Classes;
