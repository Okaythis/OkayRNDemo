
import React, { useEffect, useState } from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import {RNOkaySdk} from 'react-native-okay-sdk'
import messaging from '@react-native-firebase/messaging'

const pubPssBase64 = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxgyacF1NNWTA6rzCrtK60se9fVpTPe3HiDjHB7MybJvNdJZIgZbE9k3gQ6cdEYgTOSG823hkJCVHZrcf0/AK7G8Xf/rjhWxccOEXFTg4TQwmhbwys+sY/DmGR8nytlNVbha1DV/qOGcqAkmn9SrqW76KK+EdQFpbiOzw7RRWZuizwY3BqRfQRokr0UBJrJrizbT9ZxiVqGBwUDBQrSpsj3RUuoj90py1E88ExyaHui+jbXNITaPBUFJjbas5OOnSLVz6GrBPOD+x0HozAoYuBdoztPRxpjoNIYvgJ72wZ3kOAVPAFb48UROL7sqK2P/jwhdd02p/MDBZpMl/+BG+qQIDAQAB'
const App = () => {
  const [linkingCode, setCode] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [externalId, setExternalId] = useState('');
  const [token, setToken] = useState('')

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNOkaySdk.permissionRequest()
      RNOkaySdk.init("https://demostand.okaythis.com").then(response => {
        console.log('init: ', response)
      });

      const unsubscribe = messaging().onMessage(message => {
        console.log('message: ', message);
      });
      return unsubscribe;
    }
  }, [])

  const enrollDevice = async() => {
    try {
      const deviceToken = await messaging().getToken()
      setToken(deviceToken)
      console.log('token: ', deviceToken)
      const response = await RNOkaySdk.enrollProcedure({
        SpaEnrollData: {
          host: "https://demostand.okaythis.com", // Okay server address
          appPns: deviceToken,
          pubPss: pubPssBase64, 
          installationId: "9990", 
        }
      })
      console.log('ext: ', response.externalId);
      setExternalId(response.externalId);
    } catch(error) {
      console.error('error: ', error);
    }
  }

  const linkDevice = async() => {
    try{
      const linkResult = await RNOkaySdk.linkTenant(
        linkingCode,
        {
          SpaStorage: {
            appPns: token,
            pubPss: pubPssBase64,
            externalId: externalId,
            installationId: "9990",
            enrollmentId: null
          }
        })
      console.log('linkResult: ', linkResult)
    } catch(error) {
      console.error(error);
    }
  }
  const unlinkDevice = async() => {
    try {
      const unlinkResult = await RNOkaySdk.unlinkTenant(
        tenantId,
        {
          SpaStorage: {
            appPns: token,
            pubPss: pubPssBase64,
            externalId: externalId,
            installationId: "9990",
            enrollmentId: null
          }
      })
      console.log('unlinkRes: ', unlinkResult);
    } catch(error) {
      console.error(error);
    }
  }
  return (
    <SafeAreaView>
      <Text>Your externalId: {externalId}</Text>
      <Text>Your deviceToken: {token}</Text>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={enrollDevice}>
          <Text style={styles.buttonText}>Enroll device</Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Enter linking code"
          value={linkingCode}
          onChangeText={setCode}
        />
        <TouchableOpacity style={styles.button} onPress={linkDevice}>
          <Text style={styles.buttonText}>Link device</Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Enter tenant ID"
          value={tenantId}
          onChangeText={setTenantId}
        />
        <TouchableOpacity style={styles.button} onPress={unlinkDevice}>
          <Text style={styles.buttonText}>Unlink tenant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '80%'
  },
  button: {
    width: 200,
    height: 75,
    backgroundColor: 'blue',
    color: 'white',
    justifyContent: 'center',
    margin: 10
  },
  buttonText: {
    color: 'white',
    alignSelf: 'center'
  }
});

export default App;
