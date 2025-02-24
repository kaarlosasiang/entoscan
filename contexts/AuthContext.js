import LoadingPage from "@/app/components/LoadingPage";
import { account, avatar } from "@/lib/appwrite";
import { useContext, createContext, useState, useEffect } from "react";
import { ActivityIndicator, SafeAreaView, Text } from "react-native";
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(false);
  const [user, setUser] = useState(false);

  useEffect(() => {
    init();
  });

  const init = async () => {
    checkAuth();
  };

  const checkAuth = async () => {
    try {
      const responseSession = await account.getSession("current");
      setSession(responseSession);

      const responseUser = await account.get();
      const userAvatar = avatar.getInitials(responseUser.name);
      setUser({ ...responseUser, avatar: userAvatar.toString() });
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signin = async ({ email, password }) => {
    console.log(email);
    console.log(password);

    setIsLoading(true);
    try {
      const responseSession = await account.createEmailPasswordSession(
        email,
        password
      );

      setSession(responseSession);
      const responseUser = await account.get();
      setUser(responseUser);
    } catch (error) {
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  const signout = async () => {};

  const contextData = { session, user, signin, signout };
  return (
    <AuthContext.Provider value={contextData}>
      {isLoading ? <LoadingPage /> : children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  return useContext(AuthContext);
};

export { useAuth, AuthContext, AuthProvider };
