import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  Platform,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";

import Constants from "expo-constants";

import WaterModuleTab from "./navigation/Water/WaterModuleTab";
import LoginStack from "./navigation/Water/loginStack";
import WaterHeader from "./components/Water/WaterHeader";
import VersionCheckModal from "./screens/WaterModule/Others/versionCheckModal";

import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import verifyKey from "./others/DeviceInfoUtil-version2";
import encode from "./others/encoder";

const currentVersion = Constants.expoConfig.version;
const Stack = createStackNavigator();

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.ramesesdevapps.etracswater";

export default function App() {
  const [uniqueId, setUniqueId] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [verificationResult, setVerificationResult] = useState(false);

  const [registrationKey, setRegistrationKey] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showUpdate, setShowUpdate] = useState(false);

  // const [versionCheckTrigger, setVersionCheckTrigger] = useState(0);

  useEffect(() => {
    const checkDeviceIfRegistered = async () => {
      try {
        const type = Platform.OS;
        const id = await DeviceInfo.getUniqueId();

        const result = await AsyncStorage.getItem("registeredKey");
        const encodedKey = encode(id);

        if (result === encodedKey) {
          setVerificationResult(true);
        } else {
          setUniqueId(id);
          setDeviceType(type);
        }
      } catch (e) {
        alert(e);
      } finally {
        setLoading(false);
        console.log("loading to false");
      }
    };

    checkDeviceIfRegistered();
  }, []);

  useEffect(() => {
    const versionCheck = async () => {
      try {
        const response = await fetch("https://etracswaterversion.vercel.app");

        const data = await response.json();

        if (data.latestVersion && data.latestVersion !== currentVersion) {
          setShowUpdate(true);
        }
      } catch (e) {
        console.log(e);
      }
    };

    versionCheck();
  }, []);

  const handleRegister = async () => {
    try {
      setLoading(true);
      if (registrationKey) {
        const isValid = verifyKey(uniqueId, registrationKey);
        if (isValid) {
          await AsyncStorage.setItem("registeredKey", registrationKey);
          setVerificationResult(isValid);
          setError(false);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (e) {
      alert(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
        }}
      >
        <ActivityIndicator style={{ flex: 1 }} size={50} color="#00669B" />
      </View>
    );
  }

  if (!verificationResult && !loading) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar backgroundColor="black" barStyle="light-content" />
        <VersionCheckModal
          visible={showUpdate}
          onClose={() => setShowUpdate(false)}
        />
        <WaterHeader />
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ marginBottom: 10, marginLeft: 10, fontSize: 16 }}>
            Device Type:
          </Text>
          <Text style={{ marginBottom: 10, marginLeft: 10, fontSize: 20 }}>
            {deviceType}
          </Text>
          <Text style={{ marginBottom: 10, marginLeft: 10, fontSize: 16 }}>
            Device Id:
          </Text>
          <Text style={{ marginBottom: 10, marginLeft: 10, fontSize: 20 }}>
            {uniqueId}
          </Text>
          <Text style={{ marginBottom: 10, marginLeft: 10, fontSize: 16 }}>
            Registration Key:
          </Text>
          <View
            style={{
              borderWidth: 1,
              marginHorizontal: 10,
              padding: 5,
              marginBottom: 20,
            }}
          >
            <TextInput
              style={{ marginHorizontal: 5, fontSize: 20 }}
              value={registrationKey}
              onChangeText={(text) => setRegistrationKey(text)}
            />
          </View>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleRegister}
              style={{
                width: 100,
                alignItems: "center",
                backgroundColor: "#00669B",
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "white" }}>Submit</Text>
            </TouchableOpacity>
          </View>
          {error && (
            <View
              style={{ marginHorizontal: 10, padding: 5, marginBottom: 20 }}
            >
              <Text style={{ color: "red", textAlign: "center" }}>
                Invalid Registration Key
              </Text>
            </View>
          )}
        </View>
        <KeyboardAvoidingView behavior="height" style={{ height: 50 }}>
          <Text
            style={{
              color: "black",
              textAlign: "center",
              alignSelf: "center",
              flex: 1,
            }}
          >
            Version {currentVersion}
          </Text>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor="black" barStyle="light-content" />
      <VersionCheckModal
        visible={showUpdate}
        onClose={() => setShowUpdate(false)}
      />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            name="Login"
            component={LoginStack}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              title: "Water Module",
              headerTintColor: "white",
              headerTitleAlign: "center",
              headerStyle: {
                backgroundColor: "#00669B",
              },
            }}
            name="Water"
            component={WaterModuleTab}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
