import { View, Text, Pressable, Modal, KeyboardAvoidingView } from 'react-native'
import { MaterialCommunityIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';


import { styles } from './styles'
import WaterHeader from '../../../components/Water/WaterHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLITE from 'expo-sqlite'
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import { useIsFocused } from '@react-navigation/native';

import Constants from "expo-constants";

const currentVersion = Constants.expoConfig.version

const WaterSettings = ({ navigation }) => {
  const db = SQLITE.openDatabase('example.db');

  const [open, setOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")

  const [etracsIP, setEtracsIP] = useState("")
  const [etracsPort, setEtracsPort] = useState("")

  const isFocused = useIsFocused()
  const controller = new AbortController();

  useEffect(() => {
    const getServerAdd = async () => {
      try {
        const serverObjectString = await AsyncStorage.getItem('serverObject');
        const serverObjectJSON = await JSON.parse(serverObjectString);

        if (serverObjectJSON) {
          setEtracsIP(serverObjectJSON.etracs.ip)
          setEtracsPort(serverObjectJSON.etracs.port)
        } else {
          setEtracsIP("localhost")
          setEtracsPort("8070")
        }

      } catch (e) {
        alert(e)
      }
    }
    if (isFocused) {
      getServerAdd();
    }
  }, [isFocused])

  function generateHmacMD5(seed: string, v: string) {
    const hmac = CryptoJS.HmacMD5(v, seed);
    return hmac.toString();
  }

  const clearData = async () => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('android_metadata', 'sqlite_sequence');`,
        [],
        (_, { rows }) => {
          // Step 2: Iterate over each table and drop it
          rows._array.forEach(({ name }) => {
            tx.executeSql(`DROP TABLE IF EXISTS ${name};`, [],
              () => {
                console.log(`Dropped table ${name}`);
              },
              (_, error) => {
                console.error(`Error dropping table ${name}:`, error);
                return true; // signal that an error occurred
              }
            );
          });
        },
        (_, error) => {
          console.error('Error retrieving table names:', error);
          return true; // signal that an error occurred
        }
      );
    });
    alert("Data Cleared")
  }

  const handleClearData = async () => {
    try {
      if (adminPassword) {
        const lowercasedUsername = "sa".toLowerCase().toString()
        const hash = await generateHmacMD5(lowercasedUsername, adminPassword);

        const res = await fetch(`http://${etracsIP}:${etracsPort}/osiris3/json/etracs25/LoginService.login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            env: {
              CLIENTTYPE: 'mobile',
            },
            args: {
              username: "sa",
              password: hash,
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await res.json();

        if (data.status === 'ERROR') {
          setAdminPassword("")
          alert("Incorrect Password")
        } else {
          await clearData();
          console.log("adminPassword:", adminPassword)
          setAdminPassword("")
          setOpen(false)
        }
      } else {
        alert("Please provide the admin password clear data.")
      }

    } catch (e) {
      alert(e)
    }

  }

  const handleLogout = async () => {
    try {
      if (adminPassword) {
        const lowercasedUsername = "sa".toLowerCase().toString()
        const hash = await generateHmacMD5(lowercasedUsername, adminPassword);

        const res = await fetch(`http://${etracsIP}:${etracsPort}/osiris3/json/etracs25/LoginService.login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            env: {
              CLIENTTYPE: 'mobile',
            },
            args: {
              username: "sa",
              password: hash,
            },
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await res.json();

        if (data.status === 'ERROR') {
          setAdminPassword("")
          alert("Incorrect Password")
        } else {
          await clearData();
          await AsyncStorage.removeItem('readerInfo')
          navigation.navigate("Login")
          console.log("adminPassword:", adminPassword)
          setAdminPassword("")
          setLogoutOpen(false)
        }
      } else {
        setAdminPassword("")
        alert("Please provide the admin password to logout.")
      }
    } catch (e) {
      alert(e)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WaterHeader navigation={navigation} />
      {logoutOpen &&
        <Modal transparent={true} onRequestClose={() => setOpen(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <Text>Please be advised that all data will be cleared once logged out. Do you want to continue?</Text>
              <View style={{ width: "auto", paddingVertical: 10, borderWidth: 1, borderColor: "gray", justifyContent: 'center', marginVertical: 20 }}>
                <TextInput placeholder='Admin Password' value={adminPassword} onChangeText={(text) => setAdminPassword(text)} secureTextEntry={true} style={{ marginHorizontal: 5 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-around' }}>
                <Pressable style={{ ...styles.save, backgroundColor: 'white' }} onPress={() => {
                  setLogoutOpen(false)
                }}>
                  <Text style={{ textAlign: 'center' }}>No</Text>
                </Pressable>
                <Pressable style={styles.save} onPress={handleLogout}>
                  <Text style={{ textAlign: 'center', color: 'white' }}>Yes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      }
      {open &&
        <Modal transparent={true} onRequestClose={() => setOpen(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <Text>Are you sure you want to Clear All Data?</Text>
              <View style={{ width: "auto", paddingVertical: 10, borderWidth: 1, borderColor: "gray", justifyContent: 'center', marginVertical: 20 }}>
                <TextInput placeholder='Admin Password' value={adminPassword} onChangeText={(text) => setAdminPassword(text)} secureTextEntry={true} style={{ marginHorizontal: 5 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-around' }}>
                <Pressable style={{ ...styles.save, backgroundColor: 'white' }} onPress={() => {
                  setOpen(false)
                }}>
                  <Text style={{ textAlign: 'center' }}>No</Text>
                </Pressable>
                <Pressable style={styles.save} onPress={() => handleClearData()}>
                  <Text style={{ textAlign: 'center', color: 'white' }}>Yes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      }
      <View style={styles.container}>
        <TouchableOpacity style={styles.options} onPress={() => navigation.navigate("Header Settings")}>
          <MaterialCommunityIcons name="printer" size={20} color="#00669B" />
          <Text style={styles.optionsText}>Headers Set-up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.options} onPress={() => navigation.navigate("Server Settings")}>
          <FontAwesome name="server" size={20} color="#00669B" />
          <Text style={styles.optionsText}>Server Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.options} onPress={() => setOpen(true)}>
          <MaterialCommunityIcons name="archive-remove" size={20} color="#00669B" />
          <Text style={styles.optionsText}>Clear Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.options} onPress={() => setLogoutOpen(true)}>
          <MaterialCommunityIcons name="logout" size={20} color="#00669B" />
          <Text style={styles.optionsText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior="height" style={{ height: 50, backgroundColor: 'white' }}>
                      <Text style={{ color: 'black', textAlign: 'center', alignSelf: 'center', flex: 1 }}>Version {currentVersion}</Text>
                  </KeyboardAvoidingView>
    </View>
  )
}

export default WaterSettings

function generateHmacMD5(lowercasedUsername: string, password: any) {
  throw new Error('Function not implemented.');
}
