import React, {useEffect, useState} from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import * as OkaySdk from 'react-native-okay-sdk';
import messaging from '@react-native-firebase/messaging';

let deviceToken;
let installationID = Platform.OS === 'android' ? '9990' : '9980';
const pubPssBase64 =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxgyacF1NNWTA6rzCrtK60se9fVpTPe3HiDjHB7MybJvNdJZIgZbE9k3gQ6cdEYgTOSG823hkJCVHZrcf0/AK7G8Xf/rjhWxccOEXFTg4TQwmhbwys+sY/DmGR8nytlNVbha1DV/qOGcqAkmn9SrqW76KK+EdQFpbiOzw7RRWZuizwY3BqRfQRokr0UBJrJrizbT9ZxiVqGBwUDBQrSpsj3RUuoj90py1E88ExyaHui+jbXNITaPBUFJjbas5OOnSLVz6GrBPOD+x0HozAoYuBdoztPRxpjoNIYvgJ72wZ3kOAVPAFb48UROL7sqK2P/jwhdd02p/MDBZpMl/+BG+qQIDAQAB';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    console.log('Authorization status:', authStatus);
    messaging()
      .getToken()
      .then(token => {
        console.log('Token: ', token);
        OkaySdk.updateDeviceToken(token || '');
      });
  }
}

async function initSdk() {
  try {
    requestUserPermission();
    const response = await OkaySdk.initOkay({
      initData: {
        okayUrlEndpoint: 'https://demostand.okaythis.com',
        resourceProvider: {
          biometricAlertReasonText: 'Test Alert',
        },
      },
    });
    console.log('Init sdk status: ', response.initStatus);
  } catch (error) {
    console.error('Error init sdk', error);
  }
}

const App = () => {
  const [linkingCode, setCode] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [externalId, setExternalId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    initSdk();
    const unsubscribe = messaging().onMessage(async message => {
      const data = JSON.parse(message.data.data);
      console.log('SessionId: ', data.sessionId);
      const response = await OkaySdk.startAuthorization({
        SpaAuthorizationData: {
          sessionId: data.sessionId,
          appPns: deviceToken,
        },
      });
      console.log(response);
    });
    return unsubscribe;
  }, []);

  const enrollDevice = async () => {
    try {
      console.log('get token');
      deviceToken = await messaging().getToken();
      setToken(deviceToken);
      console.log('token: ', deviceToken);
      const response = await OkaySdk.startEnrollment({
        SpaEnrollData: {
          appPns: deviceToken,
          pubPss: pubPssBase64,
          enrollInBackground: true,
          installationId: installationID,
        },
      });
      console.log('Enroll response: ', response);
      let parsedData = JSON.parse(response);
      setExternalId(parsedData.externalId);
    } catch (error) {
      console.error('Error enrollment: ', error);
    }
  };

  const linkDevice = async () => {
    try {
      const linkResult = await OkaySdk.linkTenant(linkingCode, {
        SpaStorage: {
          appPns: token,
          pubPss: pubPssBase64,
          externalId: externalId,
          installationId: installationID,
          enrollmentId: null,
        },
      });
      console.log('Link tenant response: ', linkResult);
    } catch (error) {
      console.error(error);
    }
  };
  const unlinkDevice = async () => {
    try {
      const unlinkResult = await OkaySdk.unlinkTenant(tenantId, {
        SpaStorage: {
          appPns: token,
          pubPss: pubPssBase64,
          externalId: externalId,
          installationId: installationID,
          enrollmentId: null,
        },
      });
      console.log('Unlink tenant response: ', unlinkResult);
    } catch (error) {
      console.error(error);
    }
  };
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
    height: '80%',
  },
  button: {
    width: 200,
    height: 75,
    backgroundColor: 'blue',
    color: 'white',
    justifyContent: 'center',
    margin: 10,
  },
  buttonText: {
    color: 'white',
    alignSelf: 'center',
  },
});

export default App;
