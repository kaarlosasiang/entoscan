import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { database, config, avatar, account } from "@/lib/appwrite";
import { Query } from "react-native-appwrite";
import { Ionicons } from "@expo/vector-icons";
import { ID } from "appwrite";

interface Faculty {
  $id: string;
  name: string;
  user_id: string;
}

const Faculties = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const getFaculties = async () => {
      try {
        const response = await database.listDocuments(
          config.db,
          config.facultiesCollectionId,
          [Query.orderAsc("name")]
        );
        setFaculties(response.documents as Faculty[]);
      } catch (error) {
        console.error("Error fetching faculties:", error);
      } finally {
        setLoading(false);
      }
    };

    getFaculties();
  }, []);

  const handleAddFaculty = async () => {
    if (!newFacultyName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    console.log(ID.unique(), email, password, newFacultyName.trim());

    setIsSubmitting(true);
    try {
      // Create new user account
      const newUser = await account.create(
        ID.unique(),
        email,
        password,
        newFacultyName.trim()
      );
      console.log("User created:", newUser);

      // Create faculty document with user info
      const newFaculty = await database.createDocument(
        config.db,
        config.facultiesCollectionId,
        ID.unique(),
        {
          name: newFacultyName.trim(),
          user_id: newUser.$id
        }
      );

      setFaculties((prev) => [...prev, newFaculty as Faculty]);
      setNewFacultyName("");
      setEmail("");
      setPassword("");
      setIsModalVisible(false);
      Alert.alert("Success", "Faculty account created successfully");
    } catch (error: any) {
      console.error("Error creating faculty:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-6 bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-gray-800">Faculties</Text>
            <Text className="text-gray-500 mt-1">Manage your faculty list</Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="bg-blue-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={faculties}
        keyExtractor={(item) => item.$id}
        contentContainerClassName="p-4"
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Image
                  source={{
                    uri: avatar.getInitials(item.name).toString(),
                  }}
                  className="w-12 h-12 rounded-full bg-gray-100"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-semibold text-gray-800">
                    {item.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Faculty ID: {item.$id.slice(0, 8)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="school-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-400 mt-4 text-lg">
              No faculties found
            </Text>
            <Text className="text-gray-400 text-sm">
              Add a faculty to get started
            </Text>
          </View>
        )}
      />

      {/* Add Faculty Modal */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Add New Faculty
            </Text>

            <TextInput
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 mb-4"
              placeholder="Full Name"
              value={newFacultyName}
              onChangeText={setNewFacultyName}
              autoCapitalize="words"
            />

            <TextInput
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 mb-4"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <TextInput
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 mb-4"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  setNewFacultyName("");
                  setEmail("");
                  setPassword("");
                }}
                className="flex-1 py-3 rounded-lg bg-gray-100"
                disabled={isSubmitting}
              >
                <Text className="text-center text-gray-600 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddFaculty}
                className="flex-1 py-3 rounded-lg bg-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-white font-semibold">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Faculties;
