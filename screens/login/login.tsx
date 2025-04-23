import { View, Text, Image, TextInput, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native'
import { styles } from './styles'
import { AntDesign } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import Fontisto from '@expo/vector-icons/Fontisto';


import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { useIsFocused } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

const etracslogo = require('../../assets/etracsLogo.png')

import Constants from "expo-constants";

const currentVersion = Constants.expoConfig.version

// 557a4295dcca1a044b690f8b6486f33d

export default function Login({ navigation }) {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true)
    const [checkbox, setCheckBox] = useState(false)

    const [readerInfo, setReaderInfo] = useState(null)

    const [etracsIP, setEtracsIP] = useState("")
    const [etracsPort, setEtracsPort] = useState("")

    const [uniqueId, setUniqueId] = useState('');
    const [registeredKey, setRegisteredKey] = useState('');

    const handleUserChange = (inputText) => {
        setUserName(inputText)
    }
    const handlePasswordChange = (inputText) => {
        setPassword(inputText)
    }

    const isFocused = useIsFocused()

    useEffect(() => {
        const getReaderInfo = async () => {
            const readerInformation = await AsyncStorage.getItem('readerInfo');
            if (readerInformation) {
                // navigation.navigate("Water")
                const parsedReaderInformation = await JSON.parse(readerInformation);
                setReaderInfo(parsedReaderInformation)
                console.log("reader", parsedReaderInformation)
                setError("Previous user has not logged out properly. Please use Offline Login.")
            }
            setLoading(false)
        }

        getReaderInfo();

        const getRegisteredKey = async () => {
            try {
                const regkey = await AsyncStorage.getItem('registeredKey');
                console.log(regkey, currentVersion)
                regkey && setRegisteredKey(registeredKey)
            } catch (e) {
                console.log(e)
            }
        }

        getRegisteredKey();

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
        const getDeviceUniqueId = async () => {
            try {
                const id = await DeviceInfo.getUniqueId();
                id && setUniqueId(id)
            } catch (e) {
                alert(e)
            }
        }

        getDeviceUniqueId();
    }, [])

    function generateHmacMD5(seed: string, v: string) {
        const hmac = CryptoJS.HmacMD5(v, seed);
        return hmac.toString();
    }

    const handleLogin = async () => {
        if (readerInfo) {
            return alert("Previous user has not logged out properly. Please use Offline Login.")
        }

        if (!username || !password) {
            setError('Please provide both username and password');
            return;
        }

        setLoading(true);

        const lowercasedUsername = username.toLowerCase().toString()
        const hash = await generateHmacMD5(lowercasedUsername, password);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort()
        }, 30000);

        try {
            const res = await fetch(`http://${etracsIP}:${etracsPort}/osiris3/json/etracs25/LoginService.login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Agent': `WaterMobileApp/${currentVersion}` },
                body: JSON.stringify({
                    env: {
                        CLIENTTYPE: 'mobile',
                        DEVICEID: uniqueId,
                        REGKEY: registeredKey,
                        APPVERSION: currentVersion
                    },
                    args: {
                        username: username,
                        password: hash
                    },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await res.json();
            const dataCopy = { ...data, userPassword: password }

            console.log("dataCopy", dataCopy)

            if (data.status === 'ERROR') {
                setError('Incorrect username or password');
            } else {
                delete dataCopy.env.ROLES;
                await AsyncStorage.setItem('readerInfo', JSON.stringify(dataCopy));
                setError('');
                setUserName('');
                setPassword('');
                navigation.navigate('Water');
            }
        } catch (error) {
            setError(`${error}`);
            console.error('Error during login:', error);
        } finally {
            setLoading(false);
        }
    };

    const offlineLogin = () => {
        if (!readerInfo) {
            return alert("No previous user data.");
        }

        const isUsernameValid = username.toLowerCase() === readerInfo.username.toLowerCase();
        const isPasswordValid = password === readerInfo.userPassword;

        if (isUsernameValid && isPasswordValid) {
            setLoading(true);
            setError("")
            setUserName('');
            setPassword('');
            setReaderInfo(null);
            setCheckBox(false)
            navigation.navigate("Water");
            setTimeout(() => {
                setLoading(false);
            }, 500);
        } else {
            setError("Username or Password is incorrect.");
        }
    }

    const handleServerSettings = () => {
        navigation.navigate("Login Server Settings")
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ flex: 1 }} size={50} color="#00669B" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={{ flex: 1, alignSelf: 'flex-end', justifyContent: 'center', marginRight: 20 }}>
                <TouchableOpacity onPress={handleServerSettings}>
                    <Ionicons name="settings-sharp" size={25} color={'#00669B'} />
                </TouchableOpacity>
            </View>
            <View style={{
                flex: 9,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Image
                    source={etracslogo}
                    style={styles.etracsLogo}
                />
                {error !== "" ? <Text style={styles.errorMsg}>{error}</Text> : null}
                <View style={styles.credentials}>
                    <AntDesign name="mail" size={17} color="grey" />
                    <TextInput placeholder='Username' value={username} onChangeText={handleUserChange} style={{ flex: 1 }} />
                </View>
                <View style={styles.credentials}>
                    <Feather name="lock" size={17} color="grey" />
                    <TextInput placeholder='Password' secureTextEntry={true} value={password} onChangeText={handlePasswordChange} style={{ flex: 1 }} />
                </View>
                <TouchableOpacity onPress={() => {
                    setCheckBox(!checkbox)
                }} style={{ width: 250, flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 10, marginLeft: 3 }}>
                    {!checkbox ?
                        <Fontisto name="checkbox-passive" size={15} color="grey" />
                        :
                        <Fontisto name="checkbox-active" size={15} color="grey" />
                    }
                    <Text style={{ color: "gray", fontSize: 12 }}>Offline Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.loginButton} onPress={!checkbox ? handleLogin : offlineLogin}>
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
                <Text></Text>
            </View>

        </View>
    )
}