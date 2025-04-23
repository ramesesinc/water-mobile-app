import { View, Text, Pressable, TouchableOpacity, Modal, ActivityIndicator, TextInput } from 'react-native'
import { useEffect, useState } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';


import { styles } from './styles'
import WaterHeader from '../../../components/Water/WaterHeader';

import * as SQLITE from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

import CryptoJS from 'crypto-js';
import DeviceInfo from 'react-native-device-info';

import Constants from "expo-constants";

const currentVersion = Constants.expoConfig.version

const db = SQLITE.openDatabase('example.db');

const ReadAndBill = ({ navigation }) => {
  const isFocused = useIsFocused()

  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const [bacthToDelete, setBatchToDelete] = useState("")
  const [loading, setLoading] = useState(true)

  const [adminPassword, setAdminPassword] = useState("")

  const [etracsIP, setEtracsIP] = useState("")
  const [etracsPort, setEtracsPort] = useState("")

  const [readerObj, setReaderObj] = useState(null)
  const [uniqueId, setUniqueId] = useState('');
  const [registeredKey, setRegisteredKey] = useState('');

  const controller = new AbortController();

  useEffect(() => {
    const getEnvObj = async () => {
      try {
        const readerInfo = await AsyncStorage.getItem('readerInfo');
        const storedObject = await JSON.parse(readerInfo);

        setReaderObj(storedObject)

        const id = await DeviceInfo.getUniqueId();
        id && setUniqueId(id)
        const regkey = await AsyncStorage.getItem('registeredKey');
        regkey && setRegisteredKey(registeredKey)

      } catch (e) {
        alert(e)
      }
    }

    getEnvObj();

  }, [])

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

  useEffect(() => {
    if (isFocused) {
      db.transaction(tx => {
        tx.executeSql(`SELECT * FROM sqlite_master WHERE type='table'`, null!,
          (txObj, resultSet) => {
            setList(resultSet.rows._array.filter((item) => item.name !== ("android_metadata" && "sqlite_sequence")))
          }
        )
      })
      setTimeout(() => {
        setLoading(false)
      }, 500)
    }
  }, [open, isFocused])

  const deleteBatch = async (batchName) => {
    if (adminPassword) {
      const lowercasedUsername = "sa".toLowerCase().toString()
      const hash = await generateHmacMD5(lowercasedUsername, adminPassword);

      const res = await fetch(`http://${etracsIP}:${etracsPort}/osiris3/json/etracs25/LoginService.login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          env: {
            CLIENTTYPE: 'mobile',
            USERID: readerObj.USERID,
            SESSIONID: readerObj.SESSIONID,
            DEVICEID: uniqueId,
            REGKEY: registeredKey,
            APPVERSION: currentVersion
          },
          args: {
            username: "sa",
            password: hash,
            deviceUniqueId: uniqueId
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
        db.transaction(tx => {
          tx.executeSql(`DROP TABLE ${batchName}`, null, (txObj, resultSet) => {
            console.log(`${batchName} has been deleted`)
          });
          tx.executeSql(`SELECT * FROM sqlite_master WHERE type='table'`, null!,
            (txObj, resultSet) => {
              setList(resultSet.rows._array.filter((item) => item.name !== ("android_metadata" && "sqlite_sequence")))
            }
          )
        }, () => console.log("error delete batch"), () => {
          AsyncStorage.removeItem(`${batchName}Start`);
          AsyncStorage.removeItem(`${batchName}`);
        })
        console.log("adminPassword:", adminPassword)
        setAdminPassword("")
        setOpen(false)
      }
      console.log("adminPass:", adminPassword)

    } else {
      setAdminPassword("")
      alert(`Please provide the admin password to remove ${bacthToDelete}.`)
    }

  }

  function generateHmacMD5(seed: string, v: string) {
    const hmac = CryptoJS.HmacMD5(v, seed);
    return hmac.toString();
  }

  const confirm = (name) => {
    setBatchToDelete(name)
    setOpen(true)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <WaterHeader navigation={navigation} />
        <ActivityIndicator style={{ flex: 1 }} size={50} color="#00669B" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WaterHeader navigation={navigation} backBut='Water Home' />
      {
        list.length > 0 ?
          <View style={styles.withBatchContainer}>
            <Text style={styles.select}>Select a Batch to View</Text>
            {list.map((item, index) => {
              const newName = item.name.toUpperCase()

              return (
                <View key={index} style={styles.batchListitem}>
                  <AntDesign name="caretright" size={15} color="black" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 20, flex: 3 }}>{newName.slice(0, 10)}</Text>
                  <View style={{ flexDirection: 'row', flex: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Pressable style={{ ...styles.view, backgroundColor: 'white' }}
                      onPress={() => confirm(item.name)}
                    >
                      <Ionicons name="trash-outline" size={20} color='rgba(0, 0, 0, 0.5)' />
                    </Pressable>
                    <TouchableOpacity style={{ ...styles.view, backgroundColor: 'white' }}
                      onPress={() => {
                        navigation.navigate('Batch Info', { batchname: item.name })
                      }}
                    >
                      <FontAwesome6 name="magnifying-glass" size={20} color="#00669B" />

                    </TouchableOpacity>
                  </View>
                </View>
              )
            }
            )}
          </View> :
          <View style={styles.noBatchContainer}>
            <Text style={{ textAlign: 'center', fontSize: 25 }}>No Batches Downloaded</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Download Batch')} style={styles.goToDownload}>
              <Text style={{ color: 'white' }}>Download Batches</Text>
            </TouchableOpacity>
          </View>
      }
      <Pressable onPress={() => navigation.navigate('Water Home')} style={styles.backButton}>
        <Text style={{ color: 'black' }}>Back to Home</Text>
      </Pressable>
      {open &&
        <Modal transparent={true} onRequestClose={() => setOpen(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <Text>Are you sure you want to delete batch {bacthToDelete} ?</Text>
              <View style={{ width: "auto", paddingVertical: 10, borderWidth: 1, borderColor: "gray", justifyContent: 'center', marginVertical: 20 }}>
                <TextInput placeholder='Admin Password' value={adminPassword} onChangeText={(text) => setAdminPassword(text)} secureTextEntry={true} style={{ marginHorizontal: 5 }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-around' }}>
                <TouchableOpacity style={{ ...styles.save, backgroundColor: 'white' }} onPress={() => {
                  setBatchToDelete("")
                  setOpen(false)
                }}>
                  <Text style={{ textAlign: 'center' }}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.save} onPress={() => deleteBatch(bacthToDelete)}>
                  <Text style={{ textAlign: 'center', color: 'white' }}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      }
    </View>
  )

}

export default ReadAndBill

