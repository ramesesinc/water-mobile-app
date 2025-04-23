import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { AntDesign } from '@expo/vector-icons';
import * as SQLITE from 'expo-sqlite'

import { styles } from './styles'
import WaterHeader from '../../../components/Water/WaterHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import Constants from "expo-constants";

const currentVersion = Constants.expoConfig.version

const UploadBatch = ({ navigation }) => {
  const [uploading, setUploading] = useState(false)
  const [completed, setCompleted] = useState(false);
  const [notDone, setNotDone] = useState([]);
  const [done, setDone] = useState([]);
  const [uploadStat, setUploadStat] = useState(null);
  const [err, setErr] = useState(null);
  const [toUpload, setToUpload] = useState("")

  const [serverObj, setServerObj] = useState(null)

  const [uniqueId, setUniqueId] = useState('');
  const [registeredKey, setRegisteredKey] = useState('');

  const db = SQLITE.openDatabase('example.db');
  
  useEffect(() => {
    navigation.setParams({ tabBarVisible: !uploading });
  }, [uploading]);

  useEffect(() => {
    const getIp = async () => {
      const serverObjectString = await AsyncStorage.getItem('serverObject');
      const serverObjectJSON = await JSON.parse(serverObjectString);

      setServerObj(serverObjectJSON)
    }

    getIp();
  }, [])

  useEffect(() => {
    const getDeviceUniqueId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        id && setUniqueId(id)
        const regkey = await AsyncStorage.getItem('registeredKey');
        regkey && setRegisteredKey(registeredKey)
      } catch (e) {
        alert(e)
      }
    }

    getDeviceUniqueId();
  }, [])

  const upLoadBatchNow = (batch, index) => {
    setUploading(true);
    setToUpload(batch.name)
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM ${batch.name}`, null,
        async (txObj, resultSet) => {
          const data = resultSet.rows._array;

          try {
            const initList = data.filter((user) => !user.uploaded).map((user) => {
              return {
                "batchid": user.batchid,
                "acctno": user.acctno,
                "prevreading": user.prevreading,
                "reading": user.reading,
                "volume": user.volume,
                "rate": user.rate,
                "hold": user.note ? {
                  message: user.note,
                  date: user.noteDate
                } : null
              }
            })

            const finalList = initList.filter((user) => (user.reading !== null && user.reading > 0) || (user.hold !== null))
            console.log("FinalList", finalList)

            const storedString = await AsyncStorage.getItem('readerInfo');
            if (storedString !== null) {
              const readerObj = JSON.parse(storedString);
              const res = await fetch(`http://${serverObj.water.ip}:${serverObj.water.port}/osiris3/json/enterprise/WaterMobileReadingService.uploadReadings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  env: {
                    CLIENTTYPE: "mobile",
                    USERID: readerObj.USERID,
                    SESSIONID: readerObj.SESSIONID,
                    DEVICEID: uniqueId,
                    REGKEY: registeredKey,
                    APPVERSION: currentVersion
                  },
                  args: { items: finalList }
                })
              });

              if (res.ok) {
                db.transaction(tx => {
                  tx.executeSql(`DROP TABLE ${batch.name}`, null, (txObj, resultSet) => {
                    AsyncStorage.removeItem(`${batch.name}Start`);
                    AsyncStorage.removeItem(`${batch.name}`);
                    const newList = [...notDone];
                    newList.splice(index, 1);
                    setNotDone(newList);
                    setDone([...done, batch]);
                    setUploadStat("Success")
                    setUploading(false);
                    setToUpload('')
                    setErr(`Batch: ${batch.name} has been uploaded`);
                    console.log(`${batch.name} now deleted/uploaded`);
                  });
                })
                setTimeout(() => {
                  setErr(null)
                }, 5000)
              }
            }
          } catch (error) {
            setUploading(false);
            setToUpload('')
            setUploadStat('Failed')
            setErr(`${batch.name} was not uploaded, cannot connect to the server.`)
            console.log("Error:", error);
            setTimeout(() => {
              setErr(null)
            }, 60000)
          }
        }
      );
    });
  };

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM sqlite_master WHERE type='table'`, null!,
        (txObj, resultSet) => {
          setNotDone(resultSet.rows._array.filter((item) => item.name !== ("android_metadata" && "sqlite_sequence")))
        }
      )
    })
  }, [])

  if (uploading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <WaterHeader navigation={navigation} />
        <View style={styles.uploading}>
          <Text style={{ padding: 20, fontSize: 30, textAlign: 'center' }}>Uploding Batch: {toUpload}</Text>
          <ActivityIndicator size={80} color='#00669B' />
        </View>
      </View>
    )
  }

  const oldNotDone = notDone.length

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WaterHeader navigation={navigation} backBut='Water Home' />
      <View style={styles.container}>
        <View style={styles.infoContainer}>
          <View style={styles.pagesContainer}>
            <Text style={completed ? styles.pages : { ...styles.pages, borderColor: '#00669B' }} onPress={() => setCompleted(false)}>Pending</Text>
            <Text style={!completed ? styles.pages : { ...styles.pages, borderColor: '#00669B' }} onPress={() => setCompleted(true)}>Completed</Text>
          </View>
          {/*Page to view according to state*/}
          {!completed ?
            <View style={{ flex: 1, justifyContent: 'space-between', }}>
              {notDone.length === 0 ?
                <View style={{ margin: 30, alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, textAlign: 'center' }}>No Pending Batches to be uploaded !</Text>
                </View> : null
              }
              <View >
                {notDone.map((item, index) => {
                  // const newName = `${item.name.slice(0, 2)}-${item.name.slice(2, 6)}-${item.name.slice(6)}`

                  return (
                    <View key={index} style={styles.pendintListitem}>
                      <Text>{item.name}</Text>
                      <Pressable style={{ padding: 5, paddingHorizontal: 10, backgroundColor: 'green' }}
                        onPress={() => upLoadBatchNow(item, index)}
                      >
                        <Text style={{ color: 'white' }}>Upload</Text>
                      </Pressable>
                    </View>
                  )
                }
                )}
              </View>
              {
                err && <Text style={uploadStat === "Failed" ? styles.error : { ...styles.error, color: 'green' }}>{err}</Text>
              }
            </View> :
            // Completed page
            <View style={{ padding: 10, paddingHorizontal: 20 }}>
              {done.map((item, index) => {
                // const newName = `${item.name.slice(0, 2)}-${item.name.slice(2, 6)}-${item.name.slice(6)}`

                return (
                  <View key={index} style={styles.doneBox}>
                    <AntDesign name="checksquare" size={17} color="green" />
                    <Text style={{ fontSize: 17 }}>{item.name}</Text>
                  </View>
                )
              }
              )}
            </View>
          }
        </View>
        <Pressable onPress={() => navigation.navigate('Water Home')} style={styles.backButton}>
          <Text style={{ color: 'black' }}>Back</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default UploadBatch;
